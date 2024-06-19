import { Alert, Button, Col, Divider, Input, Modal, Row, Typography } from "antd"
import { useCallback, useEffect, useState } from "react";
import { useWalletsActiveWallet, useWalletsList } from "../../../state/wallets/hooks";

const { Text } = Typography;

export default (
  {
    openEditNameModal,
    setOpenEditNameModal
  }: {
    openEditNameModal: boolean,
    setOpenEditNameModal: (open: boolean) => void
  }
) => {

  const activeWallet = useWalletsActiveWallet();
  const walletsList = useWalletsList();
  const [inputParams, setInputParams] = useState<{
    newName: string | undefined
  }>({
    newName: activeWallet?.name
  });
  const [inputErrors, setInputErrors] = useState<{
    newName: string | undefined
  }>({
    newName: undefined
  });

  useEffect(() => {
    if (activeWallet) {
      let isUnique = true;
      walletsList.forEach((wallet) => {
        const { address, name } = wallet;
        if (name == inputParams.newName && activeWallet.address != address) {
          isUnique = false;
        }
      });
      if (!isUnique) {
        setInputErrors({
          ...inputErrors,
          newName: "钱包名称已使用"
        })
      } else {
        setInputErrors({
          newName: undefined
        })
      }
    }
  }, [walletsList, inputParams, activeWallet])




  const cancel = useCallback(() => {
    setOpenEditNameModal(false);
  }, []);

  return <>
    <Modal footer={null} destroyOnClose title="编辑钱包名称" style={{ height: "300px" }} open={openEditNameModal} onCancel={cancel}>
      <Divider />
      <Row>
        <Col span={24}>
          <Text type="secondary">钱包名称</Text>
        </Col>
        <Col span={24}>
          <Input value={inputParams.newName} onChange={(event) => {
            const value = event.target.value.trim();
            setInputParams({ newName: value });
          }} />
          {
            inputErrors.newName && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.newName} />
          }
        </Col>
      </Row>
      <Divider />
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          <Button type="primary">保存</Button>
        </Col>
      </Row>
    </Modal>
  </>
}
