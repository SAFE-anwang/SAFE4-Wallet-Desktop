
import { Divider,Modal,} from "antd"
import { useCallback, useState } from "react";
import WalletLockModalInput from "./WalletLockModal-Input";
import WalletLockModalConfirm from "./WalletLockModal-Confirm";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { applicationUpdateWalletTab } from "../../../../state/application/action";

const STEP_INPUT = 0;
const STEP_CONFIRM = 1;

export default ({
  openLockModal,
  setOpenLockModal
}: {
  openLockModal: boolean,
  setOpenLockModal: (open: boolean) => void
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [step, setStep] = useState(STEP_INPUT);
  const initInputParams = {
    amount: "",
    lockDay: 0
  }
  const [inputParams, setInputParams] = useState<{
    amount: string,
    lockDay: number
  }>(initInputParams);
  const [txHash , setTxHash] = useState<string>();

  const cancel = useCallback( () => {
    setInputParams(initInputParams);
    setStep(STEP_INPUT);
    setOpenLockModal(false);
    if (txHash){
      setTxHash(undefined);
      dispatch(applicationUpdateWalletTab("history"));
      navigate("/main/wallet");
    }
  } , [txHash] );

  return <>
    <Modal footer={null} destroyOnClose title="锁仓" style={{ height: "300px" }} open={openLockModal} onCancel={cancel}>
      <Divider />
      {
        step == STEP_INPUT && <WalletLockModalInput goNextCallback={({ amount, lockDay }) => {
          setInputParams({ amount, lockDay })
          setStep(STEP_CONFIRM);
        }}/>
      }
      {
        step == STEP_CONFIRM && <WalletLockModalConfirm {...inputParams} close={cancel} setTxHash={setTxHash} />
      }
    </Modal>
  </>
}
