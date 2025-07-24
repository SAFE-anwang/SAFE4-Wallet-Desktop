import { Alert, Button, Col, Divider, Input, Modal, Row, Spin, Typography } from "antd"
import { useEffect, useMemo, useState } from "react";
import { useContract, useMulticallContract } from "../../../hooks/useContracts";
import { ISRC20_Interface } from "../../../abis";
import { TxExecuteStatus } from "../safe3/Safe3";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import useSRC20Prop from "../../../hooks/useSRC20Prop";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";

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
  const { chainId, provider } = useWeb3React();

  const [inputParams, setInputParams] = useState<SRC20TokenProp>({
    name: "",
    symbol: "",
    whitePaperUrl: "",
    officialUrl: "",
    orgName: "",
    description: "",
  });
  const [inputErrors, setInputErrors] = useState<{
    description: string | undefined
  }>({
    description: undefined
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
    if (src20TokenProp && SRC20Contract && activeAccount && provider && chainId) {
      const { whitePaperUrl, orgName, officialUrl, description } = inputParams;

      const _inputErrors: {
        description: string | undefined
      } = {
        description: undefined
      };
      if (description.length > 2000) {
        _inputErrors.description = "输入内容不能超过2000字符的长度限制.";
      }
      if (_inputErrors.description) {
        setInputErrors(_inputErrors);
        return;
      }

      setUpdating(true);
      let _updates = updates ?? {};
      if (whitePaperUrl != src20TokenProp.whitePaperUrl) {
        const data = SRC20Contract.interface.encodeFunctionData("setWhitePaperUrl", [whitePaperUrl]);
        const tx: ethers.providers.TransactionRequest = {
          to: SRC20Contract.address,
          data,
          chainId
        };
        const { signedTx, error } = await window.electron.wallet.signTransaction(
          activeAccount,
          provider.connection.url,
          tx
        );
        if (error) {
          _updates.whitePaperUrl = {
            status: 0,
            error
          }
          setUpdates({ ..._updates });
        }
        if (signedTx) {
          try {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data, from } = response;
            _updates.whitePaperUrl = {
              status: 1,
              txHash: response.hash
            }
            setUpdates({ ..._updates });
            addTransaction({ to: SRC20Contract.address }, response, {
              call: {
                from: activeAccount,
                to: SRC20Contract.address,
                input: data,
                value: "0"
              }
            });
          } catch (err) {
            _updates.whitePaperUrl = {
              status: 0,
              error: err
            }
            setUpdates({ ..._updates });
          }
        }
      }
      if (orgName != src20TokenProp.orgName) {
        const data = SRC20Contract.interface.encodeFunctionData("setOrgName", [orgName]);
        const tx: ethers.providers.TransactionRequest = {
          to: SRC20Contract.address,
          data,
          chainId
        };
        const { signedTx, error } = await window.electron.wallet.signTransaction(
          activeAccount,
          provider.connection.url,
          tx
        );
        if (error) {
          _updates.orgName = {
            status: 0,
            error
          }
          setUpdates({ ..._updates });
        }
        if (signedTx) {
          try {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data, from } = response;
            _updates.orgName = {
              status: 1,
              txHash: response.hash
            }
            setUpdates({ ..._updates });
            addTransaction({ to: SRC20Contract.address }, response, {
              call: {
                from: activeAccount,
                to: SRC20Contract.address,
                input: data,
                value: "0"
              }
            });
          } catch (err) {
            _updates.orgName = {
              status: 0,
              error: err
            }
            setUpdates({ ..._updates });
          }
        }
      }
      if (officialUrl != src20TokenProp.officialUrl) {

        const data = SRC20Contract.interface.encodeFunctionData("setOfficialUrl", [officialUrl]);
        const tx: ethers.providers.TransactionRequest = {
          to: SRC20Contract.address,
          data,
          chainId
        };
        const { signedTx, error } = await window.electron.wallet.signTransaction(
          activeAccount,
          provider.connection.url,
          tx
        );
        if (error) {
          _updates.officialUrl = {
            status: 0,
            error
          }
          setUpdates({ ..._updates });
        }
        if (signedTx) {
          try {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data, from } = response;
            _updates.officialUrl = {
              status: 1,
              txHash: response.hash
            }
            setUpdates({ ..._updates });
            addTransaction({ to: SRC20Contract.address }, response, {
              call: {
                from: activeAccount,
                to: SRC20Contract.address,
                input: data,
                value: "0"
              }
            });
          } catch (err) {
            _updates.officialUrl = {
              status: 0,
              error: err
            }
            setUpdates({ ..._updates });
          }
        }
      }
      if (description != src20TokenProp.description) {

        const data = SRC20Contract.interface.encodeFunctionData("setDescription", [description]);
        const tx: ethers.providers.TransactionRequest = {
          to: SRC20Contract.address,
          data,
          chainId
        };
        const { signedTx, error } = await window.electron.wallet.signTransaction(
          activeAccount,
          provider.connection.url,
          tx
        );
        if (error) {
          _updates.description = {
            status: 0,
            error
          }
          setUpdates({ ..._updates });
        }
        if (signedTx) {
          try {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data, from } = response;
            _updates.description = {
              status: 1,
              txHash: response.hash
            }
            setUpdates({ ..._updates });
            addTransaction({ to: SRC20Contract.address }, response, {
              call: {
                from: activeAccount,
                to: SRC20Contract.address,
                input: data,
                value: "0"
              }
            });
          } catch (err) {
            _updates.description = {
              status: 0,
              error: err
            }
            setUpdates({ ..._updates });
          }
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
              });
              setInputErrors({
                ...inputErrors,
                description: undefined
              })
            }} />
            {
              inputErrors.description && <Alert style={{ marginTop: "5px" }} showIcon type="error" message={<>
                {inputErrors.description}
              </>} />
            }

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
                        <Text strong type="danger">错误:{updates.whitePaperUrl.error.reason}</Text>
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
                        <Text strong type="danger">错误:{updates.orgName.error.reason}</Text>
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
                        <Text strong type="danger">错误:{updates.officialUrl.error.reason}</Text>
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
                        <Text strong type="danger">错误:{updates.description.error.reason}</Text>
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
