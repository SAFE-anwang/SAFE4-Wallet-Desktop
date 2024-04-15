
import { Col, Row, Avatar, List, Typography, Modal, Button } from "antd";
import { useMemo } from "react";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import { ethers } from "ethers";
import { publicKeyToSafe3Address } from "../../../../../utils/Safe3PrivateKey";
import CallSafe3Redeem from "./CallSafe3Redeem";


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
  const { safe3Address , safe4Address } = useMemo(() => {
    const { _pubkey, _sig } = support.inputDecodeResult;
    const publicKeyBuffer = ethers.utils.hexlify(_pubkey)
    const safe4Address = ethers.utils.computeAddress(publicKeyBuffer);
    const safe3Address = publicKeyToSafe3Address(_pubkey);
    return {
      safe3Address,
      safe4Address
    }
  }, [transaction, call, support]);

  return <>
    <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
      {
        call && <>
          <CallSafe3Redeem functionName={support.supportFuncName} status={status} safe4Address={safe4Address} safe3Address={safe3Address} />
        </>
      }
    </List.Item>
  </>

}
