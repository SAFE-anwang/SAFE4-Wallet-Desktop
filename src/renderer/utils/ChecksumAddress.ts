import { ethers } from "ethers";

export default ( address : string ) => {
  return ethers.utils.getAddress(address);
}
