import { Button, Col, Divider, Input, Modal, Row, Typography, Space } from "antd"
import { Children, useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { applicationUpdateWalletTab } from "../../../../../state/application/action";
import { Token } from "@uniswap/sdk";
import TokenSendModalInput from "./TokenSendModal-Input";
import TokenSendModalConfirm from "./TokenSendModal-Confirm";
import { useTranslation } from "react-i18next";
const { Text } = Typography;

const STEP_INPUT = 0;
const STEP_CONFIRM = 1;

export default ({
  openSendModal,
  setOpenSendModal,
  token,
}: {
  openSendModal: boolean,
  setOpenSendModal: (open: boolean) => void,
  token: Token
}) => {

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [step, setStep] = useState(STEP_INPUT);
  const [inputParams, setInputParams] = useState<{
    to: string,
    amount: string
  }>({
    to: "",
    amount: "",
  });
  const [txHash, setTxHash] = useState<string>();
  const cancel = useCallback(() => {
    setInputParams({
      to: "",
      amount: "",
    });
    setStep(STEP_INPUT);
    setOpenSendModal(false);
    if (txHash) {
      setTxHash(undefined);
      dispatch(applicationUpdateWalletTab("history"));
      navigate("/main/wallet");
    }
  }, [txHash]);

  return <>
    <Modal footer={null} destroyOnClose title={t("wallet_tokens_send")} style={{ height: "300px" }} open={openSendModal} onCancel={cancel}>
      <Divider />
      {
        step == STEP_INPUT && <TokenSendModalInput token={token} goNextCallback={({ to, amount }) => {
          setInputParams({
            to, amount
          });
          setStep(STEP_CONFIRM);
        }} />
      }
      {
        step == STEP_CONFIRM && <TokenSendModalConfirm token={token} close={cancel} {...inputParams} setTxHash={setTxHash} />
      }
    </Modal>
  </>

}
