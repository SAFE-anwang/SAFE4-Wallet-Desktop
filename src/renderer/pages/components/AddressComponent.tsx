import { Divider, Modal, QRCode, Row, Tooltip, Typography } from "antd";
import useWalletName, { isLocalWallet } from "../../hooks/useWalletName";
import { WalletTwoTone, QrcodeOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
const { Text, Paragraph, Link } = Typography;
export default ({
  address,
  ellipsis,
  copyable,
  qrcode,
  style
}: {
  address: string,
  ellipsis?: boolean,
  copyable?: boolean,
  qrcode?: boolean,
  style?: React.CSSProperties
}) => {
  const { t } = useTranslation();
  const { isLocal, isActive, name } = isLocalWallet(address);
  const addressLabel = ellipsis ? address.substring(0, 10) + "..." + address.substring(address.length - 8) : address;
  const [openAddressQRCode, setOpenAddressQRCode] = useState(false);
  const walletColor = useMemo(() => {
    if (isActive) {
      return "#0f5ce5e0";
    }
    if (isLocal) {
      return "#90afe5e0";
    }
    return "";
  }, [isLocal, isActive]);

  return <div>
    <Text style={{
      ...style,
      fontFamily: "SFMono-Regular,Menlo,Monaco,Consolas,\"Liberation Mono\",\"Courier New\",monospace",
      color: walletColor
    }} italic={isActive} >
      {addressLabel}
      {
        copyable && <Paragraph style={{ float: "right", height: "8px" }} copyable={{ text: address }} />
      }
      {
        qrcode && <Link onClick={(event) => {
          // 阻止事件冒泡
          event.stopPropagation();
          // 阻止默认行为（如果有）
          event.preventDefault();
          setOpenAddressQRCode(true);
        }}>
          <Tooltip title={t("wallet_address_qrcode_view")}>
            <QrcodeOutlined style={{ float: "right", marginTop: "4px", marginRight: "6px" }} />
          </Tooltip>
        </Link>
      }
      {
        isLocal && !isActive &&
        <Tooltip title={`${t("wallet_address_local")}:${name}`}>
          <WalletTwoTone twoToneColor={walletColor} style={{ float: "right", marginTop: "4px", marginRight: "6px" }} />
        </Tooltip>
      }
      {
        isActive &&
        <Tooltip title={`${t("wallet_address_current")}:${name}`}>
          <WalletTwoTone twoToneColor={walletColor} style={{ float: "right", marginTop: "4px", marginRight: "6px" }} />
        </Tooltip>
      }

    </Text>

    <Modal title={t("wallet_address_qrcode")} open={openAddressQRCode} width={"600px"} footer={null} closable onCancel={() => { setOpenAddressQRCode(false) }}>
      <Divider />

      <Row>
        <Text style={{ margin: "auto", marginTop: "20px", marginBottom: "20px" }} type='secondary'>
          {t("wallet_receive_tip0")}
        </Text>
      </Row>

      <Row style={{ textAlign: "center" }}>
        <QRCode size={200} style={{ margin: "auto", boxShadow: "5px 5px 10px 2px rgba(0, 0, 0, 0.2)" }} value={address} />
      </Row>

      <Row style={{ width: "400px", textAlign: "center", margin: "auto", marginTop: "20px", marginBottom: "60px" }}>
        <Text style={{ margin: "auto" }} strong>
          {address}
        </Text>
        <Paragraph style={{ float: "right", marginTop: "10px" }} copyable={{ text: address }} />
      </Row>

    </Modal>

  </div>

}
