import { ethereum } from "@nomiclabs/buidler";
import { ethers } from "ethers";

import { Action } from "./types";
import Constants from "./constants";
import { Moloch } from "../../../build/types/Moloch";
import { Minion } from "../../../build/types/Minion";

const molochConfig = Constants.molochConfig;

function encodeDetailsString(actionDescription: string) {
  return Constants.MINION_ACTION_DETAILS + actionDescription + '"}';
}

async function incProposalCount(moloch: Moloch, n: number) {
  const token = await moloch.depositToken();
  for (let i = 0; i < n; i++) {
    await moloch.submitProposal(moloch.address, 0, 0, 0, token, 0, token, "");
  }
}

async function bumpTime(periods: number, duration: number) {
  const timeIncrease = periods * duration;
  await ethereum.send("evm_increaseTime", [timeIncrease]);
  await ethereum.send("evm_mine", []);
}

async function passProposal(moloch: Moloch, action: Action) {
  await moloch.sponsorProposal(action.proposalId);
  await bumpTime(1, molochConfig.PERIOD_DURATION_IN_SECONDS);
  await moloch.submitVote(action.queueIndex, 1);
  await bumpTime(
    molochConfig.VOTING_DURATON_IN_PERIODS,
    molochConfig.PERIOD_DURATION_IN_SECONDS
  );
  await bumpTime(
    molochConfig.GRACE_DURATON_IN_PERIODS,
    molochConfig.PERIOD_DURATION_IN_SECONDS
  );
  await moloch.processProposal(action.queueIndex);
}

async function proposeAndPass(minion: Minion, moloch: Moloch, action: Action) {
  await minion.proposeAction(
    action.to,
    action.value,
    action.data,
    action.description
  );
  await passProposal(moloch, action);
}

export default {
  bumpTime,
  passProposal,
  proposeAndPass,
  incProposalCount,
  encodeDetailsString,
  mine
};
