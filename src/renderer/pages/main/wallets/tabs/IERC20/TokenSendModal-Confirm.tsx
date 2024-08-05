
import { Button, Col, Divider, Row, Typography, Alert } from "antd"
import { useCallback, useMemo, useState } from "react";
import { ethers } from "ethers";
import { LockOutlined, SendOutlined } from '@ant-design/icons';
import { useWalletsActiveAccount, useWalletsActiveSigner } from "../../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../../state/transactions/hooks";
import { useAccountManagerContract, useIERC20Contract } from "../../../../../hooks/useContracts";
import useTransactionResponseRender from "../../../../components/useTransactionResponseRender";
import AddressView from "../../../../components/AddressView";
import { Token, TokenAmount } from "@uniswap/sdk";

const { Text } = Typography;

export default ({
  token,
  to, amount,
  setTxHash, close
}: {
  token : Token,
  to: string,
  amount: string,
  setTxHash: (txHash: string) => void
  close: () => void,
}) => {

  const signer = useWalletsActiveSigner();
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();
  const IERC20Contract = useIERC20Contract( token.address , true );
  const {
    render,
    setTransactionResponse,
    setErr,
    response,
    err
  } = useTransactionResponseRender();
  const [sending, setSending] = useState<boolean>(false);
  const doSendTransaction = useCallback(({ to, amount }: { to: string, amount: string }) => {
    if (signer && IERC20Contract) {
      const { address , name , symbol , decimals } = token;
      const value = ethers.utils.parseUnits(amount , decimals).toString();
      setSending(true);
      IERC20Contract.transfer( to , value ).then( (response:any) => {
        setSending(false);
        const {
          data,
          hash
        } = response;
        setTxHash(hash);
        setTransactionResponse(response);
        addTransaction( {to : token.address} , response, {
          call: {
            from: activeAccount,
            to: address,
            input: data,
            value: "0",
            tokenTransfer: {
              from: activeAccount,
              to,
              value,
              token : {
                address,
                name : name ?? "",
                symbol : symbol ?? "",
                decimals
              }
            }
          }
        });
      }).catch( (err:any) => {
        setSending(false);
        setErr(err)
      })
    }
  }, [signer, IERC20Contract]);

  return (<>
    <div style={{ minHeight: "300px" }}>
      {
        render
      }
      <Row >
        <Col span={24}>
          <Text style={{ fontSize: "32px" }} strong>{amount} SAFE</Text>
        </Col>
      </Row>
      <br />
      <Row >
        <Col span={24}>
          <Text strong>从</Text>
          <br />
          <Text style={{ fontSize: "18px" }}>
            <AddressView address={activeAccount} />
          </Text>
        </Col>
      </Row>
      <br />
      <Row >
        <Col span={24}>
          <Text strong>到</Text>
          <br />
          <Text style={{ fontSize: "18px" }}>
            <AddressView address={to} />
          </Text>
        </Col>
      </Row>
      <br />
      <Divider />
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          {
            !sending && !render && <Button icon={<SendOutlined />} onClick={() => {
              doSendTransaction({ to, amount });
            }} disabled={sending} type="primary" style={{ float: "right" }}>
              广播交易
            </Button>
          }
          {
            sending && !render && <Button loading disabled type="primary" style={{ float: "right" }}>
              发送中....
            </Button>
          }
          {
            render && <Button onClick={close} type="primary" style={{ float: "right" }}>
              关闭
            </Button>
          }
        </Col>
      </Row>
    </div>
  </>)

}
