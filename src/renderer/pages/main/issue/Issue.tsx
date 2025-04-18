import { Alert, Button, Card, Col, Divider, Flex, Input, Radio, Row, Typography } from "antd";
import { CheckboxGroupProps } from "antd/es/checkbox";
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography;

export default () => {

  const { t } = useTranslation();
  const navigate = useNavigate();

  const options: CheckboxGroupProps<string>['options'] = [
    { label: '普通资产', value: '1' },
    { label: '可增发资产', value: '2' },
    { label: '可销毁资产', value: '3' },
    { label: '可暂停转账', value: '4' },
  ];

  return <>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          {t("wallet_issue")}
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{ marginBottom: "20px" }}>
          <Alert showIcon type="info" message={<>
            发行 SRC20 标准的资产
          </>} />
          <Divider />

          <Row>
            <Col span={24}>
              <Text type="secondary">选择模板</Text>
            </Col>
            <Col span={24}>
              <Flex vertical gap="middle">
                <Radio.Group options={options} defaultValue="Apple" />
              </Flex>
            </Col>
            <Col span={24} style={{ marginTop: "10px" }}>
              <Card>
                dsdasdasd
              </Card>
            </Col>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Text type="secondary">资产名称</Text>
              <br />
              <Input style={{ width: "30%" }} />
            </Col>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Text type="secondary">资产简称</Text>
              <br />
              <Input style={{ width: "30%" }} />
            </Col>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Text type="secondary">初始供应量</Text>
              <br />
              <Input style={{ width: "30%" }} />
            </Col>
          </Row>
          <Divider />
          <Row>
            <Col span={24}>
              <Button style={{}} type="primary" >发行资产</Button>
            </Col>
          </Row>
        </Card>
      </div>
    </div>

  </>

}
