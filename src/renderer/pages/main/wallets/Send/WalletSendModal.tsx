import { Button, Col, Divider, Input, Modal, Row, Typography, Space } from "antd"
import { Children, useCallback, useEffect, useMemo, useState } from "react";
import WalletSendModalInput from "./WalletSendModal-Input";
import WalletSendModalConfirm from "./WalletSendModal-Confirm";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { applicationUpdateWalletTab } from "../../../../state/application/action";
import { useTranslation } from "react-i18next";
const { Text } = Typography;

const STEP_INPUT = 0;
const STEP_CONFIRM = 1;

export default ({
  openSendModal,
  setOpenSendModal
}: {

  openSendModal: boolean,
  setOpenSendModal: (open: boolean) => void

}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [step, setStep] = useState(STEP_INPUT);
  const [inputParams, setInputParams] = useState<{
    to: string,
    amount: string,
    lockDay : number | undefined
  }>({
    to: "",
    amount: "",
    lockDay : undefined
  });
  const [txHash , setTxHash] = useState<string>();
  const cancel = useCallback(() => {
    setInputParams({
      to: "",
      amount: "",
      lockDay : undefined
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
    <Modal footer={null} destroyOnClose title={t("wallet_send")} style={{height: "300px"}} open={openSendModal} onCancel={cancel}>
      <Divider />
      {
        step == STEP_INPUT && <WalletSendModalInput goNextCallback={({to,amount , lockDay}) => {
          setInputParams({
            to, amount , lockDay
          });
          setStep(STEP_CONFIRM);
        }}/>
      }
      {
        step == STEP_CONFIRM && <WalletSendModalConfirm close={cancel} {...inputParams} setTxHash={setTxHash} />
      }
    </Modal>
  </>

}
