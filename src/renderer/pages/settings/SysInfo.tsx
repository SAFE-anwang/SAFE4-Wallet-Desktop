import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal } from 'antd';
import { useMemo, useState } from "react"
import { useSysInfo } from "../../state/application/hooks";

const {Text} = Typography;

export default () => {

    const sysInfo = useSysInfo();

    const renderSysINfo = ( key : string , value : string ) => {
        return <Row key={key}>
            <Text> 
                <Text strong>{key} :</Text>
                {value}
            </Text>
        </Row>
    }

    return <>

        <Card title="sys-info">
            {
                renderSysINfo( "node_serve_path" , sysInfo.node_serve_path )
            }
        </Card>

    </>

}