import { Modal } from "antd"
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AccountRecord } from "../../../../../structs/AccountManager";
import { applicationUpdateWalletTab } from "../../../../../state/application/action";
import AddLockModalInput from "./AddLockModal-Input";
import AddLockModalConfirm from "./AddLockModal-Confirm";
import { useTranslation } from "react-i18next";

const STEP_INPUT = 0;
const STEP_CONFIRM = 1;

export default ({
  openAddModal,
  setOpenAddModal,
  selectedAccountRecord,
}: {
  openAddModal: boolean,
  setOpenAddModal: (open: boolean) => void
  selectedAccountRecord?: AccountRecord,
}) => {

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [step, setStep] = useState(STEP_INPUT);
  const [txHash, setTxHash] = useState<string>();
  const [addLockDay, setAddLockDay] = useState<number>();

  const cancel = useCallback(() => {
    setStep(STEP_INPUT);
    setOpenAddModal(false);
    if (txHash) {
      setTxHash(undefined);
      // dispatch(applicationUpdateWalletTab("history"));
      // navigate("/main/wallet");
    }
  }, [txHash]);

  return <>
    <Modal footer={null} destroyOnClose title={t("wallet_locked_addLockDay")} style={{ height: "300px" }} open={openAddModal} onCancel={cancel}>
      {
        step == STEP_INPUT && selectedAccountRecord && <>
          <AddLockModalInput selectedAccountRecord={selectedAccountRecord} goNextCallback={(addLockDay) => {
            setAddLockDay(addLockDay);
            setStep(STEP_CONFIRM);
          }} />
        </>
      }
      {
        step == STEP_CONFIRM && selectedAccountRecord && addLockDay && <>
          <AddLockModalConfirm selectedAccountRecord={selectedAccountRecord} addLockDay={addLockDay}
            close={cancel} setTxHash={setTxHash} />
        </>
      }
    </Modal>
  </>

}
