import { Alert, Button, Col, Divider, Input, Modal, Row, Spin, Typography } from "antd"
import { Contract, ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react"
import { useWeb3React } from "@web3-react/core";
import { IERC20_Interface } from "../../../../../abis";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { updateERC20Token } from "../../../../../state/transactions/actions";
import { IPC_CHANNEL } from "../../../../../config";
import { ERC20Tokens_Methods, ERC20TokensSignal } from "../../../../../../main/handlers/ERC20TokenSignalHandler";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export default ({
  openTokenAddModal,
  setOpenTokenAddModal
}: {
  openTokenAddModal: boolean,
  setOpenTokenAddModal: (openTokenAddModal: boolean) => void
}) => {

  const { t } = useTranslation();
  const { provider, chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const [address, setAddress] = useState<string>();
  const [addressErr, setAddressErr] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const dispatch = useDispatch();

  const [result, setResult] = useState<{
    token: { name: string | undefined, symbol: string | undefined, decimals: number | undefined } | undefined,
    error: {
      name: string | undefined,
      symbol: string | undefined,
      decimals: string | undefined,
      balance: string | undefined
    } | undefined,
    balance: string | undefined
  }>();

  useEffect(() => {
    if (provider && chainId && address && ethers.utils.isAddress(address)) {
      loadingIERC20TokenInfo();
    }
  }, [address, provider, chainId]);

  const loadingIERC20TokenInfo = useCallback(async () => {
    if (provider && chainId && address && ethers.utils.isAddress(address)) {
      const IERC20 = new Contract(address, IERC20_Interface, provider);
      setLoading(true);
      const token: {
        name: string | undefined,
        symbol: string | undefined,
        decimals: number | undefined
      } = {
        name: undefined, symbol: undefined, decimals: undefined
      };
      const error: {
        name: string | undefined,
        symbol: string | undefined,
        decimals: string | undefined,
        balance: string | undefined
      } = {
        name: undefined, symbol: undefined, decimals: undefined, balance: undefined
      };
      let balance: string | undefined = undefined;
      try {
        const name = await IERC20.name();
        console.log("IERC20.name:", name);
        token.name = name;
      } catch (err: any) {
        console.log("[error]IERC20.name:", err.message);
        error.name = '调用失败';
      }
      try {
        const symbol = await IERC20.symbol();
        console.log("IERC20.symbol:", symbol);
        token.symbol = symbol;
      } catch (err: any) {
        console.log("[error]IERC20.symbol:", err.message);
        error.symbol = '调用失败';
      }
      try {
        const decimals = await IERC20.decimals();
        console.log("IERC20.decimals:", decimals);
        token.decimals = decimals;
      } catch (err: any) {
        console.log("[error]IERC20.decimals:", err.message);
        error.decimals = "调用失败";
      }
      if (token.decimals) {
        try {
          const _balance = await IERC20.balanceOf(activeAccount);
          balance = ethers.utils.formatUnits(_balance.toBigInt(), token.decimals);
          console.log("IERC20.balanceOf:", balance);
        } catch (err: any) {
          console.log("[error]IERC20.balanceOf:", err.message);
          error.balance = '调用失败';
        }
      }
      setResult({
        token,
        error,
        balance
      });
      setLoading(false);
    }
  }, [address, provider, chainId]);

  const addAble = useMemo(() => {
    return result && result.token && result.balance;
  }, [result]);

  const saveToken = useCallback(() => {
    if (addAble && result && result.token && chainId && address) {
      const { name, symbol, decimals } = result.token;
      if (name && symbol && decimals) {
        dispatch(updateERC20Token({
          chainId, address,
          name, symbol,
          decimals
        }));
        window.electron.ipcRenderer.sendMessage(
          IPC_CHANNEL, [ERC20TokensSignal, ERC20Tokens_Methods.save, [{
            chainId, address, name, symbol, decimals
          }]]
        );
        cancel();
      }
    }
  }, [result, addAble, dispatch, chainId, address]);

  const cancel = () => {
    setResult(undefined);
    setAddress(undefined);
    setAddressErr(undefined);
    setOpenTokenAddModal(false);
  }

  return <>
    <Modal title={t("wallet_tokens_add")} open={openTokenAddModal} footer={null} destroyOnClose onCancel={cancel}>
      <Spin spinning={loading}>
        <Divider />
        <Row>
          <Col span={24}>
            <Text type="secondary">{t("wallet_tokens_contract")}</Text>
          </Col>
          <Col span={24} style={{ marginTop: "5px" }}>
            <Input onChange={(event) => {
              const input = event.target.value.trim();
              if (input) {
                if (ethers.utils.isAddress(input)) {
                  setAddressErr(undefined);
                } else {
                  setAddressErr(t("enter_correct") + t("wallet_tokens_contract"));
                }
              } else {
                setAddressErr(undefined);
              }
              setAddress(input);
              setResult(undefined);
            }} />
            {
              addressErr && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={addressErr} />
            }
          </Col>
        </Row>
        {
          result && <>
            <Row style={{ marginTop: "20px" }}>
              <Col span={4}>
                <Text type="secondary">{t("wallet_tokens_name")}</Text>
              </Col>
              <Col span={20}>
                {result.token?.name && <CheckCircleTwoTone style={{ marginRight: "5px" }} twoToneColor="#2de72f" />}
                {result.error?.name && <CloseCircleTwoTone style={{ marginRight: "5px" }} twoToneColor="#f11313" />}
                <Text strong>{result.token?.name}</Text>
                <Text type="danger">{result.error?.name}</Text>
              </Col>
              <br />
              <Col span={4}>
                <Text type="secondary">{t("wallet_tokens_symbol")}</Text>
              </Col>
              <Col span={20}>
                {result.token?.symbol && <CheckCircleTwoTone style={{ marginRight: "5px" }} twoToneColor="#2de72f" />}
                {result.error?.symbol && <CloseCircleTwoTone style={{ marginRight: "5px" }} twoToneColor="#f11313" />}
                <Text strong>{result.token?.symbol}</Text>
                <Text type="danger">{result.error?.symbol}</Text>
              </Col>
              <br />
              <Col span={4}>
                <Text type="secondary">{t("wallet_tokens_decimals")}</Text>
              </Col>
              <Col span={20}>
                {result.token?.decimals && <CheckCircleTwoTone style={{ marginRight: "5px" }} twoToneColor="#2de72f" />}
                {result.error?.decimals && <CloseCircleTwoTone style={{ marginRight: "5px" }} twoToneColor="#f11313" />}
                <Text strong>{result.token?.decimals}</Text>
                <Text type="danger">{result.error?.decimals}</Text>
              </Col>
              {
                result.balance && <>
                  <br />
                  <Col span={4}>
                    <Text type="secondary">{t("wallet_tokens_balance")}</Text>
                  </Col>
                  <Col span={20}>
                    {result.balance && <CheckCircleTwoTone style={{ marginRight: "5px" }} twoToneColor="#2de72f" />}
                    {result.error?.balance && <CloseCircleTwoTone style={{ marginRight: "5px" }} twoToneColor="#f11313" />}
                    <Text strong>{result.balance}</Text>
                    <Text type="danger">{result.error?.balance}</Text>
                  </Col>
                </>
              }
            </Row>
            {
              result.error && (result.error.name || result.error.symbol || result.error.decimals || result.error.balance) &&
              <Alert style={{ marginTop: "20px" }} type="error" showIcon message={t("wallet_tokens_add_error")}></Alert>
            }
          </>
        }
        <Divider />
        <Row>
          <Col span={24} style={{ textAlign: "right" }}>
            <Button onClick={saveToken} type="primary" disabled={!addAble}>{t("confirm")}</Button>
          </Col>
        </Row>
      </Spin>
    </Modal>

  </>
}
