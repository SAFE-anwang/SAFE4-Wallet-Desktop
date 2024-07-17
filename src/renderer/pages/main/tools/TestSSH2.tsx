import { useEffect, useState } from "react"
import { SSH2_Methods, SSH2SignalHandler, SSH2Singal } from "../../../../main/handlers/SSH2SignalHandler";
import { IPC_CHANNEL } from "../../../config";
import { Col, Row, Typography } from "antd";

const { Text } = Typography

export default () => {

  const [data, setData] = useState();

  useEffect(() => {
    const method = SSH2_Methods.initConnection;
    window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [SSH2Singal, method, [{
      host: "47.107.47.210",
      port: 22,
      username: "root",
      password: "Zy123456!"
    }]]);
    window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
      if (arg instanceof Array && arg[0] == SSH2Singal && arg[1] == method) {
        const data = arg[2][0];
        console.log("return data :" , data)
        setData(data);
      }
    })
  }, [])

  return <>
    <Row>
      <Col span={24}>
        111
        <Text>{JSON.stringify(data)}</Text>
      </Col>
    </Row>
  </>
}

