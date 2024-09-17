


import { Currency, CurrencyAmount } from "@uniswap/sdk";

/**
 *     struct AvailableSafe3Info {
        string safe3Addr;
        uint amount;
        address safe4Addr;
        uint redeemHeight;
    }
 */
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

    {
        string safe3Addr;
        uint amount;
        uint remainLockHeight;
        uint lockDay;
        bool isMN;
        address safe4Addr;
        uint redeemHeight;
    }

 */
export interface LockedSafe3Info {
  safe3Addr: string,
  amount: CurrencyAmount,
  remainLockHeight: number,
  lockDay: number,
  isMN: boolean,
  safe4Addr: string,
  redeemHeight: number
}

export function formatLockedSafe3Info(_lockedSafe3Info: any): LockedSafe3Info {
  const { safe3Addr, amount, remainLockHeight, lockDay, isMN, safe4Addr, redeemHeight } = _lockedSafe3Info;
  return {
    safe3Addr,
    amount: CurrencyAmount.ether(amount),
    remainLockHeight: remainLockHeight.toNumber(),
    lockDay: lockDay.toNumber(),
    isMN,
    safe4Addr,
    redeemHeight: redeemHeight.toNumber()
  }
}

/**
 *    struct SpecialData {
        uint64 amount;
        uint32 applyHeight;
        uint32 redeemHeight;
        address safe4Addr;
        address[] voters;
        uint[] voteResults;
    }
 */
export interface SpecialData {
  amount: CurrencyAmount,
  applyHeight: number,
  redeemHeight: number,
  safe4Addr: string,
}
export function formatSpecialData(_specialData: any): SpecialData {
  const { amount, applyHeight, redeemHeight, safe4Addr, voters, voteResults } = _specialData;
  return {
    amount: CurrencyAmount.ether(amount),
    applyHeight: applyHeight.toNumber(),
    redeemHeight: redeemHeight.toNumber(),
    safe4Addr,
  }
}

/**
 * 
    struct AvailableData {
        uint64 amount;
        uint32 redeemHeight;
        address safe4Addr;
    }
 */
export interface AvailableData {
  amount: CurrencyAmount,
  redeemHeight: number,
  safe4Addr: string
}
export function formatAvailableData(_availableData: any): AvailableData {
  const { amount, redeemHeight, safe4Addr } = _availableData;
  return {
    amount: CurrencyAmount.ether(amount),
    safe4Addr,
    redeemHeight: redeemHeight.toNumber()
  }
}

/**
 *     struct LockedData {
        uint64 amount;
        uint32 remainLockHeight;
        uint16 lockDay;
        bool isMN;
        uint32 redeemHeight;
        address safe4Addr;
    }
 */
export interface LockedData {
  amount: CurrencyAmount,
  redeemHeight: number,
  isMN: boolean
  safe4Addr: string
}

export function formatLockedData(_lockedData: any): LockedData {
  const { amount, redeemHeight, isMN, safe4Addr } = _lockedData;
  return {
    amount: CurrencyAmount.ether(amount),
    redeemHeight: redeemHeight.toNumber(),
    isMN,
    safe4Addr
  }
}