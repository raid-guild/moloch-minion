import { ethers } from "ethers";

const MINION_ACTION_DETAILS =
  '{"isMinion": true, "title":"MINION", "description":"';

const molochConfig = {
  PERIOD_DURATION_IN_SECONDS: 17280,
  VOTING_DURATON_IN_PERIODS: 35,
  GRACE_DURATON_IN_PERIODS: 35,
  PROPOSAL_DEPOSIT: 10,
  DILUTION_BOUND: 3,
  PROCESSING_REWARD: 1,
  TOKEN_SUPPLY: 10000
};

const revertStrings = {
  none: "revert",
  INVALID_PROP_TARGET: "Minion::invalid _actionTo",
  INVALID_EXEC_TARGET: "Minion::invalid target",
  INVALID_PROP_ID: "Minion::invalid _proposalId",
  IS_EXECUTED: "Minion::action executed",
  NO_ETH: "Minion::insufficient eth",
  NOT_PASSED: "Minion::proposal not passed",
  CALL_FAIL: "Minion::call failure"
};

const systemConstants = {
  MINION_ACTION_DETAILS,
  molochConfig,
  revertStrings
};

export default { ...ethers.constants, ...systemConstants };
