import { LoadingOutlined, SendOutlined, SyncOutlined } from "@ant-design/icons";
import { TokenAmount } from "@uniswap/sdk";
import { useWeb3React } from "@web3-react/core";
import { Alert, Avatar, Button, Col, Divider, Modal, Row, Typography } from "antd"
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getNetworkLogo, NetworkType } from "../../../../assets/logo/NetworkLogo";
import { Application_Crosschain_Pool, Safe4_Network_Config, Safe4NetworkChainId } from "../../../../config";
import { useCrosschainContract, useIERC20Contract } from "../../../../hooks/useContracts";
import { useTokenAllowance, useWalletsActiveAccount, useWalletsActiveSigner } from "../../../../state/wallets/hooks";
import ERC20TokenLogoComponent from "../../../components/ERC20TokenLogoComponent";
import TokenLogo from "../../../components/TokenLogo";
import { ethers } from "ethers";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import useTransactionResponseRender from "../../../components/useTransactionResponseRender";
import { EmptyContract } from "../../../../constants/SystemContracts";
import { useDispatch } from "react-redux";
import { applicationUpdateWalletTab } from "../../../../state/application/action";
import { useNavigate } from "react-router-dom";

const { Text, Link } = Typography;


export default ({
  token, amount, targetNetwork, targetAddress,
  openCrosschainConfirmModal,setOpenCrosschainConfirmModal
}: {
  token: string,
  amount: string,
  targetNetwork: NetworkType,
  targetAddress: string,
  openCrosschainConfirmModal: boolean,
  setOpenCrosschainConfirmModal: (openCrosschainConfirmModal: boolean) => void,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const signer = useWalletsActiveSigner();
  const addTransaction = useTransactionAdder();
  const {
    render,
    setTransactionResponse,
    setErr,
    response,
    err
  } = useTransactionResponseRender();
  const [sending, setSending] = useState<boolean>(false);

  const tokenUSDT = useMemo(() => {
    if (chainId && chainId == Safe4_Network_Config.Testnet.chainId) {
      return Safe4_Network_Config.Testnet.USDT;
    } else {
      return Safe4_Network_Config.Mainnet.USDT;
    }
  }, [chainId]);

  const USDT_Contract = useIERC20Contract(tokenUSDT.address, true);
  const CrossChain_Contract = useCrosschainContract();

  const CrossChain_Address = "0xd79ba37f30C0a22D9eb042F6B9537400A4668ff1";
  const callAllowance = useTokenAllowance(tokenUSDT, activeAccount, CrossChain_Address);

  const [txHash, setTxHash] = useState<string>();
  const cancel = useCallback( () => {
    setOpenCrosschainConfirmModal(false);
    if (txHash) {
      setTxHash(undefined);
      dispatch(applicationUpdateWalletTab("history"));
      navigate("/main/wallet");
    }
  } , [txHash] )

  const allowance = useMemo(() => {
    if (token == 'USDT') {
      if (callAllowance) {
        const _amount = new TokenAmount(tokenUSDT, amount);
        return {
          value: callAllowance,
          needApprove: _amount.greaterThan(callAllowance),
        }
      }
      return {
        value: undefined,
        needApprove: true,
      }
    }
    return {
      value: undefined,
      needApprove: false,
    }
  }, [token, amount, callAllowance]);

  const [approve, setApprove] = useState<{
    hash?: string,
    executing?: boolean
  }>({
    hash: undefined,
    executing: false
  });

  const doApproveMAX = useCallback(() => {
    if (USDT_Contract) {
      setApprove({
        hash: undefined,
        executing: true
      })
      USDT_Contract.approve(CrossChain_Address, ethers.constants.MaxUint256)
        .then((response: any) => {
          const { hash, data } = response;
          setApprove({
            hash,
            executing: true
          })
        })
    }
  }, [USDT_Contract]);

  const doCrosschain = useCallback(() => {
    if (token == 'USDT' && USDT_Contract && CrossChain_Contract) {
      const value = ethers.utils.parseUnits(amount, tokenUSDT.decimals).toString();
      setSending(true);
      CrossChain_Contract.eth2safe(value, targetAddress)
        .then((response: any) => {
          const { hash, data } = response;
          setTransactionResponse(response);
          addTransaction({ to: CrossChain_Contract.address }, response, {
            call: {
              from: activeAccount,
              to: CrossChain_Contract.address,
              input: data,
              value: "0",
              tokenTransfer: {
                from: activeAccount,
                to: EmptyContract.EMPTY,
                value,
                token: {
                  address: tokenUSDT.address,
                  name: "USDT",
                  symbol: "USDT",
                  decimals: tokenUSDT.decimals
                }
              }
            }
          });
        }).catch((err: any) => {
          setSending(false);
          setErr(err)
        })
    } else if (token == 'SAFE') {
      if (chainId && signer) {
        const poolAddress = Application_Crosschain_Pool[chainId as Safe4NetworkChainId];
        const prefix = "bsc:";
        const extraData = ethers.utils.hexlify(ethers.utils.toUtf8Bytes( prefix + targetAddress ));
        const value = ethers.utils.parseEther(amount);
        const tx = {
          to : poolAddress,
          value,
          data : extraData
        }
        setSending(true);
        signer.sendTransaction(tx).then(response => {
          setSending(false);
          const {
            hash
          } = response;
          setTransactionResponse(response);
          addTransaction(tx, response, {
            transfer: {
              from: activeAccount,
              to: tx.to,
              value: tx.value.toString()
            }
          });
          setTxHash(hash);
        }).catch(err => {
          setSending(false);
          setErr(err)
        })
      }
    }
  }, [USDT_Contract, CrossChain_Contract, chainId , signer])

  return <Modal footer={null} destroyOnClose title={t("wallet_crosschain")} open={openCrosschainConfirmModal} onCancel={cancel}>
    <Divider />
    {
      render
    }
    <Row>
      <Col span={24}>
        <SyncOutlined style={{ fontSize: "32px" }} />
        <Text style={{ fontSize: "32px", marginLeft: "5px" }} strong>{amount} {token}</Text>
      </Col>
    </Row>
    <br />
    <Row>
      <Col span={24}>
        <Text type="secondary">{t("wallet_send_from")}</Text>
      </Col>
      <Col span={24} style={{ paddingLeft: "5px" }} >
        <Row>
          <Col span={3} style={{ paddingTop: "5px" }}>
            {
              chainId && token == "USDT" &&
              <ERC20TokenLogoComponent style={{ width: "40px", height: "40px" }} chainId={chainId} address={tokenUSDT.address} />
            }
            {
              chainId && token == "SAFE" &&
              <TokenLogo width="40px" height="40px" />
            }
          </Col>
          <Col span={21}>
            <Text strong>当前账户</Text>
            <br />
            <Text strong>{targetAddress}</Text>
          </Col>
        </Row>
      </Col>
    </Row>
    <br />
    <Row>
      <Col span={24}>
        <Text type="secondary">{"跨链到"}</Text>
      </Col>
      <Col span={24} style={{ paddingLeft: "5px" }} >
        <Row>
          <Col span={3} style={{ paddingTop: "5px" }}>
            <Avatar src={getNetworkLogo(targetNetwork)} style={{ width: "40px", height: "40px" }} />
          </Col>
          <Col span={21}>
            <Text strong>{targetNetwork}</Text>
            <br />
            <Text strong>{targetAddress}</Text>
          </Col>
        </Row>
      </Col>
    </Row>
    {
      token == "USDT" && allowance && allowance.needApprove && <>
        <Divider />
        <Row>
          {callAllowance && callAllowance.toExact()}
          <Col span={24}>
            <Alert type="info" message={<Row>
              <Col span={24}>
                <Text>需要先授权跨链合约访问您的USDT资产</Text>
                <Link disabled={approve.executing} onClick={doApproveMAX} style={{ float: "right" }}>
                  {
                    !approve.executing && "点击授权"
                  }
                  {
                    approve.executing && <>
                      <LoadingOutlined /> 正在授权...
                    </>
                  }
                </Link>
              </Col>
            </Row>} />
          </Col>
        </Row>
      </>
    }
    <Divider />
    <Row>
      <Col span={24}>
        {
          !sending && !render && <Button icon={<SendOutlined />} onClick={() => {
            doCrosschain();
          }} disabled={sending || (allowance && allowance.needApprove)} type="primary" style={{ float: "right" }}>
            {t("wallet_send_status_broadcast")}
          </Button>
        }
        {
          sending && !render && <Button loading disabled type="primary" style={{ float: "right" }}>
            {t("wallet_send_status_sending")}
          </Button>
        }
        {
          render && <Button onClick={cancel} type="primary" style={{ float: "right" }}>
            {t("wallet_send_status_close")}
          </Button>
        }
      </Col>
    </Row>
  </Modal>
}
