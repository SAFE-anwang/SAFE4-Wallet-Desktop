import { Alert, Button, Col, Divider, Input, Modal, Row, Spin, Typography } from "antd"
import { useEffect, useMemo, useState } from "react";
import { useContract, useMulticallContract } from "../../../../hooks/useContracts";
import { INFT_721_Interface as INFT_Interface  } from "../../../../abis";
import { TxExecuteStatus } from "../../safe3/Safe3";
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";
import { BigNumber, ethers } from "ethers";
import EstimateTx from "../../../../utils/EstimateTx";
import useNFTMetadata from "../../../../hooks/useNFTMetadata";

const { Text } = Typography;

export interface NFTTemplateProp {
  name: string,
  symbol: string,
  whitePaperUrl: string,
  officialUrl: string,
  orgName: string,
  description: string,
  baseURI: string,
  mintPrice: string,
  maxSupply: string
}

export default ({
  openEditAssetModal, setOpenEditAssetModal,
  address
}: {
  openEditAssetModal: boolean,
  setOpenEditAssetModal: (openEditAssetModal: boolean) => void,
  address: string
}) => {

  const INFTTemplateContract = useContract(address, INFT_Interface, true);
  const [updating, setUpdating] = useState<boolean>();
  const [updateFinish, setUpdateFinish] = useState<boolean>(false);
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();
  const { tokenMetadata, loading } = useNFTMetadata(address);
  const { t } = useTranslation();
  const { chainId, provider } = useWeb3React();

  const [inputParams, setInputParams] = useState<NFTTemplateProp>({
    name: "",
    symbol: "",
    whitePaperUrl: "",
    officialUrl: "",
    orgName: "",
    description: "",
    baseURI: "",
    mintPrice: "",
    maxSupply: ""
  });
  const [inputErrors, setInputErrors] = useState<{
    description: string | undefined,
    maxSupply: string | undefined,
    mintPrice: string | undefined,
  }>({
    description: undefined,
    maxSupply: undefined,
    mintPrice: undefined,
  });

  const [updates, setUpdates] = useState<{
    whitePaperUrl?: TxExecuteStatus,
    officialUrl?: TxExecuteStatus,
    orgName?: TxExecuteStatus,
    description?: TxExecuteStatus,
    baseURI?: TxExecuteStatus,
    mintPrice?: TxExecuteStatus,
    maxSupply?: TxExecuteStatus
  }>();

  const cancel = () => {
    setOpenEditAssetModal(false);
  }

  useEffect(() => {
    if (tokenMetadata) {
      // 将读出的 WEI 价格转换为可读的 ETHER 价格;
      const mintPrice = ethers.utils.formatEther(tokenMetadata.mintPrice).toString();
      const maxSupply = tokenMetadata.maxSupply.toString();
      setInputParams({
        ...tokenMetadata,
        mintPrice,
        maxSupply
      })
    }
  }, [tokenMetadata])

  const update = async () => {
    if (tokenMetadata && INFTTemplateContract && activeAccount && provider && chainId) {
      const { whitePaperUrl, orgName, officialUrl, description,
        baseURI, mintPrice, maxSupply
      } = inputParams;

      const _inputErrors: {
        description: string | undefined,
        mintPrice: string | undefined,
        maxSupply: string | undefined
      } = {
        description: undefined,
        mintPrice: undefined,
        maxSupply: undefined
      };
      if (description.length > 2000) {
        _inputErrors.description = "输入内容不能超过2000字符的长度限制.";
      }
      if (mintPrice) {
        try {
          if (ethers.utils.parseEther(mintPrice).lte(BigNumber.from("0"))) {
            _inputErrors.mintPrice = "输入正确的铸造价格";
          }

        } catch (error) {
          _inputErrors.mintPrice = "输入正确的铸造价格";
        }
      }
      if (maxSupply) {
        try {
          if (ethers.utils.parseEther(maxSupply).lte(BigNumber.from("0"))) {
            _inputErrors.maxSupply = "输入正确的最大供应量";
          }
        } catch (error) {
          _inputErrors.maxSupply = "输入正确的最大供应量";
        }
      }
      if (_inputErrors.description || _inputErrors.maxSupply || _inputErrors.mintPrice) {
        setInputErrors(_inputErrors);
        return;
      }
      setUpdating(true);
      let _updates = updates ?? {};
      if (baseURI != tokenMetadata.baseURI) {
        const data = INFTTemplateContract.interface.encodeFunctionData("setBaseURI", [baseURI]);
        let tx: ethers.providers.TransactionRequest = {
          to: INFTTemplateContract.address,
          data,
          chainId
        };
        try {
          tx = await EstimateTx(activeAccount, chainId, tx, provider);
          const { signedTx, error } = await window.electron.wallet.signTransaction(
            activeAccount,
            tx
          );
          if (error) {
            _updates.baseURI = {
              status: 0,
              error
            }
            setUpdates({ ..._updates });
          }
          if (signedTx) {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data, from } = response;
            _updates.baseURI = {
              status: 1,
              txHash: response.hash
            }
            setUpdates({ ..._updates });
            addTransaction({ to: INFTTemplateContract.address }, response, {
              call: {
                from: activeAccount,
                to: INFTTemplateContract.address,
                input: data,
                value: "0"
              }
            });
          }
        } catch (err) {
          _updates.baseURI = {
            status: 0,
            error: err
          }
          setUpdates({ ..._updates });
        }
      }
      if (!tokenMetadata.mintPrice.eq(ethers.utils.parseEther(inputParams.mintPrice))) {
        const _mintPrice = ethers.utils.parseEther(mintPrice);
        const data = INFTTemplateContract.interface.encodeFunctionData("setMintPrice", [_mintPrice]);
        let tx: ethers.providers.TransactionRequest = {
          to: INFTTemplateContract.address,
          data,
          chainId
        };
        try {
          tx = await EstimateTx(activeAccount, chainId, tx, provider);
          const { signedTx, error } = await window.electron.wallet.signTransaction(
            activeAccount,
            tx
          );
          if (error) {
            _updates.mintPrice = {
              status: 0,
              error
            }
            setUpdates({ ..._updates });
          }
          if (signedTx) {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data, from } = response;
            _updates.mintPrice = {
              status: 1,
              txHash: response.hash
            }
            setUpdates({ ..._updates });
            addTransaction({ to: INFTTemplateContract.address }, response, {
              call: {
                from: activeAccount,
                to: INFTTemplateContract.address,
                input: data,
                value: "0"
              }
            });
          }
        } catch (err) {
          _updates.mintPrice = {
            status: 0,
            error: err
          }
          setUpdates({ ..._updates });
        }
      }
      if (maxSupply != tokenMetadata.maxSupply.toString()) {
        const data = INFTTemplateContract.interface.encodeFunctionData("setMaxSupply", [maxSupply]);
        let tx: ethers.providers.TransactionRequest = {
          to: INFTTemplateContract.address,
          data,
          chainId
        };
        try {
          tx = await EstimateTx(activeAccount, chainId, tx, provider);
          const { signedTx, error } = await window.electron.wallet.signTransaction(
            activeAccount,
            tx
          );
          if (error) {
            _updates.maxSupply = {
              status: 0,
              error
            }
            setUpdates({ ..._updates });
          }
          if (signedTx) {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data, from } = response;
            _updates.maxSupply = {
              status: 1,
              txHash: response.hash
            }
            setUpdates({ ..._updates });
            addTransaction({ to: INFTTemplateContract.address }, response, {
              call: {
                from: activeAccount,
                to: INFTTemplateContract.address,
                input: data,
                value: "0"
              }
            });
          }
        } catch (err) {
          _updates.maxSupply = {
            status: 0,
            error: err
          }
          setUpdates({ ..._updates });
        }
      }
      if (whitePaperUrl != tokenMetadata.whitePaperUrl) {
        const data = INFTTemplateContract.interface.encodeFunctionData("setWhitePaperUrl", [whitePaperUrl]);
        let tx: ethers.providers.TransactionRequest = {
          to: INFTTemplateContract.address,
          data,
          chainId
        };
        tx = await EstimateTx(activeAccount, chainId, tx, provider);
        const { signedTx, error } = await window.electron.wallet.signTransaction(
          activeAccount,
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
            addTransaction({ to: INFTTemplateContract.address }, response, {
              call: {
                from: activeAccount,
                to: INFTTemplateContract.address,
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
      if (orgName != tokenMetadata.orgName) {
        const data = INFTTemplateContract.interface.encodeFunctionData("setOrgName", [orgName]);
        let tx: ethers.providers.TransactionRequest = {
          to: INFTTemplateContract.address,
          data,
          chainId
        };
        tx = await EstimateTx(activeAccount, chainId, tx, provider);
        const { signedTx, error } = await window.electron.wallet.signTransaction(
          activeAccount,
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
            addTransaction({ to: INFTTemplateContract.address }, response, {
              call: {
                from: activeAccount,
                to: INFTTemplateContract.address,
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
      if (officialUrl != tokenMetadata.officialUrl) {
        const data = INFTTemplateContract.interface.encodeFunctionData("setOfficialUrl", [officialUrl]);
        let tx: ethers.providers.TransactionRequest = {
          to: INFTTemplateContract.address,
          data,
          chainId
        };
        tx = await EstimateTx(activeAccount, chainId, tx, provider);
        const { signedTx, error } = await window.electron.wallet.signTransaction(
          activeAccount,
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
            addTransaction({ to: INFTTemplateContract.address }, response, {
              call: {
                from: activeAccount,
                to: INFTTemplateContract.address,
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
      if (description != tokenMetadata.description) {

        const data = INFTTemplateContract.interface.encodeFunctionData("setDescription", [description]);
        let tx: ethers.providers.TransactionRequest = {
          to: INFTTemplateContract.address,
          data,
          chainId
        };
        tx = await EstimateTx(activeAccount, chainId, tx, provider);
        const { signedTx, error } = await window.electron.wallet.signTransaction(
          activeAccount,
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
            addTransaction({ to: INFTTemplateContract.address }, response, {
              call: {
                from: activeAccount,
                to: INFTTemplateContract.address,
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
    if (!tokenMetadata) {
      return false;
    }
    try {
      if (tokenMetadata.description != inputParams.description
        || tokenMetadata.officialUrl != inputParams.officialUrl
        || tokenMetadata.orgName != inputParams.orgName
        || tokenMetadata.whitePaperUrl != inputParams.whitePaperUrl
        || tokenMetadata.baseURI != inputParams.baseURI
        || (inputParams.mintPrice && !tokenMetadata.mintPrice.eq(ethers.utils.parseEther(inputParams.mintPrice)))
        || tokenMetadata.maxSupply.toString() != inputParams.maxSupply
      ) {
        return true;
      }
    } catch (err) {
      return false;
    }
  }, [tokenMetadata, inputParams])

  return <>
    <Modal width={800} open={openEditAssetModal} footer={null} title={t("wallet_issue_edit_asset")} destroyOnClose onCancel={() => cancel()}>
      <Divider />
      <Spin spinning={loading}>
        <Row>
          <Col span={12}>
            <Text type="secondary">{t("wallet_src20_name")}</Text>
            <br />
            <Text strong>{tokenMetadata?.name}</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">{t("wallet_src20_symbol")}</Text>
            <br />
            <Text strong>{tokenMetadata?.symbol}</Text>
          </Col>
          <Col span={12} style={{ marginTop: "20px" }}>
            <Text type="secondary">当前供应量</Text>
            <br />
            <Text strong>
              {tokenMetadata?.totalSupply.toString()}
            </Text>
          </Col>
          <Col span={12} style={{ marginTop: "20px" }}>
            <Text type="secondary">最大供应量</Text>
            <br />
            <Text strong>
              {tokenMetadata?.maxSupply.toString()}
            </Text>

          </Col>
          <Divider />

          <Col span={24}>
            <Text type="secondary">BaseURI</Text>
            <Input value={inputParams.baseURI} onChange={(event) => {
              const input = event.target.value;
              setInputParams({
                ...inputParams,
                baseURI: input
              })
            }} />
          </Col>
          <Col span={24} style={{ marginTop: "20px" }}>
            <Text type="secondary">铸造价格(SAFE)</Text>
            <Input value={inputParams.mintPrice} onChange={(event) => {
              const input = event.target.value;
              setInputParams({
                ...inputParams,
                mintPrice: input
              });
              setInputErrors({
                ...inputErrors,
                mintPrice: undefined
              })
            }} />
            {
              inputErrors.mintPrice && <Alert style={{ marginTop: "5px" }} showIcon type="error" message={<>
                {inputErrors.mintPrice}
              </>} />
            }
          </Col>
          <Col span={24} style={{ marginTop: "20px" }}>
            <Text type="secondary">最大供应量</Text>
            <Input value={inputParams.maxSupply} onChange={(event) => {
              const input = event.target.value;
              setInputParams({
                ...inputParams,
                maxSupply: input
              });
              setInputErrors({
                ...inputErrors,
                maxSupply: undefined
              });
            }} />
            {
              inputErrors.maxSupply && <Alert style={{ marginTop: "5px" }} showIcon type="error" message={<>
                {inputErrors.maxSupply}
              </>} />
            }
          </Col>
          <Divider />
          <Col span={24}>
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
                updates.baseURI && <>
                  <Col span={24}>
                    <Text type="secondary">{t("update") + "BaseURI"}</Text><br />
                    {
                      updates.baseURI.status == 1 && <>
                        <Text strong type="success">{updates.baseURI.txHash}</Text>
                      </>
                    }
                    {
                      updates.baseURI.status == 0 && <>
                        <Text strong type="danger">错误:{updates.baseURI.error.reason}</Text>
                      </>
                    }
                  </Col>
                </>
              }
              {
                updates.mintPrice && <>
                  <Col span={24}>
                    <Text type="secondary">{t("update") + "铸造价格"}</Text><br />
                    {
                      updates.mintPrice.status == 1 && <>
                        <Text strong type="success">{updates.mintPrice.txHash}</Text>
                      </>
                    }
                    {
                      updates.mintPrice.status == 0 && <>
                        <Text strong type="danger">错误:{updates.mintPrice.error.reason}</Text>
                      </>
                    }
                  </Col>
                </>
              }
              {
                updates.maxSupply && <>
                  <Col span={24}>
                    <Text type="secondary">{t("update") + "最大供应量"}</Text><br />
                    {
                      updates.maxSupply.status == 1 && <>
                        <Text strong type="success">{updates.maxSupply.txHash}</Text>
                      </>
                    }
                    {
                      updates.maxSupply.status == 0 && <>
                        <Text strong type="danger">错误:{updates.maxSupply.error.reason}</Text>
                      </>
                    }
                  </Col>
                </>
              }
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
    </Modal >
  </>

}
