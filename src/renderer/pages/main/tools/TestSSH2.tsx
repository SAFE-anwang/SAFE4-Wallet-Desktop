import { useCallback, useEffect, useRef, useState } from "react"
import { SSH2_Methods, SSH2SignalHandler, SSH2Singal } from "../../../../main/handlers/SSH2SignalHandler";
import { IPC_CHANNEL } from "../../../config";
import { Button, Col, Modal, Row, Typography } from "antd";

import "@xterm/xterm/css/xterm.css";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from '@xterm/addon-fit';
import SSH2ShellTermial from "../../components/SSH2ShellTermial";
import SSH2CMDTerminal from "../../components/SSH2CMDTerminal";
import SSH2CMDTerminalScript from "../../components/SSH2CMDTerminalScript";
import SSH2CMDTerminalNode from "../../components/SSH2CMDTerminalNode";
import SSH2CMDTerminalNodeModal from "../../components/SSH2CMDTerminalNodeModal";
import { useWalletsActivePrivateKey } from "../../../state/wallets/hooks";

const { Text } = Typography

function convertSpecialCharsToLiteral(str: string) {
  const specialCharsMap: any = {
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t',
    '\b': '\\b',
    '\f': '\\f',
    '\v': '\\v',
    '\\': '\\\\',
    '\"': '\\"',
    '\'': '\\\''
  };
  return str.split('').map(char => specialCharsMap[char] || char).join('');
}

export default () => {

  const [openModal , setOpenModal] = useState(false);
  const activeAccountPrivateKey = useWalletsActivePrivateKey();

  return <>

    {/* <Row style={{ marginTop: "50px" }}>
      <Col span={16}>
        <div ref={terminalRef} style={{ width: '100%', height: '100%', background: "black", padding: "5px" }} />
      </Col>
    </Row>  */}
    {/*
    <Row style={{ marginTop: "50px" }}>
      <Col span={24}>
        <SSH2ShellTermial connectConfig={
          { host: "47.107.47.210", port: 22, username: "root", password: "Zy123456!" }
        } />
      </Col>
    </Row> */}

    <Button style={{ marginTop: "100px" }} onClick={()=>setOpenModal(true)}>Help</Button>
    {
      openModal && activeAccountPrivateKey && <SSH2CMDTerminalNodeModal openSSH2CMDTerminalNodeModal={openModal} setOpenSSH2CMDTerminalNodeModal={setOpenModal}
        nodeAddressPrivateKey={activeAccountPrivateKey}
        onSuccess={( enode : string , nodeAddress : string ) => {
          console.log({
            enode ,
            nodeAddress
          })
        }}
        onError={() => {

        }}
      />
    }

    <Row style={{ marginTop: "20px" }}>
      {
        "wget -O list.json https://binaries.soliditylang.org/bin/list.json"
      }
    </Row>

    <Row style={{ marginTop: "20px" }}>
      {
        "wget -O safe4.zip https://www.anwang.com/download/testnet/safe4_node/safe4-testnet.linux.v0.1.7.zip"
      }
    </Row>

    <Row style={{ marginTop: "20px" }}>
      {
        "cd safe4-testnet-v0.1.7 && ./start.sh &"
      }
    </Row>

    <Row style={{ marginTop: "20px" }}>
      {
        "cd safe4-testnet-v0.1.7 && ./stop.sh"
      }
    </Row>

    <Row style={{ marginTop: "20px" }}>
      {
        "ps aux| grep geth | grep -v grep"
      }
    </Row>

  </>
}

