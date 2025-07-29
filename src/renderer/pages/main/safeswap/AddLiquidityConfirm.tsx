

import { Alert, Button, Col, Divider, Modal, Row, Typography } from "antd"
import TokenLogo from "../../components/TokenLogo";
import { PlusOutlined, SendOutlined, SyncOutlined } from "@ant-design/icons";
import { Token, TokenAmount } from "@uniswap/sdk";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import { useSafeswapV2Router } from "../../../hooks/useContracts";
import { useSafeswapSlippageTolerance, useTimestamp } from "../../../state/application/hooks";
import { Contract, ethers } from "ethers";
import { useTokenAllowanceAmounts, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import useTransactionResponseRender from "../../components/useTransactionResponseRender";
import { useCallback, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { applicationUpdateWalletTab } from "../../../state/application/action";
import { getSlippageTolerancePercent } from "./Swap";
import { SafeswapV2RouterAddress } from "../../../config";
import { IERC20_Interface } from "../../../abis";
import TokenSymbol from "../../components/TokenSymbol";
import { useWeb3React } from "@web3-react/core";

const { Text, Link } = Typography;

export function getSlippageToleranceBigInteger(slippageTolerance: string) {
  const a = ethers.utils.parseUnits(slippageTolerance, 4);
  const b = ethers.utils.parseUnits("1", 4);
  return b.sub(a);
}

export default ({
  openAddConfirmModal, setOpenAddConfirmModal,
  tokenA, tokenB,
  tokenAAmount, tokenBAmount
}: {
  openAddConfirmModal: boolean,
  setOpenAddConfirmModal: (openAddConfirmModal: boolean) => void,
  tokenA: undefined | Token,
  tokenB: undefined | Token,
  tokenAAmount: string,
  tokenBAmount: string
}) => {

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { chainId, provider } = useWeb3React();
  const SwapV2RouterContract = useSafeswapV2Router(true);
  const timestamp = useTimestamp();
  const activeAccount = useWalletsActiveAccount();
  const tokenAContract = tokenA ? new Contract(tokenA.address, IERC20_Interface, provider) : undefined;
  const tokenBContract = tokenB ? new Contract(tokenB.address, IERC20_Interface, provider) : undefined;
  const addTransaction = useTransactionAdder();
  const {
    render,
    setTransactionResponse,
    setErr,
    response,
    err
  } = useTransactionResponseRender();
  const [sending, setSending] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>();
  const cancel = useCallback(() => {
    setOpenAddConfirmModal(false);
    if (txHash) {
      setTxHash(undefined);
      dispatch(applicationUpdateWalletTab("history"));
      navigate("/main/wallet");
    }
  }, [txHash]);
  const slippageTolerance = useSafeswapSlippageTolerance();

  const [waitApprove, setWaitApprove] = useState<boolean>(false);
  const tokens = useMemo(() => {
    const tokens = [];
    tokenA && tokens.push(tokenA);
    tokenB && tokens.push(tokenB);
    return tokens;
  }, [tokenA, tokenB])
  const tokenAllowanceAmounts = useTokenAllowanceAmounts(activeAccount, SafeswapV2RouterAddress, tokens);
  const allowanceForRouterOfTokenA = useMemo(() => {
    return tokenA ? tokenAllowanceAmounts[tokenA.address] : undefined;
  }, [tokenA, tokenAllowanceAmounts]);
  const allowanceForRouterOfTokenB = useMemo(() => {
    return tokenB ? tokenAllowanceAmounts[tokenB.address] : undefined;
  }, [tokenB, tokenAllowanceAmounts]);
  const needApproveTokenA = useMemo(() => {
    if (tokenA && tokenAAmount && allowanceForRouterOfTokenA) {
      const inAmount = new TokenAmount(tokenA, ethers.utils.parseUnits(tokenAAmount, tokenA.decimals).toBigInt());
      return inAmount.greaterThan(allowanceForRouterOfTokenA)
    }
    return false;
  }, [allowanceForRouterOfTokenA, tokenAAmount]);
  const needApproveTokenB = useMemo(() => {
    if (tokenB && tokenBAmount && allowanceForRouterOfTokenB) {
      const inAmount = new TokenAmount(tokenB, ethers.utils.parseUnits(tokenBAmount, tokenB.decimals).toBigInt());
      return inAmount.greaterThan(allowanceForRouterOfTokenB)
    }
    return false;
  }, [allowanceForRouterOfTokenB, tokenBAmount]);
  const [approveTokenHash, setApproveTokenHash] = useState<{
    [address: string]: {
      execute: boolean,
      hash?: string
    }
  }>({});
  const approveRouter = useCallback(async () => {
    if (tokenA && activeAccount && tokenAContract && chainId && provider) {
      setApproveTokenHash({
        ...approveTokenHash,
        [tokenA.address]: {
          execute: true
        }
      });
      setWaitApprove(true);
      const data = tokenAContract.interface.encodeFunctionData("approve", [
        SafeswapV2RouterAddress, ethers.utils.parseUnits(tokenAAmount, tokenA.decimals)
      ]);
      const tx: ethers.providers.TransactionRequest = {
        to: tokenAContract.address,
        data,
        chainId
      };
      const { signedTx, error } = await window.electron.wallet.signTransaction(
        activeAccount,
        provider.connection.url,
        tx
      );
      if (signedTx) {
        try {
          const response = await provider.sendTransaction(signedTx);
          const { hash, data } = response;
          setApproveTokenHash({
            ...approveTokenHash,
            [tokenA.address]: {
              hash,
              execute: true
            }
          })
        } catch (err) {
          setErr(err)
        } finally {
          setWaitApprove(false);
        }
      }
      if (error) {
        setWaitApprove(false);
        console.log("Approve TokenA Error =", err)
      }
    }
  }, [activeAccount, tokenA, tokenAContract]);
  const approveRouterForTokenB = useCallback(async () => {
    if (tokenB && activeAccount && tokenBContract && chainId && provider) {
      setApproveTokenHash({
        ...approveTokenHash,
        [tokenB.address]: {
          execute: true
        }
      })
      setWaitApprove(true);
      const data = tokenBContract.interface.encodeFunctionData("approve", [
        SafeswapV2RouterAddress, ethers.utils.parseUnits(tokenBAmount, tokenB.decimals)
      ]);
      const tx: ethers.providers.TransactionRequest = {
        to: tokenBContract.address,
        data,
        chainId
      };
      const { signedTx, error } = await window.electron.wallet.signTransaction(
        activeAccount,
        provider.connection.url,
        tx
      );
      if (signedTx) {
        try {
          const response = await provider.sendTransaction(signedTx);
          const { hash, data } = response;
          setApproveTokenHash({
            ...approveTokenHash,
            [tokenB.address]: {
              hash,
              execute: true
            }
          })
        } catch (err) {
          setErr(err)
        } finally {
          setWaitApprove(false);
        }
      }
      if (error) {
        setWaitApprove(false);
        console.log("Approve TokenA Error =", err)
      }
    }
  }, [activeAccount, tokenB, tokenBContract]);

  const doAddLiquidity = async () => {
    if (SwapV2RouterContract && chainId && provider) {
      setSending(true);
      const deadline = timestamp + 60 * 10;
      const to = activeAccount;
      if (tokenA == undefined && tokenB) {
        const amountTokenDesired = ethers.utils.parseUnits(tokenBAmount, tokenB.decimals);
        const amountTokenMin = amountTokenDesired.mul(
          getSlippageToleranceBigInteger(slippageTolerance)
        ).div(10000);
        const value = ethers.utils.parseEther(tokenAAmount);
        const valueMin = value.mul(
          getSlippageToleranceBigInteger(slippageTolerance)
        ).div(10000);

        const data = SwapV2RouterContract.interface.encodeFunctionData("addLiquidityETH", [
          tokenB.address,
          amountTokenDesired,
          amountTokenMin,
          valueMin,
          to,
          deadline
        ]);
        const tx: ethers.providers.TransactionRequest = {
          to: SwapV2RouterContract.address,
          data,
          chainId,
          value
        };
        const { signedTx, error } = await window.electron.wallet.signTransaction(
          activeAccount,
          provider.connection.url,
          tx
        );
        if (signedTx) {
          try {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data } = response;
            setTransactionResponse(response);
            addTransaction({ to: SwapV2RouterContract.address }, response, {
              call: {
                from: activeAccount,
                to: SwapV2RouterContract.address,
                input: data,
                value: "0"
              }
            });
            setTxHash(hash);
          } catch (err) {
            setErr(err)
          } finally {
            setSending(false);
          }
        }
        if (error) {
          setSending(false);
          setErr(error)
        }
      } else if (tokenA && tokenB == undefined) {
        const amountTokenDesired = ethers.utils.parseUnits(tokenAAmount, tokenA.decimals);
        const amountTokenMin = amountTokenDesired.mul(
          getSlippageToleranceBigInteger(slippageTolerance)
        ).div(10000);
        const value = ethers.utils.parseEther(tokenBAmount);
        const valueMin = value.mul(
          getSlippageToleranceBigInteger(slippageTolerance)
        ).div(10000);

        const data = SwapV2RouterContract.interface.encodeFunctionData("addLiquidityETH", [
          tokenA.address,
          amountTokenDesired,
          amountTokenMin,
          valueMin,
          to,
          deadline
        ]);
        const tx: ethers.providers.TransactionRequest = {
          to: SwapV2RouterContract.address,
          data,
          chainId,
          value
        };
        const { signedTx, error } = await window.electron.wallet.signTransaction(
          activeAccount,
          provider.connection.url,
          tx
        );
        if (signedTx) {
          try {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data } = response;
            setTransactionResponse(response);
            addTransaction({ to: SwapV2RouterContract.address }, response, {
              call: {
                from: activeAccount,
                to: SwapV2RouterContract.address,
                input: data,
                value: "0"
              }
            });
            setTxHash(hash);
          } catch (err) {
            setErr(err)
          } finally {
            setSending(false);
          }
        }
        if (error) {
          setSending(false);
          setErr(error)
        }
      } else if (tokenA && tokenB) {
        const amountADesired = ethers.utils.parseUnits(tokenAAmount, tokenA.decimals);
        const amountBDesired = ethers.utils.parseUnits(tokenBAmount, tokenB.decimals);
        const amountAMin = amountADesired.mul(
          getSlippageToleranceBigInteger(slippageTolerance)
        ).div(10000);
        const amountBMin = amountBDesired.mul(
          getSlippageToleranceBigInteger(slippageTolerance)
        ).div(10000);

        const data = SwapV2RouterContract.interface.encodeFunctionData("addLiquidity", [
          tokenA.address,
          tokenB.address,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          to,
          deadline
        ]);
        const tx: ethers.providers.TransactionRequest = {
          to: SwapV2RouterContract.address,
          data,
          chainId
        };
        const { signedTx, error } = await window.electron.wallet.signTransaction(
          activeAccount,
          provider.connection.url,
          tx
        );
        if (signedTx) {
          try {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data } = response;
            setTransactionResponse(response);
            addTransaction({ to: SwapV2RouterContract.address }, response, {
              call: {
                from: activeAccount,
                to: SwapV2RouterContract.address,
                input: data,
                value: "0"
              }
            });
            setTxHash(hash);
          } catch (err) {
            setErr(err)
          } finally {
            setSending(false);
          }
        }
        if (error) {
          setSending(false);
          setErr(error)
        }
      }
    }
  }

  return <>
    <Modal title={t("wallet_safeswap_addliquiditiy")} footer={null} open={openAddConfirmModal} destroyOnClose onCancel={cancel} >
      <Divider />
      {
        render
      }
      <Row>
        <Col span={3}>
          {
            tokenA ? <>
              <ERC20TokenLogoComponent style={{ width: "40px", height: "40px" }} address={tokenA.address} chainId={tokenA.chainId} />
            </> : <>
              <TokenLogo width="40px" height="40px" />
            </>
          }
        </Col>
        <Col span={21}>
          <Text style={{ fontSize: "24px", lineHeight: "40px" }}>
            - {tokenAAmount} {tokenA ? TokenSymbol(tokenA) : "SAFE"} {tokenA ? <Text code>SRC20</Text> : <></>}
          </Text>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <PlusOutlined style={{ fontSize: "24px", marginLeft: "7px", marginTop: "12px" }} />
        </Col>
      </Row>
      <Row style={{ marginTop: "10px" }}>
        <Col span={3}>
          {
            tokenB ? <>
              <ERC20TokenLogoComponent style={{ width: "40px", height: "40px" }} address={tokenB.address} chainId={tokenB.chainId} />
            </> : <>
              <TokenLogo width="40px" height="40px" />
            </>
          }
        </Col>
        <Col span={21}>
          <Text style={{ fontSize: "24px", lineHeight: "40px" }}>
            - {tokenBAmount} {tokenB ? TokenSymbol(tokenB) : "SAFE"} {tokenB ? <Text code>SRC20</Text> : <></>}
          </Text>
        </Col>
      </Row>
      <Row style={{ marginTop: "20px" }}>
        <Col span={24}>
          <Text italic>
            {t("wallet_safeswap_liquidity_tip0")} <Text strong>{getSlippageTolerancePercent(slippageTolerance).toSignificant()}% </Text>,{t("wallet_safeswap_liquidity_tip1")}
          </Text>
        </Col>
      </Row>
      <Row style={{ marginTop: "20px" }}>
        {
          tokenA && needApproveTokenA && <Col span={24}>
            <Alert style={{ marginTop: "10px", marginBottom: "10px" }} type="warning" message={<>
              <Text>{t("wallet_safeswap_needapprovetoken", { spender: "Safeswap", tokenSymbol: tokenA ? TokenSymbol(tokenA) : "" })}</Text>
              <Link disabled={approveTokenHash[tokenA?.address]?.execute || waitApprove} onClick={approveRouter} style={{ float: "right" }}>
                {
                  approveTokenHash[tokenA?.address]?.execute && <SyncOutlined spin />
                }
                {
                  approveTokenHash[tokenA?.address] ? t("wallet_safeswap_approving") : t("wallet_safeswap_clicktoapprove")
                }
              </Link>
            </>} />
          </Col>
        }
        {
          needApproveTokenB && tokenB && <Col span={24}>
            <Alert style={{ marginTop: "10px", marginBottom: "10px" }} type="warning" message={<>
              <Text>需要先授权 Safeswap 访问 {tokenB ? TokenSymbol(tokenB) : ""}</Text>
              <Link disabled={approveTokenHash[tokenB?.address]?.execute || waitApprove} onClick={approveRouterForTokenB} style={{ float: "right" }}>
                {
                  approveTokenHash[tokenB?.address]?.execute && <SyncOutlined spin />
                }
                {
                  approveTokenHash[tokenB?.address] ? t("wallet_safeswap_approving") : t("wallet_safeswap_clicktoapprove")
                }
              </Link>
            </>} />
          </Col>
        }
      </Row>
      <Divider />

      <Row>
        <Col span={24}>
          {
            !sending && !render && <Button icon={<SendOutlined />} onClick={() => {
              doAddLiquidity();
            }} type="primary" disabled={!tokenAllowanceAmounts || (needApproveTokenB || needApproveTokenA)} style={{ float: "right" }}>
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
  </>

}
