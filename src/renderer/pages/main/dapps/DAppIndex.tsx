import { FileAddOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Divider, Row, Tabs, TabsProps } from "antd"
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useMemo } from "react";
import DAppList from "./DAppList";


export default () => {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const activeAccount = useWalletsActiveAccount();

  const items: TabsProps['items'] = useMemo(() => {
    return [
      {
        key: 'dAppList',
        label: "dApp 列表",
        children: <DAppList />,
      },
      {
        key: 'myDAppList',
        label: "我的 dApp",
        children: <DAppList queryMyDAppList />,
      }
    ]
  }, [activeAccount])

  return <>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{ marginBottom: "20px" }}>
          <Alert showIcon type="info" message={<>
            DApp(去中心化应用)是运行在区块链上的应用。它不依赖某个公司的服务器，而是通过智能合约直接与你的钱包交互。你看到的应用页面只是入口，真正的逻辑和数据都在链上，公开、透明、可验证。<br />
            与普通网站不同,DApp 没有账号密码，你的钱包就是你的身份。每一次操作都需要你用私钥签名授权，链上才会执行。
          </>} />
          <Divider />
          <Row >
            <Col span={24}>
              <Button icon={<FileAddOutlined />} type='primary' onClick={() => {
                navigate("/main/dapps/register")
              }}>
                注册 dApp
              </Button>
            </Col>
          </Row>
        </Card>

        <Card>
          <Tabs items={items}></Tabs>
        </Card>

      </div>
    </div>

  </>


}
