import { Alert, Button, Col, Divider, Row, Typography } from "antd"
import { useState } from "react";
import { useSelector } from "react-redux";
import { AppState } from "../../../state";
import path from "path";

const { Text, Paragraph } = Typography;

export interface AddressPrivateKeyMap {
  [address: string]: {
    privateKey: string
  }
}

export default ({
  setAddressPrivateKeyMap
}: {
  setAddressPrivateKeyMap: (map: AddressPrivateKeyMap) => void
}) => {

  const data = useSelector<AppState, { [key: string]: any }>(state => state.application.data);
  const safe3KeystoresFile_windows = data["data"] + "\\safe3.keystores";
  const safe3KeystoresFile = path.join(data["data"], "safe3.keystores");
  const dumpCommand = `dumpwallet "${safe3KeystoresFile_windows}"`;
  const [loading, setLoading] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string>();

  const loadSafe3PrivateKeyFile = function () {
    setLoading(true);
    window.electron.fileReader.readFile(safe3KeystoresFile)
      .then((fileContent) => {
        try {
          const lines = fileContent.replaceAll("\r", "").split("\n").filter((line: string) => line && line.trim().indexOf("#") != 0)
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
          setAddressPrivateKeyMap(_addressPrivateKeyMap)
        } catch (err) {
          setFileError("非预期的 Safe3 私钥导出结果,无法解析该私钥文件.");
          setLoading(false);
        }
      })
      .catch(err => {
        setFileError("未找到导出的私钥文件,请确认按步骤执行导出 Safe3 桌面钱包私钥文件.");
        setLoading(false);
      })
  }

  return <>
    <Row style={{ marginTop: "40px" }}>
      <Col span={24}>
        <Text strong>第一步</Text>
        <br />
        <Text>打开 Safe3 桌面钱包,<Text strong>等待 Safe3 桌面钱包同步到最新高度</Text></Text>
      </Col>
      <Col span={24} style={{ marginTop: "20px" }}>
        <Text strong>第二步</Text>
        <br />
        <Text>如果 Safe3 桌面钱包设置了钱包密码,需要先解锁钱包</Text>
      </Col>
      <Col span={24} style={{ marginTop: "20px" }}>
        <Text strong>第三步</Text>
        <br />
        <Text>在 Safe3 钱包界面选择"工具",打开"Debug 控制台",输入如下命令,将钱包中的私钥信息导出</Text>
        <br />
        <Text style={{ float: "left", fontSize: "16px" }} code>{dumpCommand}</Text>
        <Paragraph style={{ float: "left", fontSize: "16px", marginLeft: "5px" }} copyable={{ text: dumpCommand }} />
      </Col>
      <Col span={24} style={{ marginTop: "20px" }}>
        <Text strong>第四步</Text>
        <br />
        <Text>导出完成后,点击本页面的加载私钥按钮</Text>
      </Col>
    </Row>
    <Divider />
    {
      fileError && <Alert style={{ marginBottom: "10px" }} showIcon type="error" message={fileError} />
    }
    <Button disabled={loading} loading={loading} type="primary" onClick={loadSafe3PrivateKeyFile}>
      加载私钥
    </Button>

  </>

}
