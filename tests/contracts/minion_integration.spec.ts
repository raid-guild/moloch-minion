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

const molochConfig = {
  PERIOD_DURATION_IN_SECONDS: 17280,
  VOTING_DURATON_IN_PERIODS: 35,
  GRACE_DURATON_IN_PERIODS: 35,
  PROPOSAL_DEPOSIT: 10,
  DILUTION_BOUND: 3,
  PROCESSING_REWARD: 1,
  TOKEN_SUPPLY: 10000
};

async function moveForwardPeriods(periods: number) {
  const goToTime = molochConfig.PERIOD_DURATION_IN_SECONDS * periods;
  await ethereum.send("evm_increaseTime", [goToTime]);
  await ethereum.send("evm_mine", []);
}

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
        molochConfig.PERIOD_DURATION_IN_SECONDS,
        molochConfig.VOTING_DURATON_IN_PERIODS,
        molochConfig.GRACE_DURATON_IN_PERIODS,
        molochConfig.PROPOSAL_DEPOSIT,
        molochConfig.DILUTION_BOUND,
        molochConfig.PROCESSING_REWARD
      ],
      { gasLimit: 9500000 }
    )) as Moloch;

    minion = (await deployContract(wallet, MinionArtifact, [
      moloch.address
    ])) as Minion;
    target = (await deployContract(wallet, TargetMockArtifact)) as TargetMock;
  });

  it("deploys correctly", async () => {
    expect(minion.address).to.not.eq(Constants.AddressZero);
    expect(await minion.nonce()).to.eq(0);
    expect(await minion.moloch()).to.eq(moloch.address);
    expect(await minion.MINION_MAGIC_BYTES()).to.eq(
      Constants.MINION_MAGIC_BYTES
    );
  });

  it("works with real moloch", async () => {
    const minionCall = {
      nonce: 0,
      to: target.address,
      value: 0,
      data: ethers.constants.HashZero
    };
    const encodedMinionCall = Utils.encodeMinionCall(minionCall);

    const submitProposalFuncSig =
      moloch.interface.functions.submitProposal.sighash;
    const submitProposalFuncData = ethers.utils.defaultAbiCoder
      .encode(
        [
          "address",
          "uint256",
          "uint256",
          "uint256",
          "address",
          "uint256",
          "address",
          "bytes"
        ],
        [
          minion.address,
          0,
          0,
          0,
          token.address,
          0,
          token.address,
          encodedMinionCall
        ]
      )
      .slice(2);
    const submitProposalTxData = submitProposalFuncSig + submitProposalFuncData;
    const submitProposalTx = {
      to: moloch.address,
      data: submitProposalTxData
    };
    await token.approve(moloch.address, Constants.MaxUint256);
    await moloch.sponsorProposal(0);
    await moveForwardPeriods(1);
    await moloch.submitVote(0, 1);
    await moveForwardPeriods(molochConfig.VOTING_DURATON_IN_PERIODS);
    await moveForwardPeriods(molochConfig.GRACE_DURATON_IN_PERIODS);
    await moloch.processProposal(0);
    await moloch.proposals(1);
    console.log("flags", await moloch.getProposalFlags(0));

    await minion.execute(0, 0, target.address, 0, ethers.constants.HashZero);

    ///////////
    const newminionCall = {
      nonce: 1,
      to: target.address,
      value: 0,
      data: ethers.constants.HashZero
    };
    const newencodedMinionCall = Utils.encodeMinionCall(newminionCall);

    const newsubmitProposalFuncSig =
      moloch.interface.functions.submitProposal.sighash;
    const newsubmitProposalFuncData = ethers.utils.defaultAbiCoder
      .encode(
        [
          "address",
          "uint256",
          "uint256",
          "uint256",
          "address",
          "uint256",
          "address",
          "bytes"
        ],
        [
          minion.address,
          0,
          0,
          0,
          token.address,
          0,
          token.address,
          newencodedMinionCall
        ]
      )
      .slice(2);
    const newsubmitProposalTxData =
      newsubmitProposalFuncSig + newsubmitProposalFuncData;
    const newsubmitProposalTx = {
      to: moloch.address,
      data: newsubmitProposalTxData
    };
    await wallet.sendTransaction(newsubmitProposalTx);
    await token.approve(moloch.address, Constants.MaxUint256);
    await moloch.sponsorProposal(1);
    await moveForwardPeriods(1);
    await moloch.submitVote(1, 1);
    await moveForwardPeriods(molochConfig.VOTING_DURATON_IN_PERIODS);
    await moveForwardPeriods(molochConfig.GRACE_DURATON_IN_PERIODS);
    await moloch.processProposal(1);
    console.log("flags", await moloch.getProposalFlags(1));

    await minion.execute(1, 1, target.address, 0, ethers.constants.HashZero);
    ///////////

    // TODO: submitting raw bytes to details will break most javascript implemtations
    // attempts to retrieve the proposal struct
  });
});
