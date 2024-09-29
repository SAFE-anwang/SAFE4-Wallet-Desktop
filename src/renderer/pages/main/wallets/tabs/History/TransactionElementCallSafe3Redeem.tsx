
import { Col, Row, Avatar, List, Typography, Modal, Button } from "antd";
import { useMemo } from "react";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import { ethers } from "ethers";
import { publicKeyToSafe3Address } from "../../../../../utils/Safe3PrivateKey";
import CallSafe3Redeem from "./CallSafe3Redeem";
import { JSBI } from "@uniswap/sdk";

export default ({ transaction, setClickTransaction, support }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void,
  support: {
    supportFuncName: string,
    inputDecodeResult: any
  }
}) => {
  const {
    status,
    call,
  } = transaction;
  const mappings = useMemo(() => {
    const { _pubkeys, _safe4TargetAddress } = support.inputDecodeResult;
    let mappings: {
      safe3Address: string,
      safe4Address: string
    }[] = [];
    let safe3Address = "[无法解析]";
    let safe4Address = "[无法解析]";
    if (_pubkeys && _pubkeys.length > 0) {
      mappings = _pubkeys.map( (pubkey:string) => {
        // const publicKeyBuffer = ethers.utils.hexlify( pubkey );
        try {
          safe3Address = publicKeyToSafe3Address( pubkey );
          safe4Address = _safe4TargetAddress;
        } catch (error) {

        }
        return {
          safe3Address,
          safe4Address
        }
      })
    }
    return mappings;
  }, [transaction, call, support]);

  const [value, locked] = useMemo(() => {
    let lockedAmount: JSBI = JSBI.BigInt(0);
    let avaialbeAmount = JSBI.BigInt(0);
    if (transaction.accountManagerDatas) {
      Object.keys(transaction.accountManagerDatas)
        .map(eventLogIndex => {
          const amount = transaction.accountManagerDatas?.[eventLogIndex].amount;
          if (amount) {
            lockedAmount = JSBI.add(lockedAmount, JSBI.BigInt(amount));
          }
        })
    }
    if (transaction.internalTransfers) {
      Object.keys(transaction.internalTransfers)
        .map(eventLogIndex => {
          const amount = transaction.internalTransfers?.[eventLogIndex].value;
          if (amount) {
            avaialbeAmount = JSBI.add(avaialbeAmount, JSBI.BigInt(amount));
          }
        })
    }
    return [avaialbeAmount, lockedAmount];
  }, [transaction]);

  return <>
    <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
      {
        call && <>
          <CallSafe3Redeem functionName={support.supportFuncName} status={status} mappings={mappings}
            value={value} locked={locked} />
        </>
      }
    </List.Item>

  </>

}
