import { useCallback, useEffect, useRef, useState } from "react";
import { SSH2ConnectConfig } from "../../../main/SSH2Ipc"
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { Button, Card, Col, Input, Row, Typography, Steps, Alert } from "antd";

const { Text } = Typography;

export class CommandState {

  command: string;

  handle: (data: string) => boolean;
  onSuccess: () => void;
  onFailure: () => void;

  constructor(command: string, handle: (data: string) => boolean, onSuccess: () => void, onFailure: () => void) {
    this.command = command;
    this.handle = handle;
    this.onSuccess = onSuccess;
    this.onFailure = onFailure;
  }

  execute(term: Terminal) {
    const promise = new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        term.writeln(this.command);
        const data = await window.electron.ssh2.execute(this.command);
        const result = this.handle(data);
        if (result) {
          this.onSuccess();
          resolve(true);
        } else {
          this.onFailure();
          reject(false);
        }
      }, 500)

    });
    return promise;
  }

}

const addressKeystore = {
  address: "8ef4021e8d9a1fd2a1117f66e3ecbc781e55c2d7",
  keystore: "{\\\"address\\\":\\\"8ef4021e8d9a1fd2a1117f66e3ecbc781e55c2d7\\\",\\\"id\\\":\\\"ab885cc9-7361-4ba1-b830-a39e5e6f4735\\\",\\\"version\\\":3,\\\"crypto\\\":{\\\"cipher\\\":\\\"aes-128-ctr\\\",\\\"cipherparams\\\":{\\\"iv\\\":\\\"7ea2a8157ca59112dc0272088f52d503\\\"},\\\"ciphertext\\\":\\\"0727848d2043c78fd919417c29113ea0c2beaf31c76ed6411f68ae722cb13977\\\",\\\"kdf\\\":\\\"scrypt\\\",\\\"kdfparams\\\":{\\\"salt\\\":\\\"d552fcceb0d4e044bdbfa60197b9db83f2a20eb86c6c7bb4ae0f8909a0a27303\\\",\\\"n\\\":131072,\\\"dklen\\\":32,\\\"p\\\":1,\\\"r\\\":8},\\\"mac\\\":\\\"7678f6087092ed4827740c2b90ef693b25db9bf85110011130cbf85276dcbacb\\\"}}"
}

/**
 * 进行脚本化交互的终端交互页面
 */
export default (({
  connectConfig
}: {
  connectConfig: SSH2ConnectConfig
}) => {

  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const [sshConnectConfig, setSSHConnectConfig] = useState();

  const [inputParams, setInputParams] = useState<{
    host: string,
    username: string,
    password: string,
  }>({
    host: "",
    username: "",
    password: ""
  });
  const [inputErrors, setInputErrors] = useState<{
    host: string | undefined,
    username: string | undefined,
    password: string | undefined
  }>({
    host: undefined,
    username: undefined,
    password: undefined
  })

  // useEffect(() => {
  //   let removeSSH2Stderr: any;
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

  //     // 注册 ssh2 数据监听
  //     removeSSH2Stderr = window.electron.ssh2.on((...args: any[]) => {
  //       const stderr = args[0][0];
  //       term.write(`\x1b[34m${stderr}\x1b[0m`);
  //     })

  //   }
  //   return () => {
  //     // Cleanup and dispose the terminal instance
  //     if (terminalInstance.current) {
  //       terminalInstance.current.dispose();
  //     }
  //     if (removeSSH2Stderr) {
  //       removeSSH2Stderr();
  //     }
  //   };
  // }, []);

  useEffect(() => {
    if (terminalInstance.current) {
      /**
       * 处理在 xterm UI组件上的输入;
       */
      const term = terminalInstance.current;
      const { host, port, username, password } = connectConfig;
      term.writeln(`Connect to ${host}`);
      window.electron.ssh2.connect(host, port, username, password)
        .then(async (chunk: any) => {

          console.log(`Connect to ${host} successed,Receive::`, chunk);

          const CMD_download: CommandState = new CommandState(
            "wget -O list.json https://binaries.soliditylang.org/bin/list.json",
            () => {
              return true;
            },
            () => console.log(),
            () => console.log()
          )

          const CMD_unzip: CommandState = new CommandState(
            "unzip -o safe4.zip",
            () => {
              return true;
            },
            () => console.log(""),
            () => console.log("")
          )
          const CMD_start: CommandState = new CommandState(
            "",
            () => {
              return true;
            },
            () => console.log(""),
            () => console.log("")
          )

          const CMD_catNodeKey: CommandState = new CommandState(
            "cat .safe4/safetest/geth/nodekey",
            (nodeKey: string) => {
              console.log("Node Key::", nodeKey)
              return true;
            },
            () => console.log(""),
            () => console.log("")
          )

          const CMD_importKey: CommandState = new CommandState(
            `echo "${addressKeystore.keystore}" > .safe4/safetest/keystore/UTF-${addressKeystore.address}`,
            () => {
              return true;
            },
            () => console.log(""),
            () => console.log("")
          )

          const CMD_download_finish = await CMD_download.execute(term);
          if (CMD_download_finish) {
            const CMD_unzip_success = await CMD_unzip.execute(term);
          }
          const CMD_catNodeKey_success = await CMD_catNodeKey.execute(term);
          const CMD_importKey_success = await CMD_importKey.execute(term);
        })
        .catch((err: any) => {
          console.log("error:", err)
        });

    }
  }, [terminalInstance]);

  const doConnect = useCallback(() => {
    const { host, username, password } = inputParams;
    const inputErrors: {
      host: string | undefined,
      username: string | undefined,
      password: string | undefined
    } = {
      host: undefined,
      username: undefined,
      password: undefined
    };
    if (!host) {
      inputErrors.host = "请输入服务器IP";
    }
    if (!username) {
      inputErrors.username = "请输入用户名";
    }
    if (!password) {
      inputErrors.password = "请输入密码"
    }
    if (inputErrors.host || inputErrors.password || inputErrors.username) {
      setInputErrors(inputErrors);
      return;
    }
  }, [inputParams]);

  const afterConnect = useCallback(() => {

  } , []);

  const description = 'This is a description.';

  return <>

    <Row>
      <Col span={8}>
        <Card title="SSH 连接" style={{ width: "95%" }}>
          <Row>
            <Col span={24}>
              <Text type="secondary">服务器IP</Text>
            </Col>
            <Col span={24}>
              <Input value={inputParams?.host} onChange={(event) => {
                const inputValue = event.target.value.trim();
                setInputParams({
                  ...inputParams,
                  host: inputValue
                })
                setInputErrors({
                  ...inputErrors,
                  host: undefined
                })
              }} />
              {
                inputErrors?.host && <Alert style={{ marginTop: "5px" }} showIcon type="error" message={inputErrors?.host} />
              }
            </Col>
            <Col span={24} style={{ marginTop: "10px" }}>
              <Text type="secondary">用户名</Text>
            </Col>
            <Col span={24}>
              <Input value={inputParams.username} onChange={(event) => {
                const inputValue = event.target.value.trim();
                setInputParams({
                  ...inputParams,
                  username: inputValue
                })
                setInputErrors({
                  ...inputErrors,
                  username: undefined
                })
              }} />
              {
                inputErrors.username && <Alert style={{ marginTop: "5px" }} showIcon type="error" message={inputErrors.username} />
              }
            </Col>
            <Col span={24} style={{ marginTop: "10px" }}>
              <Text type="secondary">密码</Text>
            </Col>
            <Col span={24}>
              <Input.Password value={inputParams.password} onChange={(event) => {
                const inputValue = event.target.value.trim();
                setInputParams({
                  ...inputParams,
                  password: inputValue
                })
                setInputErrors({
                  ...inputErrors,
                  password: undefined
                })
              }} />
               {
                inputErrors.password && <Alert style={{ marginTop: "5px" }} showIcon type="error" message={inputErrors.password} />
              }
            </Col>
          </Row>
          <Row style={{ marginTop: "20px" }}>
            <Col span={24}>
              <Button onClick={doConnect} type="primary">连接</Button>
            </Col>
          </Row>
        </Card>

        <br />
        <Card title="进度" >

          <Steps
            direction="vertical"
            size="small"
            current={0}
            items={[
              {
                title: '正在执行',
                description: "下载 Safe4 节点程序",
              },
              {
                title: '等待执行',
                description: "上传节点地址加密 Keystore 文件",
              },
              {
                title: '等待执行',
                description: "获取节点 ENODE 信息",
              },
            ]}
          />

        </Card>

      </Col>
      <Col span={16}>
        <Card>
          <div ref={terminalRef} style={{ width: '100%', height: '500px', background: "black" }} />
        </Card>
      </Col>
    </Row>

  </>

})
