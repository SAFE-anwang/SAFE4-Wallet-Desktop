import { Button, Card, Col, Input, Row, Typography } from "antd"

const { Text } = Typography;

export default () => {

    return <>
        <Button>{`<<`}</Button>
        <br /><br /><br /><br />
        <Card title="Create/Import Wallet">
            <Row>
                <Col span={6}>
                    <Row>
                        <Col span={4}>
                            <Text strong>1.</Text>
                        </Col>
                        <Col span={20}>
                            <Input></Input>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Card>
    </>

}