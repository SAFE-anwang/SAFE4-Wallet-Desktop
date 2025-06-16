import { Alert, Button, Col, Divider, Input, Modal, Row, Spin, Typography } from "antd"
import { useEffect, useMemo, useState } from "react";
import { useContract, useMulticallContract } from "../../../hooks/useContracts";
import { ISRC20_Interface } from "../../../abis";
import CallMulticallAggregate, { CallMulticallAggregateContractCall } from "../../../state/multicall/CallMulticallAggregate";
import { TxExecuteStatus } from "../safe3/Safe3";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import useSRC20Prop from "../../../hooks/useSRC20Prop";
import { useTranslation } from "react-i18next";

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

  const SRC20Contract = useContract(address, ISRC20_Interface, true);
  const [updating, setUpdating] = useState<boolean>();
  const [updateFinish, setUpdateFinish] = useState<boolean>(false);
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();
  const { src20TokenProp, loading } = useSRC20Prop(address);
  const { t } = useTranslation();

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
    if (src20TokenProp) {
      setInputParams({
        ...src20TokenProp
      })
    }
  }, [src20TokenProp])

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
    <Modal width={800} open={openEditAssetModal} footer={null} title={t("wallet_issue_edit_asset")} destroyOnClose onCancel={() => cancel()}>
      <Divider />
      <Spin spinning={loading}>
        <Row>
          <Col span={12}>
            <Text type="secondary">{t("wallet_src20_name")}</Text>
            <br />
            <Text strong>{src20TokenProp?.name}</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">{t("wallet_src20_symbol")}</Text>
            <br />
            <Text strong>{src20TokenProp?.symbol}</Text>
          </Col>
          <Col span={24} style={{ marginTop: "20px" }}>
            <Text type="secondary">{t("wallet_src20_whitepaperurl")}</Text>
            <Input value={inputParams.whitePaperUrl} onChange={(event) => {
              const input = event.target.value;
              setInputParams({
                ...inputParams,
                whitePaperUrl: input
              })
            }} />
          </Col>
          <Col span={24} style={{ marginTop: "20px" }}>
            <Text type="secondary">{t("wallet_src20_org")}</Text>
            <Input value={inputParams.orgName} onChange={(event) => {
              const input = event.target.value;
              setInputParams({
                ...inputParams,
                orgName: input
              })
            }} />
          </Col>
          <Col span={24} style={{ marginTop: "20px" }}>
            <Text type="secondary">{t("wallet_src20_officialwebsite")}</Text>
            <Input value={inputParams.officialUrl} onChange={(event) => {
              const input = event.target.value;
              setInputParams({
                ...inputParams,
                officialUrl: input
              })
            }} />
          </Col>
          <Col span={24} style={{ marginTop: "20px" }}>
            <Text type="secondary">{t("wallet_src20_description")}</Text>
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
                    <Text type="secondary">{t("update") + " " + t("wallet_src20_whitepaperurl")}</Text><br />
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
                    <Text type="secondary">{t("update") + " " + t("wallet_src20_org")}</Text><br />
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
                    <Text type="secondary">{t("update") + " " + t("wallet_src20_officialwebsite")}</Text><br />
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
                    <Text type="secondary">{t("update") + " " + t("wallet_src20_description")}</Text><br />
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
