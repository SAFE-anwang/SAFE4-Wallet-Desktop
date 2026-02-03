import { Divider, Modal } from "antd"
import BatchSyncNode from "../batchsync/BatchSyncNode";
import { useDispatch } from "react-redux";
import { walletsUpdateForceOpen } from "../../../state/wallets/action";

export default ({
  openBatchNodeModal, setOpenBatchNodeModal , checkedMNIds
}: {
  openBatchNodeModal: boolean,
  setOpenBatchNodeModal: (openBatchNodeModal: boolean) => void ,
  checkedMNIds : number[],
}) => {

  const dispatch = useDispatch();

  const cancel = () => {
    setOpenBatchNodeModal(false);
    dispatch(walletsUpdateForceOpen(false));
  }
  return <Modal title="批量同步主节点" width={1400} open={openBatchNodeModal} destroyOnClose footer={null} onCancel={cancel} >
    <Divider />
    <BatchSyncNode finishCallback={cancel} checkedMNIds={checkedMNIds}/>
  </Modal>
}
