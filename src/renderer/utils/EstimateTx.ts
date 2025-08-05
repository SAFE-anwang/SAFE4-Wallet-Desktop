import { ethers } from "ethers";


export default async (
  activeAccount: string,
  chainId: number,
  tx: ethers.providers.TransactionRequest,
  provider: ethers.providers.Web3Provider,
  extra?: {
    doubleGasLimit: boolean
  }
): Promise<ethers.providers.TransactionRequest> => {
  const { value } = tx;
  const transaction: ethers.providers.TransactionRequest = {
    ...tx,
    value: value !== undefined ? ethers.BigNumber.from(value) : ethers.constants.Zero,
    from: activeAccount,
    chainId
  };

  let nonce: number;
  let gasPrice: ethers.BigNumber;
  let gasLimit: ethers.BigNumber;
  [nonce, gasPrice, gasLimit] = await Promise.all([
    provider.getTransactionCount(activeAccount, "pending"),
    transaction.gasPrice ? Promise.resolve(ethers.BigNumber.from(transaction.gasPrice)) : provider.getGasPrice(),
    transaction.gasLimit ? Promise.resolve(ethers.BigNumber.from(transaction.gasLimit)) : provider.estimateGas({
      ...transaction,
      from: activeAccount
    })
  ]);
  if (extra && extra.doubleGasLimit) {
    gasLimit = gasLimit.mul(2);
  }
  return {
    ...transaction,
    nonce,
    gasPrice,
    gasLimit,
  }
}
