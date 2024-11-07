
import { Alert, Button, Col, Divider, Modal, Row, Space, Typography } from 'antd';
import { useWalletsActiveAccount } from '../../../../../state/wallets/hooks';
import AddressComponent from '../../../../components/AddressComponent';
import { useCallback } from 'react';
import { useWeb3React } from '@web3-react/core';
import { IPC_CHANNEL } from '../../../../../config';
import { DBAddressActivitySignal, DB_AddressActivity_Methods } from '../../../../../../main/handlers/DBAddressActivitySingalHandler';
import { useDispatch } from 'react-redux';
import { clearAllTransactions, reloadTransactionsAndSetAddressActivityFetch } from '../../../../../state/transactions/actions';
import { TransactionDetails } from '../../../../../state/transactions/reducer';
import { useTranslation } from 'react-i18next';
const { confirm } = Modal;

const { Text } = Typography;

export default ({
  openClearHistoryModal, cancel
}: {
  openClearHistoryModal: boolean,
  cancel: () => void
}) => {

  const { t } = useTranslation();
  const activeAccount = useWalletsActiveAccount();
  const { chainId } = useWeb3React();
  const dispatch = useDispatch();

  const clearHistory = useCallback(
    () => {
      if (activeAccount && chainId) {
        const method = DB_AddressActivity_Methods.deleteAddressActivities;
        window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [DBAddressActivitySignal, method, [activeAccount, chainId]]);
        const txns : TransactionDetails[] = [] ;
        dispatch(reloadTransactionsAndSetAddressActivityFetch({
          txns,
          addressActivityFetch: {
            address: activeAccount,
            blockNumberStart: 1,
            blockNumberEnd: 99999999,
            current: 1,
            pageSize: 500,
            status: 0,
            dbStoredRange : {
              start : 99999999 ,
              end : 1,
            },
            chainId
          }
        }));
        cancel();
      }
    },
    [activeAccount , chainId],
  )

  return <>
    <Modal destroyOnClose title={t("operation_confirm")} open={openClearHistoryModal} closable footer={null} onCancel={cancel}>
      <Divider />
      <Row>
        <Col span={24}>
          <Text strong type='danger'>{t("wallet_history_clear_tip0")}</Text>
        </Col>
        <Col span={24} style={{ marginTop: "20px" }}>
          <Text type='secondary'>{t("wallet_address")}</Text>
          <AddressComponent address={activeAccount} />
        </Col>
        <Col span={24} style={{ marginTop: "20px" }}>
          <Alert showIcon type='warning' message={<>
            {t("wallet_history_clear_tip1")}
          </>} />
        </Col>
      </Row>
      <Divider />
      <Row>
        <Col span={24}>
          <Button onClick={clearHistory} type='primary' style={{ float: "right" }}>{t("confirm")}</Button>
        </Col>
      </Row>
    </Modal>
  </>


}
