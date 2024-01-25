import { Button, Col, Divider, Input, Modal, Row, Typography, Space } from "antd"
import { Children, useEffect, useMemo, useState } from "react";
import WalletSendModalInput from "./WalletSendModal-Input";
import WalletSendModalConfirm from "./WalletSendModal-Confirm";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { applicationUpdateWalletTab } from "../../../../state/application/action";
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

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [step, setStep] = useState(STEP_INPUT);
  const [inputParams, setInputParams] = useState<{
    to: string,
    amount: string
  }>({
    to: "",
    amount: ""
  });

  return <>
    <Modal footer={null} destroyOnClose title="发送" style={{ height: "300px" }} open={openSendModal} onCancel={() => {
      setInputParams({
        to: "",
        amount: ""
      });
      setStep(STEP_INPUT);
      setOpenSendModal(false);
    }}>
      <Divider />
      {
        step == STEP_INPUT && <WalletSendModalInput finishCallback={({ to, amount }) => {
          setInputParams({
            to, amount
          });
          setStep(STEP_CONFIRM);
        }} />
      }
      {
        step == STEP_CONFIRM && <WalletSendModalConfirm close={() => {
          setInputParams({
            to: "",
            amount: ""
          });
          setStep(STEP_INPUT);
          setOpenSendModal(false);
          dispatch(applicationUpdateWalletTab("history"));
          navigate("/main/wallet");
        }} {...inputParams} />
      }
    </Modal>
  </>

}
