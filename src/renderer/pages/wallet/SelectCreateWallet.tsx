import { Col, Row, Typography } from "antd";
import { PlusCircleTwoTone, VerticalAlignBottomOutlined } from '@ant-design/icons';
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Application_Update_AtCreateWallet } from "../../state/application/action";

const { Text } = Typography;

export default () => {

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const createWalletClick = () => {
        navigate("/setPassword")
    }

    useEffect( () => {
        dispatch(Application_Update_AtCreateWallet(true))
    },[]);

    return <>
        <Row style={{ marginTop: "5%" }}>
            <Col span={12}>
                <div onClick={createWalletClick}
                    style={{
                        width: "300px", backgroundColor: "#f9f9f9", cursor: "pointer", margin: "auto", padding: "25px", borderRadius: "12px", border: "1px solid #dddddd",
                    }}>
                    <PlusCircleTwoTone twoToneColor="#52C41A" />
                    <br /><br />
                    <Text style={{
                        fontSize: "28px"
                    }} strong>创建钱包</Text>
                    <br /><br />
                    <Text style={{
                        fontSize: "18px"
                    }} type="secondary">通过创建一套基于BIP39标准的助记词</Text>
                </div>
            </Col>
            <Col span={12}>
                <div style={{
                    width: "300px", backgroundColor: "#f9f9f9", cursor: "pointer", margin: "auto", padding: "25px", borderRadius: "12px", border: "1px solid #dddddd",
                }}>
                    <VerticalAlignBottomOutlined />
                    <br /><br />
                    <Text style={{
                        fontSize: "28px"
                    }} strong>导入钱包</Text>
                    <br /><br />
                    <Text style={{
                        fontSize: "18px"
                    }} type="secondary">通过助记词,私钥来导入这个钱包</Text>
                </div>
            </Col>
        </Row>
    </>

}
