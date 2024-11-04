import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert, Table } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileAddOutlined } from '@ant-design/icons';
import { useWeb3React } from '@web3-react/core';
import { ContractCompileSignal, ContractCompile_Methods } from '../../../../main/handlers/ContractCompileHandler';
import { IPC_CHANNEL } from '../../../config';
import ContractList from './ContractList';
import { useTranslation } from 'react-i18next';
const { Title, Text } = Typography;

export default () => {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { chainId } = useWeb3React();
  const [contracts, setContracts] = useState<any[]>();

  useEffect(() => {
    if (chainId) {
      const method = ContractCompile_Methods.getAll;
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [ContractCompileSignal, method, [
        chainId
      ]]);
      window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
        if (arg instanceof Array && arg[0] == ContractCompileSignal && arg[1] == method) {
          const data = arg[2][0];
          const contracts = data.map((contractDB: any) => {
            const { id, address, creator, chain_id, transaction_hash, source_code, abi, bytecode, name, added_time } = contractDB;
            return {
              id, address, creator, abi, bytecode, name,
              chainId: chain_id,
              transactionHash: transaction_hash,
              sourceCode: source_code,
              addedTime: added_time
            }
          });
          console.log("load contracts from sqlite3 >>", contracts);
          setContracts(contracts);
        }
      });
    }
  }, [chainId]);

  const items: TabsProps['items'] = useMemo(() => {
    if (contracts) {
      return [
        {
          key: 'list',
          label: t("wallet_contracts_list"),
          children: <ContractList queryContracts={true} localContracts={contracts} />,
        },
        {
          key: 'localContracts',
          label: t("wallet_contracts_local"),
          children: <ContractList queryContracts={false} localContracts={contracts} />,
        }
      ]
    }
  }, [contracts])

  return <>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          {t("wallet_contracts")}
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{ marginBottom: "20px" }}>
          <Alert showIcon type="info" message={<>
            <p>{t("wallet_contracts_tip0")}</p>
            <p>{t("wallet_contracts_tip1")}</p>
          </>} />
          <Divider />
          <Row>
            <Col span={24}>
              <Button icon={<FileAddOutlined />} type='primary' onClick={() => navigate("/main/contracts/edit")}>
                {t("wallet_contracts_deploy")}
              </Button>
            </Col>
          </Row>
        </Card>

        <Card>
          <Tabs items={items} ></Tabs>
        </Card>

      </div>
    </div>

  </>

}
