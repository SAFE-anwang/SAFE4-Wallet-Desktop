import { Divider, Modal, Typography } from "antd";
import { useCallback, useState } from "react";
import WalletWithdrawModalInput from "./WalletWithdrawModal-Input";
import { AccountRecord } from "../../../../structs/AccountManager";
import { useTranslation } from "react-i18next";
import { Contract } from "ethers";

export default ({
  openWithdrawModal,
  setOpenWithdrawModal,
  selectedAccountRecord,
  accountManagerContract
}: {
  openWithdrawModal: boolean,
  setOpenWithdrawModal: (open: boolean) => void
  selectedAccountRecord: AccountRecord,
  accountManagerContract: Contract,
}) => {

  const { t } = useTranslation();
  const [txHash, setTxHash] = useState<string>();
  const cancel = useCallback(() => {
    setOpenWithdrawModal(false);
    if (txHash) {
      setTxHash(undefined);
    }
  }, [txHash]);

  return <>
    <Modal footer={null} destroyOnClose title={t("wallet_withdraw")} style={{ height: "300px" }} open={openWithdrawModal} onCancel={cancel}>
      <Divider />
      {
        selectedAccountRecord && <>
          <WalletWithdrawModalInput selectedAccountRecord={selectedAccountRecord} accountManagerContract={accountManagerContract}
            close={cancel} setTxHash={setTxHash} />
        </>
      }
    </Modal>
  </>

}
