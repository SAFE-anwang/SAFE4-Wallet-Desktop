import { Button, Col, Divider, Row, Typography } from "antd"
import path from "path";
import { useState } from "react";
import { useSelector } from "react-redux";
import { AppState } from "../../../state";

const { Text, Title } = Typography

export interface AddressPrivateKeyMap {
  [ address : string ] : {
    privateKey : string
  }
}

export default ( {
  setAddressPrivateKeyMap
} : {
  setAddressPrivateKeyMap : ( map : AddressPrivateKeyMap ) => void
} ) => {
  const data = useSelector<AppState, { [key: string]: any }>(state => state.application.data);
  const safe3KeystoresFile = data["data"] + "\\safe3.keystores";
  const [loading, setLoading] = useState<boolean>(false);

  const loadSafe3PrivateKeyFile = function () {
    setLoading(true);
    window.electron.fileReader.readFile(safe3KeystoresFile)
      .then((fileContent) => {
        const lines = fileContent.split("\r\n").filter((line: string) => line && line.trim().indexOf("#") != 0)
        const addressPrivateKeyArr = lines.map((line: string) => {
          const arr = line.split(" ");
          const privateKey = arr[0];
          const address = arr[4].split("=")[1];
          return {
            address, privateKey
          }
        });
        const _addressPrivateKeyMap: {
          [address: string]: {
            privateKey: string
          }
        } = {};
        addressPrivateKeyArr.forEach((addressPrivateKey: { address: string, privateKey: string }) => {
          const { address, privateKey } = addressPrivateKey;
          _addressPrivateKeyMap[address] = { privateKey }
        })
        setLoading(false);
        setAddressPrivateKeyMap( _addressPrivateKeyMap )
      })
  }

  return <>
    <Row style={{ marginTop: "20px" }}>
      <Col span={24}>
        <Text strong>第一步</Text>
        <br />
        <Text>打开 Safe3 桌面钱包,并等待钱包同步到最新高度</Text>
      </Col>
      <br />
      <Col span={24}>
        <Text strong>第二步</Text>
        <br />
        <Text>解锁钱包</Text>
      </Col>
      <Col span={24}>
        <Text strong>第三步</Text>
        <br />
        <Text>输入命令,将私钥信息导出到</Text>
      </Col>
      <Col span={24}>
        <Text strong>第四步</Text>
        <br />
        <Text>点击 加载私钥 按钮,由钱包加载私钥</Text>
      </Col>
    </Row>
    {
      safe3KeystoresFile
    }
    <Divider />
    <Button disabled={loading} loading={loading} type="primary" onClick={loadSafe3PrivateKeyFile}>
      加载私钥
    </Button>
  </>

}
