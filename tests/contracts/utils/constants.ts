import { ethers } from "ethers";

const MINION_MAGIC_BYTES = "0xb16903b2";

const revertStrings = {
  none: "revert"
};

const systemConstants = {
  MINION_MAGIC_BYTES,
  revertStrings
};

export default { ...ethers.constants, ...systemConstants };
