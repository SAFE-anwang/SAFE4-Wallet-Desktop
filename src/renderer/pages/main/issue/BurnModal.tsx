import { Token, TokenAmount } from "@uniswap/sdk";
import { useWeb3React } from "@web3-react/core";
import { Alert, Button, Col, Divider, Input, Modal, Row, Spin, Typography } from "antd"
import { useMemo, useState } from "react";
import useSRC20Prop from "../../../hooks/useSRC20Prop";
import { useTokenBalance, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import useTransactionResponseRender from "../../components/useTransactionResponseRender";
import { Contract, ethers } from "ethers";
import { SRC20_Template } from "./SRC20_Template_Config";
import { useContract } from "../../../hooks/useContracts";
import { useTranslation } from "react-i18next";
import { SendOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default ({ openBurnModal, setOpenBurnModal, address }: {
  openBurnModal: boolean,
  setOpenBurnModal: (openMintModal: boolean) => void,
  address: string
}) => {

  const { t } = useTranslation();
  const cancel = () => {
    setOpenBurnModal(false);
  }
  const { src20TokenProp, loading } = useSRC20Prop(address);
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();
  const {
    render,
    setTransactionResponse,
    setErr,
    response,
    err
  } = useTransactionResponseRender();
  const [sending, setSending] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>();
  const SRC20Contract = useContract(address, SRC20_Template.SRC20_burnable.abi, true);
  const [inputParams, setInputParams] = useState<{
    amount: string
  }>({
    amount: ""
  });
  const [inputErrors, setInputErrors] = useState<{
    amount?: string
  }>({
    amount: undefined
  });
  const { token, totalSupply } = useMemo(() => {
    if (chainId && src20TokenProp) {
      const token = new Token(chainId, address, src20TokenProp.decimals, src20TokenProp.symbol, src20TokenProp.name);
      const totalSupply = new TokenAmount(token, src20TokenProp.totalSupply.toBigInt());
      return {
        token,
        totalSupply
      }
    }
    return {};
  }, [chainId, src20TokenProp]);
  const tokenBalance = useTokenBalance(activeAccount, token);

  const doBurn = () => {
    if (!token || !tokenBalance) {
      return;
    }
    const { amount } = inputParams;
    const _inputErrors: {
      amount?: undefined | string
    } = {
      amount: undefined
    }
    let tokenBurnAmount = undefined;
    if (!amount) {
      _inputErrors.amount = t("please_enter") + t("wallet_issue_burn_amount");
    } else {
      try {
        tokenBurnAmount = new TokenAmount(token, ethers.utils.parseUnits(amount, token.decimals).toBigInt());
        const ZERO = new TokenAmount(token, ethers.utils.parseUnits("0", token.decimals).toBigInt());
        if (!tokenBurnAmount.greaterThan(ZERO)) {
          _inputErrors.amount = t("enter_correct") + t("wallet_issue_burn_amount");
        }
        if (tokenBurnAmount.greaterThan(tokenBalance)) {
          _inputErrors.amount = t("enter_correct") + t("wallet_issue_burn_amount");
        }
      } catch (err: any) {
        _inputErrors.amount = t("enter_correct") + t("wallet_issue_burn_amount");
      }
    }
    if (_inputErrors.amount) {
      setInputErrors({
        ..._inputErrors
      })
      return;
    }
    if (SRC20Contract && tokenBurnAmount) {
      setSending(true);
      SRC20Contract.burn(
        ethers.BigNumber.from(tokenBurnAmount.raw.toString())
      ).then((response: any) => {
        const { hash, data } = response;
        addTransaction({ to: SRC20Contract.address }, response, {
          call: {
            from: activeAccount,
            to: SRC20Contract.address,
            input: data,
            value: "0"
          }
        });
        setTransactionResponse(response);
        setTxHash(hash);
        setSending(false);
      }).catch((err: any) => {
        console.log("mint Error =", err.error)
        setErr(err);
        setSending(false);
      })
    }
  }

  return <Modal width={800} open={openBurnModal} footer={null} title={t("wallet_issue_burn_asset")} destroyOnClose onCancel={() => cancel()}>
    <Divider />
    <Spin spinning={loading}>
      <Row>
        <Col span={12}>
          <Text type="secondary">{t("wallet_src20_name")}</Text>
          <br />
          <Text strong>{src20TokenProp?.name}</Text>
        </Col>
        <Col span={12}>
          <Text type="secondary">{t("wallet_src20_symbol")}</Text>
          <br />
          <Text strong>{src20TokenProp?.symbol}</Text>
        </Col>
        <Col span={24} style={{ marginTop: "20px" }}>
          <Text type="secondary">{t("wallet_issue_asset_totalsupply")}</Text>
          <br />
          {
            totalSupply && <>
              <Text strong>
                {totalSupply.toExact()} {token.symbol}
              </Text>
            </>
          }
        </Col>
      </Row>
      <Divider />
      <Row>
        <Col span={24}>
          <Text type="secondary">{t("wallet_redeems_safe3_avaialbe")}</Text>
          <br />
          <Text strong>{tokenBalance?.toExact()} {token?.symbol}</Text>
        </Col>

        <Col span={24} style={{ marginTop: "5px" }}>
          <Text type="secondary">{t("wallet_issue_burn_amount")}</Text>
        </Col>
        <Col span={16}>
          <Input size="large" value={inputParams.amount} onChange={(event) => {
            const inputValue = event.target.value;
            setInputParams({
              ...inputParams,
              amount: inputValue
            });
            setInputErrors({
              ...inputErrors,
              amount: undefined
            })
          }} />
          {
            inputErrors.amount && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={<>
              {inputErrors.amount}
            </>} />
          }
        </Col>
      </Row>
      <Divider />
      <Row>
        <Col span={24}>
          {
            txHash && <>
              <Alert style={{ marginBottom: "10px" }} showIcon type="success" message={<>
                {txHash}
              </>} />
            </>
          }
          {
            err && <>
              <Alert style={{ marginBottom: "10px" }} showIcon type="error" message={<>
                {err.error.reason ?? err.error.toString()}
              </>} />
            </>
          }
          {
            !sending && !render && <Button icon={<SendOutlined />} onClick={() => {
              doBurn();
            }} type="primary">
              {t("wallet_send_status_broadcast")}
            </Button>
          }
          {
            sending && !render && <Button loading disabled type="primary">
              {t("wallet_send_status_sending")}
            </Button>
          }
          {
            render && <Button onClick={cancel}>
              {t("wallet_send_status_close")}
            </Button>
          }
        </Col>
      </Row>

    </Spin>

  </Modal>

}
