
import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert, Table } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useWalletsActiveAccount } from '../../state/wallets/hooks';
import { fetchGetTestCoin } from '../../services/gettestcoin';
import { useTransactionAdder2 } from '../../state/transactions/hooks';
import ChecksumAddress from '../../utils/ChecksumAddress';
import { applicationUpdateWalletTab } from '../../state/application/action';
import { useWeb3React } from '@web3-react/core';
import useSafeScan from '../../hooks/useSafeScan';
import { DB_AddressActivity_Actions, DB_AddressActivity_Methods, DBAddressActivitySignal } from '../../../main/handlers/DBAddressActivitySingalHandler';
import { IPC_CHANNEL, Safe4_Network_Config } from '../../config';
import { DateFormat } from '../../utils/DateUtils';
import EtherAmount from '../../utils/EtherAmount';
import Safescan from '../components/Safescan';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

export default () => {

  const { t } = useTranslation();
  const activeAccount = useWalletsActiveAccount();
  const [err, setErr] = useState<string>();
  const [sending, setSending] = useState<boolean>(false);
  const addTransaction = useTransactionAdder2();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { chainId } = useWeb3React();
  const { API } = useSafeScan();

  const doFetchGetTestCoin = useCallback(() => {
    if (chainId) {
      setSending(true);
      fetchGetTestCoin(API, { address: activeAccount })
        .then(({ transactionHash, amount, address, from }: any) => {
          addTransaction({
            from: ChecksumAddress(from),
            to: address,
            hash: transactionHash,
            chainId
          }, {
            transfer: {
              from: ChecksumAddress(from),
              to: address,
              value: ethers.utils.parseEther(amount).toString()
            }
          });
          dispatch(applicationUpdateWalletTab("history"));
          navigate("/main/wallet");
          setSending(false);
        })
        .catch((err: any) => {
          setSending(false);
          const { code, message } = JSON.parse(err.message);
          if (code == "11101") {
            setErr(t("wallet_getcoins_error_getalready"));
          } else if (code == "11102") {
            setErr(t("wallet_getcoins_error_empty"))
          } else if (code == "11103") {
            setErr(t("wallet_getcoins_error_ipfilled"))
          }
          else {
            setErr(t("wallet_getcoins_error_empty"))
          }
        })
    }
  }, [activeAccount, chainId, API]);

  useEffect(() => {
    setErr(undefined);
  }, [activeAccount]);

  const columns = [
    {
      title: t("wallet_getcoins_col_time"),
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => {
        return <>{DateFormat(timestamp, "yyyy-MM-dd HH:mm:ss")}</>
      }
    },
    {
      title: t("wallet_getcoins_col_amount"),
      dataIndex: 'value',
      key: 'value',
      render: (value: any) => {
        return <>
          <Text strong><EtherAmount raw={value}></EtherAmount> SAFE</Text>
        </>
      }
    },
    {
      title: t("wallet_getcoins_col_transactionHash"),
      dataIndex: 'transactionHash',
      key: 'transactionHash',
      render: (transactionHash: any) => {
        return <>
          <Text>{transactionHash}</Text>
          <Text style={{ float: "right" }}>
            <Safescan url={`/tx/${transactionHash}`} />
          </Text>
        </>
      }
    },
  ];

  const [getCoinTransfers, setGetCoinTransfers] = useState();

  useEffect(() => {
    if (chainId) {
      const method = DB_AddressActivity_Methods.getActivitiesFromToAction;
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [DBAddressActivitySignal, method, [
        chainId == Safe4_Network_Config.Testnet.chainId ? Safe4_Network_Config.Testnet.claimFrom : Safe4_Network_Config.Mainnet.claimFrom,
        activeAccount, DB_AddressActivity_Actions.Transfer, chainId
      ]]);
      window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
        if (arg instanceof Array && arg[0] == DBAddressActivitySignal && arg[1] == method) {
          const data = arg[2][0];
          const hashes: {
            [transactionHash: string]: {}
          } = {}
          const transfers = data.map((activity: any) => {
            const { added_time, timestamp, data, block_number, transaction_hash } = activity;
            const { from, to, value } = JSON.parse(data);
            return {
              timestamp: timestamp ? timestamp : added_time,
              blockNumber: block_number,
              transactionHash: transaction_hash,
              from, to, value
            }
          }).sort((t0: any, t1: any) => {
            return t1.timestamp - t0.timestamp
          }).filter((transfer: any) => {
            if (!hashes[transfer.transactionHash]) {
              hashes[transfer.transactionHash] = {};
              return true;
            }
            return false;
          })
          console.log(hashes)
          setGetCoinTransfers(transfers);
        }
      });
    }
  }, [chainId, activeAccount]);

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          {t("wallet_getcoins")}
        </Title>
      </Col>
    </Row>
    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{ marginBottom: "20px" }}>
          <Alert type='info' showIcon message={<>
            <Text>{t("wallet_getcoins_tip0")} <Text strong>{t("wallet_getcoins_tip1", { count: 1 })}</Text></Text>
          </>} />
          <Divider />
          <Button disabled={(err || sending) ? true : false} onClick={doFetchGetTestCoin}>{t("wallet_getcoins_button")}</Button><br /><br />
          {
            err && <Alert type='error' showIcon message={<>
              {err}
            </>} />
          }
        </Card>
        <Divider />
        <Card title="领取记录">
          <Table dataSource={getCoinTransfers} columns={columns} />
        </Card>
      </div>
    </div>
  </>

}
