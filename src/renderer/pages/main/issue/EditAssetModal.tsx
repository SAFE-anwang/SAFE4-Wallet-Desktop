import { Alert, Button, Col, Divider, Input, Modal, Row, Spin, Typography } from "antd"
import { useEffect, useMemo, useState } from "react";
import { useContract, useMulticallContract } from "../../../hooks/useContracts";
import { ISRC20_Interface } from "../../../abis";
import CallMulticallAggregate, { CallMulticallAggregateContractCall } from "../../../state/multicall/CallMulticallAggregate";
import { TxExecuteStatus } from "../safe3/Safe3";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../state/transactions/hooks";

const { Text } = Typography;

export interface SRC20TokenProp {
  name: string,
  symbol: string,
  whitePaperUrl: string,
  officialUrl: string,
  orgName: string,
  description: string,
}

export default ({
  openEditAssetModal, setOpenEditAssetModal,
  address
}: {
  openEditAssetModal: boolean,
  setOpenEditAssetModal: (openEditAssetModal: boolean) => void,
  address: string
}) => {

  const multicallContract = useMulticallContract();
  const SRC20Contract = useContract(address, ISRC20_Interface, true);
  const [loading, setLoading] = useState<boolean>();
  const [updating, setUpdating] = useState<boolean>();
  const [updateFinish, setUpdateFinish] = useState<boolean>(false);
  const [src20TokenProp, setSrc20TokenProp] = useState<SRC20TokenProp>();
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();

  const [inputParams, setInputParams] = useState<SRC20TokenProp>({
    name: "",
    symbol: "",
    whitePaperUrl: "",
    officialUrl: "",
    orgName: "",
    description: "",
  });

  const [updates, setUpdates] = useState<{
    whitePaperUrl?: TxExecuteStatus,
    officialUrl?: TxExecuteStatus,
    orgName?: TxExecuteStatus,
    description?: TxExecuteStatus
  }>();

  const cancel = () => {
    setOpenEditAssetModal(false);
  }

  useEffect(() => {
    if (multicallContract && SRC20Contract) {
      const nameCall: CallMulticallAggregateContractCall = {
        contract: SRC20Contract,
        functionName: "name",
        params: []
      };
      const symbolCall: CallMulticallAggregateContractCall = {
        contract: SRC20Contract,
        functionName: "symbol",
        params: []
      };
      const descriptionCall: CallMulticallAggregateContractCall = {
        contract: SRC20Contract,
        functionName: "description",
        params: []
      };
      const whitePaperUrlCall: CallMulticallAggregateContractCall = {
        contract: SRC20Contract,
        functionName: "whitePaperUrl",
        params: []
      };
      const orgNameCall: CallMulticallAggregateContractCall = {
        contract: SRC20Contract,
        functionName: "orgName",
        params: []
      };
      const officiaUrlCall: CallMulticallAggregateContractCall = {
        contract: SRC20Contract,
        functionName: "officialUrl",
        params: []
      };
      const calls = [nameCall, symbolCall,
        descriptionCall, whitePaperUrlCall, orgNameCall, officiaUrlCall];
      setLoading(true);
      CallMulticallAggregate(multicallContract, calls, () => {
        setLoading(false);
        const name = nameCall.result;
        const symbol = symbolCall.result;
        const description = descriptionCall.result;
        const whitePaperUrl = whitePaperUrlCall.result;
        const orgName = orgNameCall.result;
        const officialUrl = officiaUrlCall.result;
        const src20Prop: SRC20TokenProp = {
          name, symbol,
          description, whitePaperUrl, orgName, officialUrl
        }
        setSrc20TokenProp(src20Prop);
        setInputParams({
          ...src20Prop
        })
      })
    }
  }, [address, multicallContract, SRC20Contract]);

  const update = async () => {
    if (src20TokenProp && SRC20Contract && activeAccount) {
      const { whitePaperUrl, orgName, officialUrl, description } = inputParams;
      setUpdating(true);
      let _updates = updates ?? {};
      if (whitePaperUrl != src20TokenProp.whitePaperUrl) {
        try {
          const response = await SRC20Contract.setWhitePaperUrl(whitePaperUrl);
          _updates.whitePaperUrl = {
            status: 1,
            txHash: response.hash
          }
          setUpdates({ ..._updates });
          const { hash, data } = response;
          addTransaction({ to: SRC20Contract.address }, response, {
            call: {
              from: activeAccount,
              to: SRC20Contract.address,
              input: data,
              value: "0"
            }
          });
        } catch (err: any) {
          _updates.whitePaperUrl = {
            status: 0,
            error: err.error.reason
          }
          setUpdates({ ..._updates });
        }
      }
      if (orgName != src20TokenProp.orgName) {
        try {
          const response = await SRC20Contract.setOrgName(orgName);
          _updates.orgName = {
            status: 1,
            txHash: response.hash
          }
          setUpdates({ ..._updates });
          const { hash, data } = response;
          addTransaction({ to: SRC20Contract.address }, response, {
            call: {
              from: activeAccount,
              to: SRC20Contract.address,
              input: data,
              value: "0"
            }
          });
        } catch (err: any) {
          _updates.orgName = {
            status: 0,
            error: err.error.reason
          }
          setUpdates({ ..._updates });
        }
      }
      if (officialUrl != src20TokenProp.officialUrl) {
        try {
          const response = await SRC20Contract.setOfficialUrl(officialUrl);
          _updates.officialUrl = {
            status: 1,
            txHash: response.hash
          }
          setUpdates({ ..._updates });
          const { hash, data } = response;
          addTransaction({ to: SRC20Contract.address }, response, {
            call: {
              from: activeAccount,
              to: SRC20Contract.address,
              input: data,
              value: "0"
            }
          });
        } catch (err: any) {
          _updates.officialUrl = {
            status: 0,
            error: err.error.reason
          }
          setUpdates({ ..._updates });
        }
      }
      if (description != src20TokenProp.description) {
        try {
          const response = await SRC20Contract.setDescription(description);
          _updates.description = {
            status: 1,
            txHash: response.hash
          }
          setUpdates({ ..._updates });
          const { hash, data } = response;
          addTransaction({ to: SRC20Contract.address }, response, {
            call: {
              from: activeAccount,
              to: SRC20Contract.address,
              input: data,
              value: "0"
            }
          });
        } catch (err: any) {
          _updates.description = {
            status: 0,
            error: err.error.reason
          }
          setUpdates({ ..._updates });
        }
      }
      setUpdating(false);
      setUpdateFinish(true);
    }
  }

  const updateAble = useMemo(() => {
    if (!src20TokenProp) {
      return false;
    }
    if (src20TokenProp.description != inputParams.description
      || src20TokenProp.officialUrl != inputParams.officialUrl
      || src20TokenProp.orgName != inputParams.orgName
      || src20TokenProp.whitePaperUrl != inputParams.whitePaperUrl
    ) {
      return true;
    }
    return false;
  }, [src20TokenProp, inputParams])

  return <>
    <Modal width={800} open={openEditAssetModal} footer={null} title="编辑资产" destroyOnClose onCancel={() => cancel()}>
      <Divider />
      <Spin spinning={loading}>
        <Row>
          <Col span={12}>
            <Text type="secondary">资产名称</Text>
            <br />
            <Text strong>{src20TokenProp?.name}</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">资产符号</Text>
            <br />
            <Text strong>{src20TokenProp?.symbol}</Text>
          </Col>
          <Col span={24} style={{ marginTop: "20px" }}>
            <Text type="secondary">白皮书链接</Text>
            <Input value={inputParams.whitePaperUrl} onChange={(event) => {
              const input = event.target.value;
              setInputParams({
                ...inputParams,
                whitePaperUrl: input
              })
            }} />
          </Col>
          <Col span={24} style={{ marginTop: "20px" }}>
            <Text type="secondary">组织机构</Text>
            <Input value={inputParams.orgName} onChange={(event) => {
              const input = event.target.value;
              setInputParams({
                ...inputParams,
                orgName: input
              })
            }} />
          </Col>
          <Col span={24} style={{ marginTop: "20px" }}>
            <Text type="secondary">官方网站</Text>
            <Input value={inputParams.officialUrl} onChange={(event) => {
              const input = event.target.value;
              setInputParams({
                ...inputParams,
                officialUrl: input
              })
            }} />
          </Col>
          <Col span={24} style={{ marginTop: "20px" }}>
            <Text type="secondary">资产简介</Text>
            <Input.TextArea value={inputParams.description} style={{ maxHeight: "60px", height: "60px" }} onChange={(event) => {
              const input = event.target.value;
              setInputParams({
                ...inputParams,
                description: input
              })
            }} />
          </Col>
        </Row>
        <Divider />
        {
          updates && <Alert style={{ marginBottom: "20px" }} type="success" message={<>
            <Row>
              {
                updates.whitePaperUrl && <>
                  <Col span={24}>
                    <Text type="secondary">更新白皮书</Text><br />
                    {
                      updates.whitePaperUrl.status == 1 && <>
                        <Text strong type="success">{updates.whitePaperUrl.txHash}</Text>
                      </>
                    }
                    {
                      updates.whitePaperUrl.status == 0 && <>
                        <Text strong type="danger">错误:{updates.whitePaperUrl.error}</Text>
                      </>
                    }
                  </Col>
                </>
              }
              {
                updates.orgName && <>
                  <Col span={24}>
                    <Text type="secondary">更新组织机构</Text><br />
                    {
                      updates.orgName.status == 1 && <>
                        <Text strong type="success">{updates.orgName.txHash}</Text>
                      </>
                    }
                    {
                      updates.orgName.status == 0 && <>
                        <Text strong type="danger">错误:{updates.orgName.error}</Text>
                      </>
                    }
                  </Col>
                </>
              }
              {
                updates.officialUrl && <>
                  <Col span={24}>
                    <Text type="secondary">更新官方网站</Text><br />
                    {
                      updates.officialUrl.status == 1 && <>
                        <Text strong type="success">{updates.officialUrl.txHash}</Text>
                      </>
                    }
                    {
                      updates.officialUrl.status == 0 && <>
                        <Text strong type="danger">错误:{updates.officialUrl.error}</Text>
                      </>
                    }
                  </Col>
                </>
              }
              {
                updates.description && <>
                  <Col span={24}>
                    <Text type="secondary">更新资产描述</Text><br />
                    {
                      updates.description.status == 1 && <>
                        <Text strong type="success">{updates.description.txHash}</Text>
                      </>
                    }
                    {
                      updates.description.status == 0 && <>
                        <Text strong type="danger">错误:{updates.description.error}</Text>
                      </>
                    }
                  </Col>
                </>
              }
            </Row>
          </>} />
        }
        <Row>
          <Col span={24}>
            <Button disabled={!updateAble || updateFinish} loading={updating} onClick={update} style={{ float: "right" }} type="primary">
              {updateFinish ? "已完成" : "更新"}
            </Button>
          </Col>
        </Row>
      </Spin>
    </Modal>
  </>

}
