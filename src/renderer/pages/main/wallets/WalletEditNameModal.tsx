import { Alert, Button, Col, Divider, Input, Modal, Row, Typography } from "antd"
import { useCallback, useEffect, useState } from "react";
import { useWalletsActiveWallet, useWalletsList, useWalletsWalletNames } from "../../../state/wallets/hooks";
import { useDispatch } from "react-redux";
import { walletsUpdateWalletName } from "../../../state/wallets/action";
import useWalletName from "../../../hooks/useWalletName";
import { WalletNameSignal, WalletName_Methods } from "../../../../main/handlers/WalletNameHandler";
import { IPC_CHANNEL } from "../../../config";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const activeWallet = useWalletsActiveWallet();
  const activeWalletName = useWalletName(activeWallet?.address);
  const walletsWalletNames = useWalletsWalletNames();
  const [inputParams, setInputParams] = useState<{
    newName: string | undefined
  }>({
    newName: undefined
  });
  const [inputErrors, setInputErrors] = useState<{
    newName: string | undefined
  }>({
    newName: undefined
  });
  useEffect(() => {
    if (activeWallet) {
      setInputParams({
        newName: activeWalletName
      })
    }
  }, [activeWallet, activeWalletName]);

  useEffect(() => {
    if (activeWallet && walletsWalletNames) {
      let isUnique = true;
      Object.keys(walletsWalletNames).forEach(_address => {
        const { name } = walletsWalletNames[_address];
        if (name == inputParams.newName && activeWallet.address != _address) {
          isUnique = false;
        }
      });
      if (!isUnique) {
        setInputErrors({
          ...inputErrors,
          newName: t("wallet_name_alreadyused")
        });
      } else {
        setInputErrors({
          newName: undefined
        })
      }
    }
  }, [walletsWalletNames, inputParams, activeWallet])

  const cancel = useCallback(() => {
    setOpenEditNameModal(false);
  }, [activeWallet]);

  const updateWalletName = useCallback(() => {
    if (inputParams.newName && !inputErrors.newName && activeWallet) {
      const { address } = activeWallet;
      dispatch(walletsUpdateWalletName({
        address,
        name: inputParams.newName
      }));
      const method = WalletName_Methods.saveOrUpdate;
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [WalletNameSignal, method, [
        {
          address ,
          name : inputParams.newName ,
          active : 1
        }
      ]]);
      cancel();
    } else {
      setInputErrors({
        ...inputErrors,
        newName: t("please_enter") + t("wallet_name_alreadyused")
      })
    }
  }, [inputErrors, inputParams, activeWallet]);

  return <>
    <Modal footer={null} destroyOnClose title={t("wallet_name_edit")} style={{ height: "300px" }} open={openEditNameModal} onCancel={cancel}>
      <Divider />
      <Row>
        <Col span={24}>
          <Text type="secondary">{t("wallet_name")}</Text>
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
          <Button type="primary" onClick={updateWalletName}>{t("save")}</Button>
        </Col>
      </Row>
    </Modal>
  </>
}
