
const {
  Web3
} = require('web3');

export async function doNewAccount(password?: string) {
  const rpcUrl = 'http://47.107.47.210:8545'; // 替换为你的 Geth RPC 地址
  const web3 = new Web3(rpcUrl);
  const result = await web3.eth.personal.newAccount("");
  // return result;
  console.log(result)
}


