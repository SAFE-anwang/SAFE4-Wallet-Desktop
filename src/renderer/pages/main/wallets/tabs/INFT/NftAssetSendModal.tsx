import { Divider, Modal } from "antd";
import { NftAssetVO, NftTokenVO } from "../../../../../services/insight"
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useCallback, useState } from "react";
import NftAssetSendModalConfirm from "./NftAssetSendModal-Confirm";
import NftAssetSendModalInput from "./NftAssetSendModal-Input";


const STEP_INPUT = 0;
const STEP_CONFIRM = 1;


export default ({
  openSendModal,
  setOpenSendModal,
  nftAssetVO,
  nftTokenVO
}: {
  openSendModal: boolean,
  setOpenSendModal: (open: boolean) => void,
  nftAssetVO: NftAssetVO,
  nftTokenVO: NftTokenVO
}) => {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(STEP_INPUT);
  const [inputParams, setInputParams] = useState<{
    to: string,
    amount: number
  }>({
    to: "",
    amount: 0,
  });
  const [txHash, setTxHash] = useState<string>();
  const cancel = useCallback(() => {
    setInputParams({
      to: "",
      amount: 0,
    });
    setStep(STEP_INPUT);
    setOpenSendModal(false);
    if (txHash) {
      setTxHash(undefined);
    }
  }, [txHash]);

  return <>
    <Modal footer={null} destroyOnClose title={"发送 NFT 资产"} style={{ height: "300px" }} open={openSendModal} onCancel={cancel}>
      <Divider />
      {
        step == STEP_INPUT && <NftAssetSendModalInput nftTokenVO={nftTokenVO} nftAssetVO={nftAssetVO} goNextCallback={({ to, amount }) => {
          setInputParams({
            to, amount
          });
          setStep(STEP_CONFIRM);
        }} />
      }
      {
        step == STEP_CONFIRM && <NftAssetSendModalConfirm nftTokenVO={nftTokenVO} nftAssetVO={nftAssetVO} close={cancel} {...inputParams} setTxHash={setTxHash} />
      }
    </Modal>
  </>
}
