import { Alert, Avatar, Button, Col, Divider, Modal, Row, Spin, Typography } from "antd"
import useSRC20Prop from "../../../hooks/useSRC20Prop"
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useMemo, useState } from "react";
import { ArrowRightOutlined, SendOutlined } from "@ant-design/icons";
import { useContract } from "../../../hooks/useContracts";
import { ISRC20_Interface } from "../../../abis";
import { CurrencyAmount } from "@uniswap/sdk";
import { useETHBalances, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import useTransactionResponseRender from "../../components/useTransactionResponseRender";
import { useTranslation } from "react-i18next";
import { ethers } from "ethers";

const { Text } = Typography;

const MAX_LOGO_SIZE = 128 * 1024;

function formatSizeUnits(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

export default ({
  openPromotionModal, setOpenPromotionModal,
  address
}: {
  openPromotionModal: boolean,
  setOpenPromotionModal: (openPromotionModal: boolean) => void,
  address: string
}) => {

  const { t } = useTranslation();
  const { chainId } = useWeb3React();
  const { src20TokenProp, loading } = useSRC20Prop(address);
  const SRC20Contract = useContract(address, ISRC20_Interface, true);
  const [logoPayAmount, setLogoPayAmount] = useState<CurrencyAmount>();
  const activeAccount = useWalletsActiveAccount();
  const activeAccountBalance = useETHBalances([activeAccount])[activeAccount];
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

  // 链上数据 - 该币的链上存储的LOGO
  const [logo, setLogo] = useState<string>();
  // 选择数据
  const [LOGO, setLOGO] = useState<{
    path: string,
    hex: string
  }>();

  const cancel = () => {
    setOpenPromotionModal(false);
  }

  useEffect(() => {
    if (SRC20Contract) {
      SRC20Contract.callStatic.getLogoPayAmount()
        .then(data => {
          setLogoPayAmount(CurrencyAmount.ether(data));
        })
      SRC20Contract.callStatic.logo()
        .then(data => {
          setLogo(data);
        })
    }
  }, [SRC20Contract])

  const selectLOGOPicture = async () => {
    const result = await window.electron.fileReader.selectFile();
    if (result) {
      const [path, hex] = result;
      setLOGO({ path, hex });
    }
  }

  const LOGO_SIZE_GATHERTHAN_MAX = useMemo(() => {
    if (LOGO) {
      return LOGO.hex.length / 2 > MAX_LOGO_SIZE;
    }
    return false;
  }, [LOGO])

  const couldSetLogo = useMemo(() => {
    if (LOGO && !LOGO_SIZE_GATHERTHAN_MAX) {
      return logoPayAmount && activeAccountBalance ? activeAccountBalance.greaterThan(logoPayAmount) : false;
    }
  }, [LOGO, activeAccount, activeAccountBalance, logoPayAmount, LOGO_SIZE_GATHERTHAN_MAX]);

  const doSetLogo = async () => {
    if (SRC20Contract && LOGO && logoPayAmount) {
      setSending(true);
      const logoPayAmountRaw = ethers.BigNumber.from(logoPayAmount.raw.toString());
      try {
        const response = await SRC20Contract.setLogoUrl(LOGO.hex, {
          value: logoPayAmountRaw
        });
        const { hash, data } = response;
        addTransaction({ to: SRC20Contract.address }, response, {
          call: {
            from: activeAccount,
            to: SRC20Contract.address,
            input: data,
            value: logoPayAmountRaw.toString()
          }
        });
        setTransactionResponse(hash);
        setTxHash(hash);
      } catch (err: any) {
        setErr(err);
        console.log("setLogo Error =", err.error)
      }
      setSending(false);
    }
  }

  return <>
    <Modal open={openPromotionModal} footer={null} title={t("wallet_issue_promotion_asset")} destroyOnClose onCancel={cancel}>
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
        </Row>
      </Spin>
      <Divider />
      <Row>

        <Col span={24} style={{ marginTop: "20px" }}>
          <Text type="secondary">{t("wallet_src20_logo")}</Text>

        </Col>
        <Col span={24} style={{ marginTop: "20px" }}>
          {
            chainId && <ERC20TokenLogoComponent address={address} chainId={chainId} hex={logo} />
          }
          {
            LOGO && <>
              <ArrowRightOutlined style={{ marginLeft: "10px", marginRight: "10px" }} />
              <Avatar src={`file://${LOGO.path}`} style={{ width: "48px", height: "48px" }} />
            </>
          }
        </Col>
        <Col span={24} style={{ marginTop: "30px" }}>
          {
            LOGO_SIZE_GATHERTHAN_MAX && <Alert style={{ marginBottom: "10px" }} type="error" showIcon message={<>
              超过图片大小限制,请选择低于{formatSizeUnits(MAX_LOGO_SIZE)} 大小的图片作为 LOGO
            </>} />
          }
          <Button disabled={txHash || err} onClick={selectLOGOPicture}>{t("wallet_src20_logo_selectpic")}</Button>
        </Col>
      </Row>
      <Divider />
      <Row>
        <Col span={24} style={{ marginBottom: "20px" }}>
          <Alert type="info" message={<>
            {
              t( "wallet_src20_logo_payamount_tip" , { logoPayAmount : logoPayAmount?.toSignificant() + " SAFE" } )
            }
          </>} />
        </Col>
        <Col span={24}>
          {
            txHash && <>
              <Alert style={{ marginBottom: "10px" }} showIcon type="success" message={<>
                {txHash}
              </>} />
            </>
          }
          {
            err && <>
              <Alert style={{ marginBottom: "10px" }} showIcon type="error" message={<>
                {err.error.reason ?? err.error.toString()}
              </>} />
            </>
          }
          {
            !sending && !render && <Button icon={<SendOutlined />} onClick={() => {
              doSetLogo();
            }} type="primary" disabled={!couldSetLogo}>
              {t("wallet_send_status_broadcast")}
            </Button>
          }
          {
            sending && !render && <Button loading disabled type="primary">
              {t("wallet_send_status_sending")}
            </Button>
          }
          {
            render && <Button onClick={cancel}>
              {t("wallet_send_status_close")}
            </Button>
          }
        </Col>
      </Row>
    </Modal>
  </>

}
