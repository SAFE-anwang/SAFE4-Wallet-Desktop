
import { Divider, Modal, } from "antd"
import { useCallback, useMemo, useState } from "react";
import WalletLockModalInput, { NormalLockParams } from "./WalletLockModal-Input";
import WalletLockModalConfirm from "./WalletLockModal-Confirm";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { applicationUpdateWalletTab } from "../../../../state/application/action";
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import WalletBatchLockModalInput, { BatchLockParams } from "./WalletBatchLockModal-Input";
import WalletBatchLockModalConfirm from "./WalletBatchLockModal-Confirm";

const STEP_INPUT = 0;
const STEP_CONFIRM = 1;

export enum LockType {
  Normal = "Normal",
  Batch = "Batch"
}

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
  const [lockType, setLockType] = useState<LockType>(LockType.Batch);

  const initInputParams = {
    normalLockParams: {
      amount: "",
      lockDay: 0,
    },
    batchLockParams: {
      perLockAmount: "",
      lockTimes: 36,
      startLockMonth: "",
      periodMonth: 1
    }
  }
  const [inputParams, setInputParams] = useState<{
    normalLockParams: NormalLockParams,
    batchLockParams: BatchLockParams
  }>(initInputParams);

  const [txHash, setTxHash] = useState<string>();

  const cancel = useCallback(() => {
    setInputParams(initInputParams);
    setStep(STEP_INPUT);
    setOpenLockModal(false);
    if (txHash) {
      setTxHash(undefined);
      dispatch(applicationUpdateWalletTab("history"));
      navigate("/main/wallet");
    }
  }, [txHash]);

  const items = useMemo<TabsProps['items']>(() => {
    return [
      {
        key: LockType.Normal,
        label: '锁仓',
        disabled : step == STEP_CONFIRM && lockType != LockType.Normal
      },
      {
        key: LockType.Batch,
        label: '批量锁仓',
        disabled : step == STEP_CONFIRM && lockType != LockType.Batch
      },
    ]

  }, [step , lockType]);

  // const items: TabsProps['items'] = [
  //   {
  //     key: LockType.Normal,
  //     label: '锁仓',

  //   },
  //   {
  //     key: LockType.Batch,
  //     label: '批量锁仓'
  //   },
  // ];

  return <>
    <Modal footer={null} title={<>
      <Tabs defaultActiveKey={lockType} items={items} onChange={(key) => {
        if (key == LockType.Normal) {
          setLockType(LockType.Normal)
        } else if (key == LockType.Batch) {
          setLockType(LockType.Batch)
        }
      }} />
    </>} destroyOnClose style={{ height: "300px" }} open={openLockModal} onCancel={cancel}>

      {/* { for Normal Lock } */}
      {
        step == STEP_INPUT && lockType == LockType.Normal && <WalletLockModalInput goNextCallback={(normalLockParams) => {
          setInputParams({
            ...inputParams,
            normalLockParams
          })
          setStep(STEP_CONFIRM);
        }} />
      }
      {
        step == STEP_CONFIRM && lockType == LockType.Normal && <WalletLockModalConfirm {...inputParams.normalLockParams} close={cancel} setTxHash={setTxHash} />
      }
      {/* { for Batch Lock } */}
      {
        step == STEP_INPUT && lockType == LockType.Batch && <WalletBatchLockModalInput goNextCallback={(batchLockParams) => {
          setInputParams({
            ...inputParams,
            batchLockParams
          })
          setStep(STEP_CONFIRM);
        }} />
      }
      {
        step == STEP_CONFIRM && lockType == LockType.Batch && <WalletBatchLockModalConfirm batchLockParams={inputParams.batchLockParams} close={cancel} setTxHash={setTxHash} />
      }
    </Modal>
  </>
}
