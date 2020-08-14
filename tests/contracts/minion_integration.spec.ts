import { waffle } from "@nomiclabs/buidler";
import chai from "chai";
import { ethers } from "ethers";
import { deployContract, solidity } from "ethereum-waffle";

import MinionArtifact from "../../build/artifacts/Minion.json";
import MolochArtifact from "../../build/artifacts/Moloch.json";
import TokenArtifact from "../../build/artifacts/Token.json";
import TargetMockArtifact from "../../build/artifacts/TargetMock.json";
import RevertingMolochArtifact from "../../build/artifacts/RevertingMoloch.json";
import { Minion } from "../../build/types/Minion";
import { Moloch } from "../../build/types/Moloch";
import { Token } from "../../build/types/Token";
import { TargetMock } from "../../build/types/TargetMock";
import { RevertingMoloch } from "../../build/types/RevertingMoloch";

import { Action, Proposal } from "./utils/types";
import Constants from "./utils/constants";
import Utils from "./utils/utils";

chai.use(solidity);
const { expect } = chai;

describe("Minion integration", () => {
  const provider = waffle.provider;
  const [wallet, eoa] = provider.getWallets();

  let minion: Minion;
  let moloch: Moloch;
  let token: Token;
  let target: TargetMock;

  beforeEach(async () => {
    token = (await deployContract(wallet, TokenArtifact, [
      Constants.MaxUint256
    ])) as Token;

    moloch = (await deployContract(
      wallet,
      MolochArtifact,
      [
        wallet.address,
        [token.address],
        Constants.molochConfig.PERIOD_DURATION_IN_SECONDS,
        Constants.molochConfig.VOTING_DURATON_IN_PERIODS,
        Constants.molochConfig.GRACE_DURATON_IN_PERIODS,
        Constants.molochConfig.PROPOSAL_DEPOSIT,
        Constants.molochConfig.DILUTION_BOUND,
        Constants.molochConfig.PROCESSING_REWARD
      ],
      { gasLimit: 9500000 }
    )) as Moloch;

    minion = (await deployContract(wallet, MinionArtifact, [
      moloch.address
    ])) as Minion;

    target = (await deployContract(wallet, TargetMockArtifact)) as TargetMock;
    await token.approve(moloch.address, Constants.MaxUint256);
  });

  it("deploys correctly", async () => {
    expect(minion.address).to.not.eq(Constants.AddressZero);
    expect(await minion.moloch()).to.eq(moloch.address);
    expect(await minion.molochApprovedToken()).to.eq(token.address);
    expect(await minion.MINION_ACTION_DETAILS()).to.eq(
      Constants.MINION_ACTION_DETAILS
    );
  });

  describe("proposeAction", () => {
    describe("success cases", () => {
      let action: Action;
      let proposal: Proposal;

      beforeEach(async () => {
        action = {
          to: target.address,
          value: ethers.utils.parseEther("1"),
          data: ethers.utils.hexlify(ethers.utils.randomBytes(50)),
          description: "foo",
          proposalId: 0,
          queueIndex: 0
        };
        proposal = {
          applicant: minion.address,
          proposer: minion.address,
          sharesRequested: 0,
          lootRequested: 0,
          tributeOffered: 0,
          tributeToken: token.address,
          paymentRequested: 0,
          paymentToken: token.address,
          details: Utils.encodeDetailsString(action.description)
        };
        await minion.proposeAction(
          action.to,
          action.value,
          action.data,
          action.description
        );
      });

      it("stores the correct action", async () => {
        const storedAction = await minion.actions(action.proposalId);
        expect(storedAction.to).to.equal(action.to);
        expect(storedAction.value).to.equal(action.value);
        expect(storedAction.data).to.equal(action.data);
        expect(storedAction.proposer).to.equal(wallet.address);
        expect(storedAction.executed).to.equal(false);
      });

      it("submits the correct proposal to parent moloch", async () => {
        const storedProposal = await moloch.proposals(action.proposalId);
        const proposalFlags = await moloch.getProposalFlags(action.proposalId);
        expect(proposalFlags).to.deep.equal([
          false,
          false,
          false,
          false,
          false,
          false
        ]);
        expect(storedProposal.applicant).to.equal(proposal.applicant);
        expect(storedProposal.proposer).to.equal(proposal.proposer);
        expect(storedProposal.sponsor).to.equal(Constants.AddressZero);
        expect(storedProposal.sharesRequested).to.equal(
          proposal.sharesRequested
        );
        expect(storedProposal.lootRequested).to.equal(proposal.lootRequested);
        expect(storedProposal.tributeOffered).to.equal(proposal.tributeOffered);
        expect(storedProposal.tributeToken).to.equal(proposal.tributeToken);
        expect(storedProposal.paymentRequested).to.equal(
          proposal.paymentRequested
        );
        expect(storedProposal.paymentToken).to.equal(proposal.paymentToken);
        expect(storedProposal.details).to.equal(proposal.details);
      });

      it("emits expected events", async () => {
        const proposalId = 1;
        await expect(
          minion.proposeAction(
            action.to,
            action.value,
            action.data,
            action.description
          )
        )
          .to.emit(minion, "ActionProposed")
          .withArgs(proposalId, wallet.address)
          .to.emit(moloch, "SubmitProposal")
          .withArgs(
            proposal.applicant,
            proposal.sharesRequested,
            proposal.lootRequested,
            proposal.tributeOffered,
            proposal.tributeToken,
            proposal.paymentRequested,
            proposal.paymentToken,
            proposal.details,
            [false, false, false, false, false],
            proposalId,
            minion.address,
            Constants.AddressZero
          );
      });
    });

    describe("failure cases", () => {
      it("reverts on proposal by non-member", async () => {
        const action = {
          to: target.address,
          value: ethers.utils.parseEther("1"),
          data: ethers.utils.hexlify(ethers.utils.randomBytes(50)),
          description: "foo",
          proposalId: 0,
          queueIndex: 0
        };

        await expect(
          minion
            .connect(eoa)
            .proposeAction(
              action.to,
              action.value,
              action.data,
              action.description
            )
        ).to.be.revertedWith(Constants.revertStrings.NOT_MEMBER);
      });

      it("reverts proposal to zero address", async () => {
        const badAction = {
          to: Constants.AddressZero,
          value: ethers.utils.parseEther("1"),
          data: ethers.utils.hexlify(ethers.utils.randomBytes(50)),
          description: "foo"
        };
        await expect(
          minion.proposeAction(
            badAction.to,
            badAction.value,
            badAction.data,
            badAction.description
          )
        ).to.be.revertedWith(Constants.revertStrings.INVALID_PROP_TARGET);
      });

      it("reverts proposal to moloch", async () => {
        const badAction = {
          to: moloch.address,
          value: ethers.utils.parseEther("1"),
          data: ethers.utils.hexlify(ethers.utils.randomBytes(50)),
          description: "foo"
        };
        await expect(
          minion.proposeAction(
            badAction.to,
            badAction.value,
            badAction.data,
            badAction.description
          )
        ).to.be.revertedWith(Constants.revertStrings.INVALID_PROP_TARGET);
      });

      it("reverts if moloch proposal fails", async () => {
        const action = {
          to: target.address,
          value: ethers.utils.parseEther("1"),
          data: ethers.utils.hexlify(ethers.utils.randomBytes(50)),
          description: "foo"
        };
        const revertingMoloch = (await deployContract(
          wallet,
          RevertingMolochArtifact
        )) as Moloch;
        const revertingMinion = (await deployContract(wallet, MinionArtifact, [
          revertingMoloch.address
        ])) as Minion;
        await expect(
          revertingMinion.proposeAction(
            action.to,
            action.value,
            action.data,
            action.description
          )
        ).to.be.revertedWith(Constants.revertStrings.none);
      });
    });
  });

  describe("cancelAction", () => {
    beforeEach(async () => {
      const action = {
        to: target.address,
        value: ethers.utils.parseEther("1"),
        data: ethers.utils.hexlify(ethers.utils.randomBytes(50)),
        description: "foo",
        proposalId: 0,
        queueIndex: 0
      };

      await minion.proposeAction(
        action.to,
        action.value,
        action.data,
        action.description
      );
    });

    describe("successCases", () => {
      // check that balance is updated? -- no tribute actually
      const propId = 0;
      it("cancels the proposal", async () => {
        await minion.cancelAction(propId);

        // cancels proposal in the moloch
        const flags = await moloch.getProposalFlags(propId);
        expect(flags[3]).to.be.true;

        // deletes action from the minion
        const action = await minion.actions(propId);
        expect(action.to).to.eq(Constants.AddressZero);
        expect(action.value).to.eq(0);
        expect(action.proposer).to.eq(Constants.AddressZero);
        expect(action.executed).to.be.false;
        expect(action.data).to.eq("0x");
      });

      it("emits expected events", async () => {
        await expect(minion.cancelAction(propId))
          .to.emit(minion, "ActionCanceled")
          .withArgs(propId)
          .to.emit(moloch, "CancelProposal")
          .withArgs(propId, minion.address);
      });
    });

    describe("failureCases", () => {
      it("fails if caller not proposer", async () => {
        await expect(minion.connect(eoa).cancelAction(0)).to.be.revertedWith(
          Constants.revertStrings.NOT_PROPOSER
        );
      });

      it("fails if proposal not from minion", async () => {
        // TODO: submit proposal from moloch
        await Utils.incProposalCount(moloch, 1);
        await expect(minion.cancelAction(1)).to.be.revertedWith(
          Constants.revertStrings.NOT_PROPOSER
        );
      });

      it("fails if prop already sponsored", async () => {
        await moloch.sponsorProposal(0);
        await expect(minion.cancelAction(0)).to.be.revertedWith(
          Constants.revertStrings.moloch.SPONSORED
        );
      });
    });
  });

  describe("executeAction", () => {
    describe("success cases", () => {
      let action1: Action, action2: Action, emptyAddressAction: Action;

      beforeEach(async () => {
        await Utils.incProposalCount(moloch, 1);
        action1 = {
          to: target.address,
          value: ethers.utils.parseEther("0"),
          data: "0x",
          description: "foo",
          proposalId: 1,
          queueIndex: 0
        };
        action2 = {
          to: target.address,
          value: ethers.utils.parseEther("1"),
          data: ethers.utils.hexlify(ethers.utils.randomBytes(50)),
          description: "foo",
          proposalId: 2,
          queueIndex: 1
        };
        emptyAddressAction = {
          to: eoa.address,
          value: ethers.utils.parseEther("0"),
          data: ethers.utils.hexlify(ethers.utils.randomBytes(50)),
          description: "foo",
          proposalId: 3,
          queueIndex: 2
        };
        await Utils.proposeAndPass(minion, moloch, action1);
        await Utils.proposeAndPass(minion, moloch, action2);
        await Utils.proposeAndPass(minion, moloch, emptyAddressAction);
      });

      it("executes a passed proposal", async () => {
        await expect(minion.executeAction(action1.proposalId))
          .to.emit(minion, "ActionExecuted")
          .withArgs(action1.proposalId, wallet.address)
          .to.emit(target, "Called")
          .withArgs(minion.address, action1.value, action1.data);
        expect((await minion.actions(action1.proposalId)).executed).to.be.true;
      });

      it("executes proposal with data and value", async () => {
        await wallet.sendTransaction({
          to: minion.address,
          value: action2.value
        });
        await expect(minion.executeAction(action2.proposalId))
          .to.emit(minion, "ActionExecuted")
          .withArgs(action2.proposalId, wallet.address)
          .to.emit(target, "Called")
          .withArgs(minion.address, action2.value, action2.data);
        expect((await minion.actions(action2.proposalId)).executed).to.be.true;
        expect(await provider.getBalance(target.address)).to.equal(
          action2.value
        );
      });

      it("executes actions in any order", async () => {
        await wallet.sendTransaction({
          to: minion.address,
          value: action2.value
        });
        await expect(minion.executeAction(action2.proposalId))
          .to.emit(minion, "ActionExecuted")
          .withArgs(action2.proposalId, wallet.address)
          .to.emit(target, "Called")
          .withArgs(minion.address, action2.value, action2.data);
        expect((await minion.actions(action2.proposalId)).executed).to.be.true;

        await expect(minion.executeAction(action1.proposalId))
          .to.emit(minion, "ActionExecuted")
          .withArgs(action1.proposalId, wallet.address)
          .to.emit(target, "Called")
          .withArgs(minion.address, action1.value, action1.data);
        expect((await minion.actions(action1.proposalId)).executed).to.be.true;
      });

      // *** Be aware that calls to empty addresses should succeed,
      // even if they contain data.
      it("SUCCESSFULLY sends data to an EMPTY address", async () => {
        await minion.executeAction(emptyAddressAction.proposalId);
      });
    });

    describe("failure cases", () => {
      let unpassedAction: Action,
        valueAction: Action,
        actionToMoloch: Action,
        executedAction: Action,
        failingCallAction: Action;

      beforeEach(async () => {
        unpassedAction = {
          to: target.address,
          value: ethers.utils.parseEther("0"),
          data: "0x",
          description: "foo",
          proposalId: 0,
          queueIndex: 0
        };
        valueAction = {
          to: target.address,
          value: ethers.utils.parseEther("1"),
          data: "0x",
          description: "foo",
          proposalId: 1,
          queueIndex: 0
        };
        executedAction = {
          to: target.address,
          value: ethers.utils.parseEther("0"),
          data: "0x",
          description: "foo",
          proposalId: 2,
          queueIndex: 1
        };
        failingCallAction = {
          to: target.address,
          value: ethers.utils.parseEther("0"),
          data: new ethers.utils.Interface(TargetMockArtifact.abi).functions
            .fail.sighash,
          description: "foo",
          proposalId: 3,
          queueIndex: 2
        };

        // these executions need to stay in order to line up with the
        // proposalIds and queueIndices above. Sorry..
        await minion.proposeAction(
          unpassedAction.to,
          unpassedAction.value,
          unpassedAction.data,
          unpassedAction.description
        );
        await Utils.proposeAndPass(minion, moloch, valueAction);
        await Utils.proposeAndPass(minion, moloch, executedAction);
        await Utils.proposeAndPass(minion, moloch, failingCallAction);

        // execute the "executed action"
        await minion.executeAction(executedAction.proposalId);
      });

      it("reverts if insufficient eth", async () => {
        await expect(
          minion.executeAction(valueAction.proposalId)
        ).to.be.revertedWith(Constants.revertStrings.NO_ETH);
      });

      it("reverts on un-passed proposal", async () => {
        await expect(
          minion.executeAction(unpassedAction.proposalId)
        ).to.be.revertedWith(Constants.revertStrings.NOT_PASSED);
      });

      it("reverts a previously executed action", async () => {
        await expect(
          minion.executeAction(executedAction.proposalId)
        ).to.be.revertedWith(Constants.revertStrings.IS_EXECUTED);
      });

      it("reverts a proposal created by another source", async () => {
        // submit a proposal directly to the moloch, not through the minion
        await moloch.submitProposal(
          minion.address,
          0,
          0,
          0,
          token.address,
          0,
          token.address,
          ""
        );
        const proposalId = (await moloch.proposalCount()).sub(1).toNumber();
        const falseAction: Action = {
          to: target.address,
          value: ethers.utils.parseEther("0"),
          data: "0x",
          description: "foo",
          proposalId: proposalId,
          queueIndex: proposalId - 1
        };
        await Utils.passProposal(moloch, falseAction);
        await expect(
          minion.executeAction(falseAction.proposalId)
        ).to.be.revertedWith(Constants.revertStrings.INVALID_EXEC_ID);
      });

      it("fails if action call reverts", async () => {
        await expect(
          minion.executeAction(failingCallAction.proposalId)
        ).to.be.revertedWith(Constants.revertStrings.CALL_FAIL);
      });
    });
  });

  // TODO: Add an interface to withdrawBalances?
  describe("doWithdraw", () => {
    it("withdraws funds from parent moloch", async () => {
      const amount = ethers.utils.parseEther("1");
      await token.transfer(moloch.address, amount);

      // add tokens to guild bank balance
      await moloch.submitProposal(
        wallet.address,
        0,
        0,
        amount,
        token.address,
        0,
        token.address,
        ""
      );
      // pay minion
      await moloch.submitProposal(
        minion.address,
        0,
        0,
        0,
        token.address,
        amount,
        token.address,
        ""
      );

      // pass and process both proposals
      const fillGuildBankAction = {
        to: "",
        value: new ethers.utils.BigNumber(0),
        data: "0x",
        description: "",
        proposalId: 0,
        queueIndex: 0
      };
      const payMinionAction = {
        to: "",
        value: new ethers.utils.BigNumber(0),
        data: "0x",
        description: "",
        proposalId: 1,
        queueIndex: 1
      };
      await Utils.passProposal(moloch, fillGuildBankAction);
      await Utils.passProposal(moloch, payMinionAction);

      // withdraw minion balance
      await minion.doWithdraw(token.address, amount);
    });
  });
});
