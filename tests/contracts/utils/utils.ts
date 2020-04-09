import Constants from "./constants";
import { ethers } from "ethers";

function encodeMinionCall(call: {
  nonce: number;
  to: string;
  value: number;
  data: string;
}) {
  return ethers.utils.solidityPack(
    ["bytes4", "uint256", "address", "uint256", "bytes"],
    [Constants.MINION_MAGIC_BYTES, call.nonce, call.to, call.value, call.data]
  );
}

export default {
  encodeMinionCall
};
