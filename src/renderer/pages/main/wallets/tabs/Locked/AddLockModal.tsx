import { Modal } from "antd"
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AccountRecord } from "../../../../../structs/AccountManager";
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
  const [step, setStep] = useState(STEP_INPUT);
  const [txHash, setTxHash] = useState<string>();

  const cancel = useCallback(() => {
    setStep(STEP_INPUT);
    setOpenAddModal(false);
    if (txHash) {
      setTxHash(undefined);
    }
  }, [txHash]);

  return <>
    <Modal footer={null} destroyOnClose title={t("wallet_locked_addLockDay")} style={{ height: "300px" }} open={openAddModal} onCancel={cancel}>
      {
       selectedAccountRecord && <>
          <AddLockModalInput selectedAccountRecord={selectedAccountRecord}
            close={cancel} setTxHash={setTxHash} />
        </>
      }
      {/* {
        step == STEP_CONFIRM && selectedAccountRecord && addLockDay && <>
          <AddLockModalConfirm selectedAccountRecord={selectedAccountRecord} addLockDay={addLockDay}
            close={cancel} setTxHash={setTxHash} />
        </>
      } */}
    </Modal>
  </>

}
