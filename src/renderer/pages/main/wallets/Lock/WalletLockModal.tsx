
import { Button, Col, Divider, Input, Modal, Row, Typography, Space } from "antd"
import { Children, useEffect, useMemo, useState } from "react";
import WalletLockModalInput from "./WalletLockModal-Input";
import WalletLockModalConfirm from "./WalletLockModal-Confirm";

const STEP_INPUT = 0;
const STEP_CONFIRM = 1;

export default ({
  openLockModal,
  setOpenLockModal
}: {
  openLockModal: boolean,
  setOpenLockModal: (open: boolean) => void
}) => {

  const [step, setStep] = useState(STEP_INPUT);
  const initInputParams = {
    amount: "",
    lockDay: 0
  }
  const [inputParams, setInputParams] = useState<{
    amount: string,
    lockDay: number
  }>(initInputParams);

  const cancel = () => {
    setInputParams(initInputParams);
    setStep(STEP_INPUT);
    setOpenLockModal(false);
  };

  return <>
    <Modal footer={null} destroyOnClose title="锁仓" style={{ height: "300px" }} open={openLockModal} onCancel={cancel}>
      <Divider />
      {
        step == STEP_INPUT && <WalletLockModalInput finishCallback={({ amount, lockDay }) => {
          setInputParams({ amount, lockDay })
          setStep(STEP_CONFIRM);
        }} />
      }
      {
        step == STEP_CONFIRM && <WalletLockModalConfirm {...inputParams} close={cancel} />
      }
    </Modal>
  </>
}
