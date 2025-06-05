import { Divider, Modal } from "antd"
import BatchSyncNode from "../batchsync/BatchSyncNode";

export default ({
  openBatchNodeModal, setOpenBatchNodeModal
}: {
  openBatchNodeModal: boolean,
  setOpenBatchNodeModal: (openBatchNodeModal: boolean) => void
}) => {
  const cancel = () => {
    setOpenBatchNodeModal(false);
  }
  return <Modal title="批量同步主节点" width={1400} open={openBatchNodeModal} destroyOnClose footer={null} onCancel={cancel} >
    <Divider />
    <BatchSyncNode finishCallback={cancel} />
  </Modal>
}
