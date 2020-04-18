import { ethereum, waffle } from "@nomiclabs/buidler";
import chai from "chai";
import { ethers } from "ethers";
import { deployContract, solidity } from "ethereum-waffle";

import MinionArtifact from "../../build/artifacts/Minion.json";
import MolochArtifact from "../../build/artifacts/Moloch.json";
import TokenArtifact from "../../build/artifacts/Token.json";
import TargetMockArtifact from "../../build/artifacts/TargetMock.json";
import { Minion } from "../../build/types/Minion";
import { Moloch } from "../../build/types/Moloch";
import { Token } from "../../build/types/Token";
import { TargetMock } from "../../build/types/TargetMock";

import Constants from "./utils/constants";
import Utils from "./utils/utils";

chai.use(solidity);
const { expect } = chai;

describe("Minion integration", () => {
  const provider = waffle.provider;
  const [wallet] = provider.getWallets();

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
    expect(await minion.MINION_ACTION_DETAILS()).to.eq(
      Constants.MINION_ACTION_DETAILS
    );
  });

  describe("success cases", () => {
    it("executes a passed proposal", async () => {
      const action = {
        to: target.address,
        value: 0,
        data: ethers.constants.HashZero,
        description: "foo"
      };

      await minion.proposeAction(
        action.to,
        action.value,
        action.data,
        action.description
      );
      // console.log("passed as description paramer:", action.description);
      // console.log("action details:", (await moloch.proposals(0)).details);
      await Utils.passProposal(moloch, 0);
      await minion.executeAction(0);
    });
  });

  describe("failue cases", () => {
    /* beforeEach(async () => {}); */

    it("fails to propose an invalid action", async () => {
      const badAction = {
        to: Constants.AddressZero,
        value: ethers.utils.parseEther("1"),
        data: ethers.constants.HashZero,
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

    it("fails to execute an invalid action", async () => {
      const action = {
        to: target.address,
        value: ethers.utils.parseEther("1"),
        data: ethers.constants.HashZero,
        description: "foo"
      };
      await minion.proposeAction(
        action.to,
        action.value,
        action.data,
        action.description
      );

      /* // moloch as action target */
      /* await expect(minion.executeAction(0)).to.be.revertedWith( */
      /*   Constants.revertStrings.INVALID_EXEC_TARGET */
      /* ); */

      // insufficient eth
      await expect(minion.executeAction(0)).to.be.revertedWith(
        Constants.revertStrings.NO_ETH
      );

      // proposal not passed
      await wallet.sendTransaction({ to: minion.address, value: action.value });
      await expect(minion.executeAction(0)).to.be.revertedWith(
        Constants.revertStrings.NOT_PASSED
      );
    });
  });
});
