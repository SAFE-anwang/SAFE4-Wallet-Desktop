import { Typography, Card, Divider, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  DatabaseOutlined, LockOutlined, RightOutlined, WalletOutlined, WifiOutlined
} from '@ant-design/icons';
import "./index.css"
import { useTranslation } from 'react-i18next';
import LanguageSelector from './language/LanguageSelector';
import Version from './version';
import { walletsForceLock, walletsUpdateLocked } from '../../../state/wallets/action';

const { Title } = Typography;

export default () => {

  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  return (<>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          {t("menu")}
        </Title>
      </Col>
    </Row>
    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "60%" }}>
        <Card className="menu-item-container" style={{ marginBottom: "20px" }}>

          <Divider style={{ margin: "0px 0px" }} />
          <Version />
          <Divider style={{ margin: "0px 0px" }} />

          <Row className='menu-item' onClick={() => {
            navigate("/main/menu/network")
          }}>
            <Col span={2} style={{ textAlign: "center" }}>
              <WifiOutlined />
            </Col>
            <Col span={20}>
              {t("network")}
            </Col>
            <Col span={2} style={{ textAlign: "center" }}>
              <RightOutlined />
            </Col>
          </Row>

          <Divider style={{ margin: "0px 0px" }} />
          <Row className='menu-item' onClick={() => {
            navigate("/main/menu/storage")
          }}>
            <Col span={2} style={{ textAlign: "center" }}>
              <DatabaseOutlined />
            </Col>
            <Col span={20}>
              {t("storage")}
            </Col>
            <Col span={2} style={{ textAlign: "center" }}>
              <RightOutlined />
            </Col>
          </Row>

          <Divider style={{ margin: "0px 0px" }} />
          <Row className='menu-item' onClick={() => {
            navigate("/main/menu/modifyPassword")
          }}>
            <Col span={2} style={{ textAlign: "center" }}>
              <WalletOutlined />
            </Col>
            <Col span={20}>
              {t("changeWalletPassword")}
            </Col>
            <Col span={2} style={{ textAlign: "center" }}>
              <RightOutlined />
            </Col>
          </Row>

          <Divider style={{ margin: "0px 0px" }} />
          <Row className='menu-item' onClick={() => {
            dispatch(walletsForceLock());
          }}>
            <Col span={2} style={{ textAlign: "center" }}>
              <LockOutlined />
            </Col>
            <Col span={20}>
              立即锁定
            </Col>
          </Row>
        </Card>

        <Card className="menu-item-container" style={{ marginBottom: "20px" }}>
          <LanguageSelector />
        </Card>

      </div>
    </div>
  </>)
}
