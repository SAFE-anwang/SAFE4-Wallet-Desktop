import { Divider, Modal } from "antd";
import { useState } from "react";
import WalletWithdrawModalInput from "./WalletWithdrawModal-Input";
import WalletWithdrawModalConfirm from "./WalletWithdrawModal-Confirm";
import { AccountRecord } from "../../../../structs/AccountManager";

const STEP_INPUT = 0;
const STEP_CONFIRM = 1;

export default ({
  openWithdrawModal,
  setOpenWithdrawModal,
  selectedAccountRecord
}: {
  openWithdrawModal: boolean,
  setOpenWithdrawModal: (open: boolean) => void
  selectedAccountRecord ?: AccountRecord
}) => {

  const [step, setStep] = useState(STEP_INPUT);
  const cancel = () => {
    setStep(STEP_INPUT);
    setOpenWithdrawModal(false);
  };
  return <>
    <Modal footer={null} destroyOnClose title="提现" style={{ height: "300px" }} open={openWithdrawModal} onCancel={cancel}>
      <Divider />
      {
        STEP_INPUT == step && <WalletWithdrawModalInput accountRecord={selectedAccountRecord} nextCallback={() => {
          setStep(STEP_CONFIRM);
        }}/>
      }
      {
        STEP_CONFIRM == step && <WalletWithdrawModalConfirm accountRecord={selectedAccountRecord} finishCallback={() => {
          cancel();
        }}/>
      }
    </Modal>
  </>

}
