import { useCallback, useEffect, useRef, useState } from "react"
import { SSH2_Methods, SSH2SignalHandler, SSH2Singal } from "../../../../main/handlers/SSH2SignalHandler";
import { IPC_CHANNEL } from "../../../config";
import { Button, Col, Row, Typography } from "antd";

import "@xterm/xterm/css/xterm.css";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from '@xterm/addon-fit';


const { Text } = Typography

export default () => {

  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalInstance.current = new Terminal();
      terminalInstance.current.open(terminalRef.current);
      // Optionally, fit the terminal to the container
      const fitAddon = new FitAddon();
      terminalInstance.current.loadAddon(fitAddon);
    }
    return () => {
      // Cleanup and dispose the terminal instance
      if (terminalInstance.current) {
        terminalInstance.current.dispose();
      }
    };
  }, []);

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
          terminalInstance.current?.write(data);
        }
      });
    }
  }, [terminalInstance]);

  const processCommand = (command: string) => {
    console.log("execute command :", command);
    const term = terminalInstance.current;
    if (term) {
      window.ssh.execCommand( 4 , command )
        .then(( data : any ) => {
          // term.writeln(`Successed...`);
          console.log("execute result :" , data)
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
      window.ssh.connectSSH('47.107.47.210', 'root', 'Zy123456!')
        .then((connection: any) => {
          term.writeln(`Successed...${connection}`);
        })
        .catch((err: any) => {
          console.log("error:" , err)
        });
    }

  }, [terminalInstance]);

  return <>
    <Row style={{ marginTop: "50px" }}>
      <Col span={24}>
        <div ref={terminalRef} style={{ width: '100%', height: '100%', background: "black", padding: "5px" }} />
      </Col>
    </Row>
  </>
}

