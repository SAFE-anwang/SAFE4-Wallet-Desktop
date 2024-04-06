import { Button, Col, Row, Typography } from "antd";
import { PlusCircleTwoTone, VerticalAlignBottomOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { applicationActionUpdateAtCreateWallet, applicationUpdateAfterSetPasswordTODO } from "../../state/application/action";
import { useWalletsList } from "../../state/wallets/hooks";
import { hasApplicationPasswordSetted } from "../../state/application/hooks";
import { AfterSetPasswordTODO } from "../../state/application/reducer";

const { Text } = Typography;

export default () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const walletsList = useWalletsList();
  const applicationPasswordSetted = hasApplicationPasswordSetted();

  const createWalletClick = () => {
    if ( applicationPasswordSetted ){
      navigate("/wallet/createMnemonic")
    }else{
      dispatch(applicationUpdateAfterSetPasswordTODO( AfterSetPasswordTODO.CREATE ))
      navigate("/setPassword");
    }
  }
  const importWalletClick = () => {
    if ( applicationPasswordSetted ){
      navigate("/wallet/importWallet")
    }else{
      dispatch(applicationUpdateAfterSetPasswordTODO( AfterSetPasswordTODO.IMPORT ))
      navigate("/setPassword");
    }
  }

  const closeClick = () => {
    navigate("/main/wallet");
  }

  useEffect(() => {
    dispatch(applicationActionUpdateAtCreateWallet(true))
  }, []);

  return <>
    <Row>
      <Col span={24} style={{ marginTop: "10%" }}>
        {
          walletsList.length > 0 &&
          <Button onClick={closeClick} style={{ float: "left" }} size="large" shape="circle" icon={<CloseOutlined />} />
        }
      </Col>
    </Row>
    <Row style={{ marginTop: "5%" }}>
      <Col span={12}>
        <div onClick={createWalletClick}
          style={{
            width: "400px", backgroundColor: "#f9f9f9", cursor: "pointer", margin: "auto", padding: "25px", borderRadius: "12px", border: "1px solid #dddddd",
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
        <div onClick={importWalletClick} style={{
          width: "400px", backgroundColor: "#f9f9f9", cursor: "pointer", margin: "auto", padding: "25px", borderRadius: "12px", border: "1px solid #dddddd",
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
    <br />< br />
  </>

}
