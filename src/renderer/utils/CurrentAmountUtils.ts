import { CurrencyAmount } from "@uniswap/sdk";
import { ethers } from "ethers";

export const ZERO : CurrencyAmount = CurrencyAmount.ether(ethers.utils.parseEther("0").toBigInt());

export const ONE : CurrencyAmount = CurrencyAmount.ether(ethers.utils.parseEther("1").toBigInt());
