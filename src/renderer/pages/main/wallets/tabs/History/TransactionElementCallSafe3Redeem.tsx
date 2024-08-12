
import { Col, Row, Avatar, List, Typography, Modal, Button } from "antd";
import { useMemo } from "react";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import { ethers } from "ethers";
import { publicKeyToSafe3Address } from "../../../../../utils/Safe3PrivateKey";
import CallSafe3Redeem from "./CallSafe3Redeem";
import { JSBI } from "@uniswap/sdk";

const { Text } = Typography;


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
  const { safe3Address, safe4Address } = useMemo(() => {
    const { _pubkey, _sig } = support.inputDecodeResult;
    const publicKeyBuffer = ethers.utils.hexlify(_pubkey)
    let safe3Address = "Unknown";
    let safe4Address = "Unknown";
    try {
      safe4Address = ethers.utils.computeAddress(publicKeyBuffer);
    } catch (error) {

    }
    try {
      safe3Address = publicKeyToSafe3Address(_pubkey);
    } catch (error) {

    }
    return {
      safe3Address,
      safe4Address
    }
  }, [transaction, call, support]);

  const [ value , locked ] = useMemo(() => {
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
    return [ avaialbeAmount , lockedAmount ];
  }, [transaction]);

  return <>
    <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
      {
        call && <>
          <CallSafe3Redeem functionName={support.supportFuncName} status={status} safe4Address={safe4Address} safe3Address={safe3Address}
            value={value} locked={locked} />
        </>
      }
    </List.Item>
  </>

}
