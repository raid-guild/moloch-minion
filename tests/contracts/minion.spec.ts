import { waffle } from "@nomiclabs/buidler";
import chai from "chai";
import { ethers } from "ethers";
import { deployContract, solidity } from "ethereum-waffle";

import MinionArtifact from "../../build/artifacts/Minion.json";
import MolochMockArtifact from "../../build/artifacts/MolochMock.json";
import TargetMockArtifact from "../../build/artifacts/TargetMock.json";
import TesterArtifact from "../../build/artifacts/Tester.json";
import { Minion } from "../../build/types/Minion";
import { MolochMock } from "../../build/types/MolochMock";
import { TargetMock } from "../../build/types/TargetMock";
import { Tester } from "../../build/types/Tester";

import Constants from "./utils/constants";
import Utils from "./utils/utils";

chai.use(solidity);
const { expect } = chai;

describe("Minion unit", () => {
  const provider = waffle.provider;
  const [wallet] = provider.getWallets();

  let minion: Minion;
  let molochMock: MolochMock;
  let target: TargetMock;

  beforeEach(async () => {
    molochMock = (await deployContract(
      wallet,
      MolochMockArtifact
    )) as MolochMock;
    minion = (await deployContract(wallet, MinionArtifact, [
      molochMock.address
    ])) as Minion;
    target = (await deployContract(wallet, TargetMockArtifact)) as TargetMock;
  });

  it("deploys correctly", async () => {
    expect(minion.address).to.not.eq(Constants.AddressZero);
    expect(await minion.nonce()).to.eq(0);
    expect(await minion.moloch()).to.eq(molochMock.address);
    expect(await minion.MINION_MAGIC_BYTES()).to.eq(
      Constants.MINION_MAGIC_BYTES
    );
  });

  it("withdraws moloch balance", async () => {
    const tokenAddr = "0x0000000000000000000000000000000000000001";
    const amt = 1;
    await expect(minion.doWithdraw(tokenAddr, amt))
      .to.emit(molochMock, "Withdraw")
      .withArgs(minion.address, tokenAddr, amt);
  });

  it("executes passing proposals encoded in solidity", async () => {
    const tester = (await deployContract(wallet, TesterArtifact, [
      molochMock.address,
      minion.address,
      target.address
    ])) as Tester;
    await tester.doTest();
  });

  it("executes passing proposals", async () => {
    const minionCall = {
      nonce: 0,
      to: target.address,
      value: 0,
      data: ethers.constants.HashZero
    };
    const encodedMinionCall = Utils.encodeMinionCall(minionCall);

    const addProposalFuncSig =
      molochMock.interface.functions.addProposal.sighash;
    const addProposalFuncData = ethers.utils.defaultAbiCoder
      .encode(["address", "bytes"], [minion.address, encodedMinionCall])
      .slice(2);
    const addProposalTxData = addProposalFuncSig + addProposalFuncData;

    const addProposalTx = {
      to: molochMock.address,
      data: addProposalTxData
    };
    await wallet.sendTransaction(addProposalTx);
    await molochMock.passProposal(0);
    await minion.execute(0, 0, target.address, 0, ethers.constants.HashZero);

    // TODO: check that target emitted correct event
  });
});
