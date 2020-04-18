import { Moloch } from "../../../build/types/Moloch";
import { ethereum } from "@nomiclabs/buidler";
import { ethers } from "ethers";
import Constants from "./constants";

const molochConfig = Constants.molochConfig;

async function bumpTime(periods: number, duration: number) {
  const timeIncrease = periods * duration;
  await ethereum.send("evm_increaseTime", [timeIncrease]);
  await ethereum.send("evm_mine", []);
}

async function passProposal(moloch: Moloch, proposalId: number) {
  await moloch.sponsorProposal(proposalId);
  await bumpTime(1, molochConfig.PERIOD_DURATION_IN_SECONDS);
  await moloch.submitVote(0, 1);
  await bumpTime(
    molochConfig.VOTING_DURATON_IN_PERIODS,
    molochConfig.PERIOD_DURATION_IN_SECONDS
  );
  await bumpTime(
    molochConfig.GRACE_DURATON_IN_PERIODS,
    molochConfig.PERIOD_DURATION_IN_SECONDS
  );
  await moloch.processProposal(0);
}

export default {
  bumpTime,
  passProposal
};
