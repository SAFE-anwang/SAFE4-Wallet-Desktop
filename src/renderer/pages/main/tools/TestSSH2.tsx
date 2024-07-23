import { useCallback, useEffect, useRef, useState } from "react"
import { SSH2_Methods, SSH2SignalHandler, SSH2Singal } from "../../../../main/handlers/SSH2SignalHandler";
import { IPC_CHANNEL } from "../../../config";
import { Button, Col, Row, Typography } from "antd";

import "@xterm/xterm/css/xterm.css";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from '@xterm/addon-fit';
import SSH2ShellTermial from "../../components/SSH2ShellTermial";
import SSH2CMDTerminal from "../../components/SSH2CMDTerminal";

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

  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);

  // useEffect(() => {
  //   let removeSSH2Stderr : any ;
  //   if (terminalRef.current) {
  //     const term = new Terminal({
  //       cursorBlink: true,
  //       fontFamily: 'monospace',
  //       fontSize: 14,
  //       theme: {
  //         background: '#000000', // 黑色背景
  //         foreground: '#FFFFFF', // 白色文本
  //         cursor: '#FFFFFF', // 白色光标
  //       },
  //     });
  //     // Optionally, fit the terminal to the container
  //     const fitAddon = new FitAddon();
  //     terminalInstance.current = term;
  //     terminalInstance.current.loadAddon(fitAddon);
  //     terminalInstance.current.open(terminalRef.current);
  //     // fitAddon.fit();

  //     removeSSH2Stderr = window.electron.ssh2.on((...args: any[]) => {
  //       const stderr = args[0][0];
  //       console.log("[ssh2-stderr] :" , stderr)
  //       // term.write(`\x1b[34m${stderr}\x1b[0m`);
  //       term.write(`${stderr}`);
  //     })

  //   }
  //   return () => {
  //     // Cleanup and dispose the terminal instance
  //     if (terminalInstance.current) {
  //       terminalInstance.current.dispose();
  //     }
  //     if ( removeSSH2Stderr ){
  //       removeSSH2Stderr();
  //     }
  //   };
  // }, []);

  useEffect(() => {
    if (terminalInstance.current) {
      let commandBuffer = '';
      terminalInstance.current.onData((data) => {
        if (data == '\r') {
          // 敲回车
          // Handle Enter key: process the command
          // processCommand(commandBuffer);
          // setCommandBuffer(''); // Clear the buffer
          processCommand(commandBuffer);
          terminalInstance.current?.writeln("\r");
          commandBuffer = '';
        } else if (data == '\u007f') {
          // 敲删除
          if (commandBuffer.length > 0) {
            // setCommandBuffer(commandBuffer.slice(0, -1));
            commandBuffer = commandBuffer.slice(0, -1);
            terminalInstance.current?.write('\b \b');
          }
        } else {
          // 正常敲
          // Update the command buffer
          commandBuffer += data;
          terminalInstance.current?.write(`${data}`);
        }
      });
      // wget -O /path/to/save/file.txt http://example.com/file.txt
    }
  }, [terminalInstance]);

  const processCommand = (command: string) => {
    console.log("execute command :", command);
    const term = terminalInstance.current;
    if (term) {
      window.electron.ssh2.shell(command)
        .then((data: any) => {
          term.write(`\x1b[34m${data.replace(/\n/g, '\r\n')}\x1b[0m\n`);
        })
        .catch((err: any) => {

        });
    }
  }

  useEffect(() => {
    if (terminalInstance && terminalInstance.current) {
      const { host, username, password } = {
        host: "47.107.47.210",
        username: "root",
        password: "Zy123456!"
      }
      const term = terminalInstance.current;
      term.writeln(`Connect to ${host}`);
      window.electron.ssh2.connect('47.107.47.210', 22, 'root', 'Zy123456!')
        .then((connection: any) => {
          // term.writeln(`Successed...${connection}`);
        })
        .catch((err: any) => {
          console.log("error:", err)
        });
    }

  }, [terminalInstance]);

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

      <Row style={{ marginTop: "50px" }}>
      <Col span={24}>
        <SSH2CMDTerminal connectConfig={
          { host: "47.107.47.210", port: 22, username: "root", password: "Zy123456!" }
        } />
      </Col>
    </Row>

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

  </>
}

