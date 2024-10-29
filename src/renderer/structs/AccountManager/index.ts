import { CurrencyAmount, JSBI } from "@uniswap/sdk";

/*
    struct AccountRecord {
        uint id;
        address addr;
        uint amount;
        uint lockDay;
        uint startHeight; // start height
        uint unlockHeight; // unlocked height
    }
*/
export interface AccountRecord {
  id: number,
  addr: string,
  amount: CurrencyAmount,
  lockDay: number,
  startHeight: number,
  unlockHeight: number,
  recordUseInfo?: RecordUseInfo
}
/*
    struct RecordUseInfo {
        address frozenAddr; // created target address(mn or sn)
        uint freezeHeight; // freeze height for create target address
        uint unfreezeHeight; // unfreeze height after create target address
        address votedAddr; // voted target address
        uint voteHeight; // vote height for vote target address
        uint releaseHeight; // release height after vote
    }
*/
export interface RecordUseInfo {
  frozenAddr: string,
  freezeHeight: number,
  unfreezeHeight: number,
  votedAddr: string,
  voteHeight: number,
  releaseHeight: number
}

export function formatAccountRecord(accountRecord: any): AccountRecord {
  const {
    id, addr, amount, lockDay, startHeight, unlockHeight
  } = accountRecord;
  let _lockDay = Number.NaN;
  let _unlockHeight = Number.NaN;
  let _startHeight = Number.NaN;
  try {
    _lockDay = lockDay.toNumber()
    _unlockHeight = unlockHeight.toNumber();
    _startHeight = startHeight.toNumber();
  } catch (err) {

  }
  return {
    id: id.toNumber(),
    addr: addr.toString(),
    amount: CurrencyAmount.ether(JSBI.BigInt(amount.toString())),
    lockDay: _lockDay,
    startHeight: _startHeight,
    unlockHeight: _unlockHeight
  }
}

export function formatRecordUseInfo(recordUseInfo: any): RecordUseInfo {
  const {
    frozenAddr, freezeHeight, unfreezeHeight, votedAddr, voteHeight, releaseHeight
  } = recordUseInfo;
  return {
    frozenAddr: frozenAddr.toString(),
    freezeHeight: freezeHeight.toNumber(),
    unfreezeHeight: unfreezeHeight.toNumber(),
    votedAddr: votedAddr.toString(),
    voteHeight: voteHeight.toNumber(),
    releaseHeight: releaseHeight.toNumber()
  }
}


export interface IdPageQuery {
  position: number,
  offset: number,
  ids?: number[],
  result?: any[],
}
