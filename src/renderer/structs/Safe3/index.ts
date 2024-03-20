

/**
 *     struct AvailableSafe3Info {
        string safe3Addr;
        uint amount;
        address safe4Addr;
        uint redeemHeight;
    }
 */
import { Currency, CurrencyAmount } from "@uniswap/sdk";

export interface AvailableSafe3Info {
  safe3Addr: string,
  amount: CurrencyAmount,
  safe4Addr: string,
  redeemHeight: number
}

export function formatAvailableSafe3Info(_availableSafe3Info: any): AvailableSafe3Info {
  const { safe3Addr, amount, safe4Addr, redeemHeight } = _availableSafe3Info;
  return {
    safe3Addr,
    amount: CurrencyAmount.ether(amount),
    safe4Addr,
    redeemHeight: redeemHeight.toNumber()
  }
}

// struct SpecialSafe3Info {
//   string safe3Addr;
//   uint amount;
//   uint applyHeight;
//   address[] voters;
//   uint[] voteResults;
//   address safe4Addr;
//   uint redeemHeight;
// }
export interface SpecialSafe3Info {
  safe3Addr: string,
  amount: CurrencyAmount,
  applyHeight: number,
  voters: string[],
  voteResults: number[],
  safe4Addr: string,
  redeemHeight: number
}

export function formatSpecialSafe3Info(_specialSafe3Info: any): SpecialSafe3Info {
  const { safe3Addr, amount, applyHeight, voters, voteResults, safe4Addr, redeemHeight } = _specialSafe3Info;
  return {
    safe3Addr,
    amount: CurrencyAmount.ether(amount),
    applyHeight: applyHeight.toNumber(),
    voters,
    voteResults: voteResults.map((voteResult: any) => voteResult.toNumber()),
    safe4Addr,
    redeemHeight: redeemHeight.toNumber()
  }
}

/**
 *     struct LockedSafe3Info {
        string safe3Addr;
        uint amount;
        string txid;
        uint lockHeight;
        uint unlockHeight;
        uint remainLockHeight;
        uint lockDay;
        bool isMN;
        address safe4Addr;
        uint redeemHeight;
    }
 */
export interface LockedSafe3Info {
  safe3Addr : string ,
  amount : CurrencyAmount ,
  txid : string ,
  lockHeight : number,
  unlockHeight : number,
  remainLockHeight : number,
  lockDay : number,
  isMN : boolean ,
  safe4Addr : string,
  redeemHeight : number
}

export function formatLockedSafe3Info(_lockedSafe3Info: any): LockedSafe3Info {
  const { safe3Addr, amount, txid , lockHeight , unlockHeight , remainLockHeight , lockDay , isMN , safe4Addr , redeemHeight } = _lockedSafe3Info;
  return {
    safe3Addr,
    amount: CurrencyAmount.ether(amount),
    txid ,
    lockHeight : lockHeight.toNumber(),
    unlockHeight : unlockHeight.toNumber(),
    remainLockHeight : remainLockHeight.toNumber(),
    lockDay : lockDay.toNumber(),
    isMN ,
    safe4Addr ,
    redeemHeight : redeemHeight.toNumber()
  }
}
