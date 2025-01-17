
import { LeftOutlined, QuestionCircleTwoTone } from '@ant-design/icons';
import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert, Table, Spin } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContractCall from './ContractCall';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../../../state';
import { ContractCompileVO, ContractVO } from '../../../services';
import { fetchContractCompile, fetchContractVerifyForSingle } from '../../../services/contracts';
import config, { IPC_CHANNEL, Safe4_Business_Config } from '../../../config';
import { useWeb3React } from '@web3-react/core';
import { ContractCompileSignal, ContractCompile_Methods } from '../../../../main/handlers/ContractCompileHandler';
import { applicationControlContractVO } from '../../../state/application/action';
import useSafeScan from '../../../hooks/useSafeScan';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

export default () => {

  const { t } = useTranslation();
  const { chainId } = useWeb3React();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const contractVO = useSelector<AppState, ContractVO | undefined>(state => state.application.control.contractVO);
  const [contractCompileVO, setContractCompileVO] = useState<ContractCompileVO>();
  const [contractLocal, setContractLocal] = useState<{
    address: string, creator: string, abi: string, bytecode: string, name: string,
    chainId: number, transactionHash: string, sourceCode: string,
    compileOption: {
      compileVersion: string,
      evmVersion: string,
      optimizer: {
        enabled: boolean,
        runs: number
      }
    }
  }>();
  const [loading, setLoading] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);

  useEffect(() => {
    if (chainId && contractVO) {
      const address = contractVO.address;
      const method = ContractCompile_Methods.getContract;
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [ContractCompileSignal, method, [
        chainId, address
      ]]);
      window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
        if (arg instanceof Array && arg[0] == ContractCompileSignal && arg[1] == method) {
          const data = arg[2][0];
          const { id, address, creator, chain_id, transaction_hash, source_code, abi, bytecode, name, compile_option } = data;
          console.log("Local Contract :", data)
          setContractLocal({
            address, creator, abi, bytecode, name,
            chainId: chain_id,
            transactionHash: transaction_hash,
            sourceCode: source_code,
            compileOption: JSON.parse(compile_option)
          });
        }
      });
    }
  }, [chainId, contractVO]);

  const { URL, API } = useSafeScan();

  useEffect(() => {
    if (contractVO) {
      // 存在 name 则说明这个合约已经验证了;
      if (contractVO.name) {
        const { address, name } = contractVO;
        setLoading(true);
        fetchContractCompile(API, { address }).then(data => {
          setContractCompileVO(data);
          setLoading(false);
        });
      } else {

      }
    }
  }, [contractVO]);

  const doVerifyContractLocal = useCallback(() => {
    if (contractVO && contractLocal && contractLocal.sourceCode) {
      setVerifying(true);
      fetchContractVerifyForSingle(API, {
        contractAddress: contractLocal.address,
        contractSourceCode: contractLocal.sourceCode,
        optimizerEnabled: contractLocal.compileOption.optimizer.enabled,
        optimizerRuns: contractLocal.compileOption.optimizer.runs,
        evmVersion: contractLocal.compileOption.evmVersion,
        compileVersion: contractLocal.compileOption.compileVersion
      }).then((data: any) => {
        setVerifying(false);
        if (data.result == "err_1000") {
          // 合约验证通过;
          dispatch(applicationControlContractVO({
            ...contractVO,
            name: contractLocal.name
          }));
        } else {
          console.log("verify result:", data)
        }
      }).catch((err: any) => {
        console.log("verify err:", err)
      })
    }
  }, [contractLocal, contractVO]);

  const items: TabsProps['items'] = useMemo(() => {
    const _abi = contractCompileVO?.abi ? contractCompileVO.abi : contractLocal?.abi;
    return [
      {
        key: 'abi',
        label: 'ABI',
        children: <>{_abi}</>,
      },
      {
        key: 'contractCall',
        label: t("wallet_contracts_call"),
        disabled: !(_abi),
        children: (contractVO && _abi) ? <ContractCall address={contractVO.address} abi={_abi} /> : <></>,
      }
    ];
  }, [contractCompileVO, contractLocal, contractVO]);

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Button style={{ marginTop: "14px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/contracts")
        }} />
        <Title level={4} style={{ lineHeight: "16px" }}>
          {t("wallet_contracts")}
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px", minWidth: "1000px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Row>
          <Col span={24} style={{ marginBottom: "20px" }}>
            {
              contractCompileVO?.abi && <>
                <Alert showIcon type='info' message={<>
                  <Row>
                    <Col span={24}>
                      <Text style={{ float: "left" }}>{t("wallet_contracts_verify_tip_verified")}</Text>
                      <Button size='small' style={{ float: "right" }} onClick={() => {
                        window.open(`${URL}/address/${contractVO?.address}`)
                      }} >
                        <Text type='success'>{t("wallet_contracts_viewsource")}</Text>
                      </Button>
                    </Col>
                  </Row>
                </>} />
              </>
            }
            {
              !contractCompileVO?.abi && <>
                <Alert showIcon type='warning' message={<>
                  <Row>
                    <Col span={24}>
                      <Text style={{ float: "left" }}>{t("wallet_contracts_verify_tip_unverify")}</Text>
                      <Button size='small' style={{ float: "right" }} onClick={() => {
                        window.open(`${URL}/verifyContract?a=${contractVO?.address}`)
                      }}>
                        <Text type='warning'>{t("wallet_contracts_verify")}</Text>
                      </Button>
                    </Col>
                  </Row>
                </>} />
              </>
            }
          </Col>

          <Col span={12}>
            <Row>
              <Col span={24}>
                <Text type='secondary'>{t("wallet_contracts_address")}</Text>
              </Col>
              <Col span={24}>
                <Text strong>{contractVO?.address}</Text>
              </Col>
            </Row>
          </Col>
          <Col span={12}>
            <Row>
              <Col span={24}>
                <Text type='secondary'>{t("wallet_contracts_name")}</Text>
              </Col>

              <Col span={24}>
                <Spin spinning={verifying}>
                  {
                    !contractVO?.name && contractLocal && contractLocal.sourceCode && <>
                      <Tooltip title={t("wallet_contracts_updatetoverifytip")}>
                        <QuestionCircleTwoTone style={{ cursor: "pointer" }} twoToneColor='#7e7e7e' />
                      </Tooltip>
                      <Text style={{ marginLeft: "6px" }} type='secondary' italic>{contractLocal.name}</Text>
                      <Button onClick={doVerifyContractLocal} size='small' type='primary' style={{ float: "right", marginRight: "12px" }}>{t("wallet_contracts_uploadtoverify")}</Button>
                    </>
                  }
                  {
                    contractVO?.name && <Text strong>{contractVO?.name}</Text>
                  }
                </Spin>
              </Col>
            </Row>
          </Col>
        </Row>
        <Divider />
        <Spin spinning={loading}>
          <Card>
            <Tabs defaultActiveKey="abi" items={items} />
          </Card>
        </Spin>
      </div>
    </div>

  </>

}
