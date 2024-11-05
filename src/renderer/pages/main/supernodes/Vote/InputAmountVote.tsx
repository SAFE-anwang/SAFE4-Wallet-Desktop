import { Card, Spin } from "antd"
import { useETHBalances, useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { useMemo, useState } from "react";
import { CurrencyAmount, JSBI } from "@uniswap/sdk";
import { ethers } from "ethers";
import { ONE, ZERO } from "../../../../utils/CurrentAmountUtils";
import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Alert } from "antd"
import { SupernodeInfo } from "../../../../structs/Supernode";
import InputVoteModalConfirm from "./ InputVoteModal-Confirm";
import useAddrNodeInfo from "../../../../hooks/useAddrIsNode";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export default ({
  supernodeInfo, supernodeAddresses
}: {
  supernodeInfo?: SupernodeInfo,
  supernodeAddresses: string[]
}) => {

  const { t } = useTranslation();
  const activeAccount = useWalletsActiveAccount();
  const activeAccountETHBalance = useETHBalances([activeAccount])[activeAccount];
  const maxBalance = useMemo(() => {
    const gasPrice = JSBI.BigInt(ethers.utils.parseEther("0.00000000001").toString());
    const gasLimit = 500000;
    const gasPay = CurrencyAmount.ether(
      JSBI.multiply(gasPrice, JSBI.BigInt(gasLimit))
    );
    return (activeAccountETHBalance && activeAccountETHBalance.greaterThan(ZERO) && activeAccountETHBalance.greaterThan(gasPay))
      ? activeAccountETHBalance.subtract(gasPay) : ZERO;
  }, [activeAccountETHBalance]);
  const activeAccountNodeInfo = useAddrNodeInfo(activeAccount);
  const [openVoteModal, setOpenVoteModal] = useState<boolean>(false);
  const [params, setParams] = useState<{
    amount: string
  }>({
    amount: ""
  });
  const [inputErrors, setInputErrors] = useState<{
    amount: string | undefined
  }>({
    amount: undefined
  });

  const onClickVote = () => {
    const { amount } = params;
    if (!amount) {
      inputErrors.amount = t("enter") + t("wallet_supernodes_votes_amount");
    }
    if (amount) {
      try {
        let _amount = CurrencyAmount.ether(ethers.utils.parseEther(amount).toBigInt());
        if (_amount.greaterThan(maxBalance)) {
          inputErrors.amount = t("wallet_supernodes_votes_amount_notenough")
        }
        if (ONE.greaterThan(_amount)) {
          inputErrors.amount = t("wallet_supernodes_votes_amount_mush1safe");
        }
      } catch (error) {
        inputErrors.amount = t("enter") + t("wallet_supernodes_votes_amount") ;
      }
    }
    if (inputErrors.amount) {
      setInputErrors({ ...inputErrors })
      return;
    }
    setOpenVoteModal(true);
  }

  return <>
    <Card title={t("wallet_supernodes_votes_safe_title")}>
      <Alert style={{ marginBottom: "20px" }} showIcon message={<>
        {t("wallet_supernodes_votes_safe_tip")}
      </>} />
      <Row >
        <Col span={14}>
          <Text strong>{t("wallet_supernodes_votes_amount")}</Text>
          <br />
          <Space.Compact style={{ width: '100%' }}>
            <Input size="large" value={params.amount} onChange={(_input) => {
              const amountInputValue = _input.target.value;
              setInputErrors({
                ...inputErrors,
                amount: undefined
              })
              setParams({
                ...params,
                amount: amountInputValue
              })
            }}/>
            <Button size="large" onClick={() => {
              setInputErrors({
                ...inputErrors,
                amount: undefined
              })
              setParams({
                ...params,
                amount: maxBalance.toFixed(18)
              })
            }}>{t("wallet_send_max")}</Button>
          </Space.Compact>
        </Col>
        <Col span={10}>
          <Text style={{ float: "right" }} strong>{t("wallet_balance_currentavailable")}</Text>
          <br />
          <Text style={{ float: "right", fontSize: "18px", lineHeight: "36px" }}>
            {activeAccountETHBalance?.toFixed(6)}
          </Text>
        </Col>
        {
          inputErrors?.amount && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.amount} />
        }
      </Row>
      <br />
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={4}>
          <Spin spinning={activeAccountNodeInfo == undefined} >
            <Button disabled={(params.amount ? false : true) && activeAccountNodeInfo && !activeAccountNodeInfo.isSN} type="primary" style={{ float: "left" }} onClick={() => {
              onClickVote()
            }}>{t("vote")}</Button>
            {
              activeAccountNodeInfo && activeAccountNodeInfo.isSN &&
              <Alert style={{ marginTop: "5px" }} showIcon type="warning" message={<>
                超级节点不能进行投票
              </>} />
            }
          </Spin>
        </Col>
      </Row>
    </Card>
    {
      supernodeInfo && <InputVoteModalConfirm openVoteModal={openVoteModal} setOpenVoteModal={setOpenVoteModal}
        supernodeInfo={supernodeInfo} amount={params.amount} />
    }
  </>
}
