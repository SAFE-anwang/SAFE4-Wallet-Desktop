import { Token } from "@uniswap/sdk";
import { BigNumber, ethers } from "ethers";
import { Safe4NetworkChainId, SafeswapV2FactoryAddreess, SafeswapV2InitCodeHash, WSAFE } from "../../../config";


/**
 * 计算兑换输出金额
 * @param amountIn  输入金额（原始值，BigNumber）
 * @param reserveIn  交易对的输入储备量
 * @param reserveOut 交易对的输出储备量
 * @param feeRate 手续费率（如 0.003 表示 0.3%）
 * @returns 兑换输出金额（BigNumber）
 */
export function calculateAmountOut(
  amountIn: BigNumber,
  reserveIn: BigNumber,
  reserveOut: BigNumber,
  feeRate: string
): BigNumber {
  const FEE_BASE = ethers.utils.parseUnits("1", 18); // 1 * 10^18
  const rate = FEE_BASE.sub(ethers.utils.parseUnits(feeRate, 18)); // (1 - feeRate)
  const amountInWithFee = amountIn.mul(rate).div(FEE_BASE); // amountIn * (1 - feeRate)
  const numerator = amountInWithFee.mul(reserveOut);
  const denominator = amountInWithFee.add(reserveIn);
  return numerator.div(denominator); // 向下取整
}

/**
 * 计算兑换所需输入金额
 * @param amountOut  期望的输出金额（BigNumber）
 * @param reserveOut 交易对的输出储备量（BigNumber）
 * @param reserveIn  交易对的输入储备量（BigNumber）
 * @param feeRate 手续费率（如 0.003 表示 0.3%）
 * @returns 兑换所需的输入金额（BigNumber）
 */
export function calculateAmountIn(
  amountOut: BigNumber,
  reserveOut: BigNumber,
  reserveIn: BigNumber,
  feeRate: string
): BigNumber {
  if (amountOut.gte(reserveOut)) {
    throw new Error("amountOut must be less than reserveOut");
  }
  const FEE_BASE = ethers.utils.parseUnits("1", 18);
  const rate = FEE_BASE.sub(ethers.utils.parseUnits(feeRate, 18)); // (1 - feeRate)
  const numerator = amountOut.mul(reserveIn);
  const denominator = reserveOut.sub(amountOut);
  const result = numerator.div(denominator); // 向下取整
  return result.mul(FEE_BASE).div(rate); // 反向计算手续费
}

export function calculatePaireAddress(_tokenA: Token | undefined, _tokenB: Token | undefined, chainId: number): string | undefined {
  if (_tokenA == undefined && _tokenB == undefined) {
    return undefined;
  }
  const tokenA: Token = _tokenA ? _tokenA : WSAFE[chainId as Safe4NetworkChainId];
  const tokenB: Token = _tokenB ? _tokenB : WSAFE[chainId as Safe4NetworkChainId];
  const [token0, token1] = tokenA.address.toLowerCase() < tokenB.address.toLowerCase() ? [tokenA.address, tokenB.address] : [tokenB.address, tokenA.address];
  const pairAddress = ethers.utils.getCreate2Address(
    SafeswapV2FactoryAddreess,
    ethers.utils.keccak256(ethers.utils.solidityPack(["address", "address"], [token0, token1])),
    SafeswapV2InitCodeHash
  );
  return pairAddress;
}

export function sort(_tokenA: Token | undefined, _tokenB: Token | undefined, chainId: number) {
  if (_tokenA == undefined && _tokenB == undefined) {
    return undefined;
  }
  const tokenA: Token = _tokenA ? _tokenA : WSAFE[chainId as Safe4NetworkChainId];
  const tokenB: Token = _tokenB ? _tokenB : WSAFE[chainId as Safe4NetworkChainId];
  return tokenA.address.toLowerCase() < tokenB.address.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];
}

export function getReserve(_token: Token | undefined, reservers: any, chainId: number) {
  const token: Token = _token ? _token : WSAFE[chainId as Safe4NetworkChainId];
  return reservers[token.address];
}

