import { Divider, Modal } from "antd";
import { useCallback, useState } from "react";
import WalletWithdrawModalInput from "./WalletWithdrawModal-Input";
import WalletWithdrawModalConfirm from "./WalletWithdrawModal-Confirm";
import { AccountRecord } from "../../../../structs/AccountManager";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { applicationUpdateWalletTab } from "../../../../state/application/action";

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

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [step, setStep] = useState(STEP_INPUT);
  const [txHash,setTxHash] = useState<string>();

  const cancel = useCallback( () => {
    setStep(STEP_INPUT);
    setOpenWithdrawModal(false);
    if (txHash){
      setTxHash(undefined);
      dispatch(applicationUpdateWalletTab("history"));
      navigate("/main/wallet");
    }
  } , [txHash]);

  return <>
    <Modal footer={null} destroyOnClose title="提现" style={{ height: "300px" }} open={openWithdrawModal} onCancel={cancel}>
      <Divider />
      {
        STEP_INPUT == step && <WalletWithdrawModalInput accountRecord={selectedAccountRecord} nextCallback={() => {
          setStep(STEP_CONFIRM);
        }}/>
      }
      {
        STEP_CONFIRM == step && <WalletWithdrawModalConfirm setTxHash={setTxHash} accountRecord={selectedAccountRecord} cancel={cancel}/>
      }
    </Modal>
  </>

}
