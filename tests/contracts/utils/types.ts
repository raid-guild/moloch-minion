import { ethers } from "ethers";

interface Action {
  to: string;
  value: ethers.utils.BigNumber;
  data: string;
  description: string;
  proposalId: number;
  queueIndex: number;
}

interface Proposal {
  applicant: string;
  proposer: string;
  sharesRequested: number;
  lootRequested: number;
  tributeOffered: number;
  tributeToken: string;
  paymentRequested: number;
  paymentToken: string;
  details: string;
}

export { Action, Proposal };
