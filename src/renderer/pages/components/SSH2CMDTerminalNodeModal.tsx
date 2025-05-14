import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { Button, Card, Col, Input, Row, Typography, Steps, Alert, Divider, Spin, Modal } from "antd";
import { ethers } from "ethers";
import { useApplicationPassword } from "../../state/application/hooks";
import AddressComponent from "./AddressComponent";
import { CloseCircleTwoTone, LoadingOutlined } from "@ant-design/icons";
import { DateTimeFormat } from "../../utils/DateUtils";
import { useWeb3React } from "@web3-react/core";
import { Safe4_Network_Config, Safe4NetworkChainId } from "../../config";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

const Fake_Keystore_Template = '{"address":"ea5b0c1bfe412cea673c0db89cfa3809d6de1552","id":"29a2f2be-d6cd-44a1-b24b-ca0fda4e6112","version":3,"crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"9c4619d2f9b2fe92713250670520202d"},"ciphertext":"00000000000000000000000000000000000000000000000000","kdf":"scrypt","kdfparams":{"salt":"b4cda799dfe9d778b1908f1d20c4028904771f99370483b763665ff77560914a","n":131072,"dklen":32,"p":1,"r":8},"mac":"31a694660911ac6903934eaa67c05a905340bfebd7209bc01830c44be3545ca8"}}';


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

  execute(term: Terminal, hidden?: string) {
    const promise = new Promise<boolean>(async (resolve, reject) => {
      setTimeout(async () => {
        if (hidden) {
          term.writeln(hidden.toString());
        } else {
          term.writeln(this.command);
        }
        try {
          const data = await window.electron.ssh2.execute(this.command);
          resolve(this.handle(data));
        } catch (err: any) {
          reject(err);
        }
      }, 500)
    });
    return promise;
  }
}

/**
 * 进行脚本化交互的终端交互页面
 */
export default ({
  openSSH2CMDTerminalNodeModal,
  setOpenSSH2CMDTerminalNodeModal,
  nodeAddressPrivateKey,
  isSupernode,
  nodeAddress,
  onSuccess,
  onError
}: {
  nodeAddressPrivateKey?: string,
  isSupernode?: boolean,
  nodeAddress: string,
  openSSH2CMDTerminalNodeModal: boolean
  setOpenSSH2CMDTerminalNodeModal: (openSSH2CMDTerminalNodeModal: boolean) => void
  onSuccess: (enode: string, nodeAddress: string) => void
  onError: () => void
}) => {

  const { t } = useTranslation();
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const password = useApplicationPassword();
  const [enode, setEnode] = useState<string>();
  const [scriptError, setScriptError] = useState<string>();
  const wallet = nodeAddressPrivateKey ? new ethers.Wallet(nodeAddressPrivateKey) : undefined;
  const { chainId } = useWeb3React();

  const DEFAULT_CONFIG = useMemo(() => {
    if (chainId == Safe4_Network_Config.Testnet.chainId) {
      // 测试网络相关配置
      return {
        // 节点程序的下载地址
        Safe4FileURL: "https://www.anwang.com/download/safe4_node/safe4.linux.latest.tar.gz",
        Safe4FileMD5: "https://www.anwang.com/download/safe4_node/safe4.linux.latest.md5.json",
        Safe4FileName: "safe4.linux.latest.tar.gz",
        // 从这里读区 geth 运行后写入的数据,从而加载 geth 的路径,以及data_dir
        Safe4Info: ".safe4_info",
        // 默认的 Safe4DataDir
        Safe4DataDir: ".safe4/safetest",
        isMainnet: chainId == Safe4NetworkChainId.Mainnet
      }
    } else {
      // 正式网络相关配置
      return {
        // 节点程序的下载地址
        Safe4FileURL: "https://www.anwang.com/download/safe4_node/safe4.linux.latest.tar.gz",
        Safe4FileMD5: "https://www.anwang.com/download/safe4_node/safe4.linux.latest.md5.json",
        Safe4FileName: "safe4.linux.latest.tar.gz",
        // 从这里读区 geth 运行后写入的数据,从而加载 geth 的路径,以及 data_dir
        Safe4Info: ".safe4_info",
        // 默认的 Safe4DataDir
        Safe4DataDir: ".safe4",
        isMainnet: chainId == Safe4NetworkChainId.Mainnet
      }
    }
  }, [chainId]);

  const DEFAULT_STEPS: {
    title: string | ReactNode,
    description: string | ReactNode
  }[] = [
      {
        title: t("ssh2_connect_execute_state_waiting"),
        description: t("ssh2_connect_execute_steps0")
      },
      {
        title: t("ssh2_connect_execute_state_waiting"),
        description: t("ssh2_connect_execute_steps1")
      },
      {
        title: t("ssh2_connect_execute_state_waiting"),
        description: t("ssh2_connect_execute_steps2")
      }
    ];

  const [steps, setSteps] = useState(DEFAULT_STEPS);
  const [current, setCurrent] = useState(-1);
  const updateSteps = useCallback((current: number, description?: string, error?: string) => {
    setCurrent(current);
    const _steps = steps.map((step, index) => {
      if (index < current) {
        return {
          ...step,
          title: t("ssh2_connect_execute_state_finished")
        }
      }
      if (index == current) {
        if (!error) {
          return {
            title: <><LoadingOutlined style={{ marginRight: "5px" }} />{t("ssh2_connect_execute_state_executing")}</>,
            description: description ?? step.description
          }
        } else {
          return {
            title: <Text type="danger">{t("ssh2_connect_execute_state_error")}</Text>,
            description: <Text type="danger"><CloseCircleTwoTone twoToneColor="red" style={{ marginRight: "5px" }} />{error ?? step.description}</Text>
          }
        }
      }
      return {
        ...step
      }
    })
    setSteps(_steps);
  }, [steps])

  const [inputParams, setInputParams] = useState<{
    host: string,
    username: string,
    password: string,
  }>({
    host: "",
    username: "root",
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
  });
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string>();

  useEffect(() => {
    let removeSSH2Stderr: any;
    if (terminalRef.current) {
      const term = new Terminal({
        cursorBlink: true,
        fontFamily: 'monospace',
        fontSize: 14,
        theme: {
          background: '#000000', // 黑色背景
          foreground: '#FFFFFF', // 白色文本
          cursor: '#FFFFFF', // 白色光标
        },
      });
      // Optionally, fit the terminal to the container
      const fitAddon = new FitAddon();
      terminalInstance.current = term;
      terminalInstance.current.loadAddon(fitAddon);
      terminalInstance.current.open(terminalRef.current);
      // 注册 ssh2 数据监听
      removeSSH2Stderr = window.electron.ssh2.on((...args: any[]) => {
        const stderr = args[0][0];
        term.write(`\x1b[34m${stderr}\x1b[0m`);
      });
      term.write(`${t("ssh2_connect_waiting")}\r\n`);
    }
    return () => {
      // Cleanup and dispose the terminal instance
      if (terminalInstance.current) {
        terminalInstance.current.dispose();
      }
      if (removeSSH2Stderr) {
        removeSSH2Stderr();
      }
      window.electron.ssh2.close();
    };
  }, []);

  const outputKeyStore = useCallback(async () => {
    if (wallet) {
      const keystore = await wallet.encrypt("");
      return {
        address: wallet.address,
        keystore
      }
    }
    const fakeKeystore = JSON.parse(Fake_Keystore_Template);
    fakeKeystore.address = nodeAddress;
    return {
      address: nodeAddress,
      keystore: JSON.stringify(fakeKeystore)
    }
  }, [wallet, password, nodeAddress]);

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
      inputErrors.host = t("please_enter") + t("ssh2_connect_serverip");
    }
    if (!username) {
      inputErrors.username = t("please_enter") + t("ssh2_connect_serveruser");
    }
    if (!password) {
      inputErrors.password = t("please_enter") + t("ssh2_connect_password")
    }
    if (inputErrors.host || inputErrors.password || inputErrors.username) {
      setInputErrors(inputErrors);
      return;
    }

    if (terminalInstance && terminalInstance.current) {
      const term = terminalInstance.current;
      const port = 22;
      term.writeln(`Connect to ${host}`);
      setConnecting(true);
      window.electron.ssh2.connect(host, port, username, password)
        .then(async (chunk: any) => {
          console.log(`Connect to ${host} successed,Receive::`, chunk);
          setConnecting(false);
          afterConnect();
        })
        .catch((err: any) => {
          console.log(err);
          const msg = err.toString();
          term.writeln(`\x1b[31m${msg}\x1b[0m`);
          if (msg.indexOf("authentication") > 0) {
            // 认证失败，账户密码错误
            console.log("认证失败");
            setConnectError(t("ssh2_connect_error_invalidlogin"));
          } else if (msg.indexOf("waiting") > 0) {
            // 连接超时
            console.log("连接超时");
            setConnectError(t("ssh2_connect_error_timeout"));
          }
          setConnecting(false);
        });
    }

  }, [inputParams, terminalInstance]);

  const afterConnect = useCallback(async () => {
    const term = terminalInstance.current;

    const {
      Safe4FileURL,
      Safe4FileName,
      Safe4Info,
      Safe4DataDir,
      isMainnet
    } = DEFAULT_CONFIG;

    let _Safe4MD5Sum = "";
    let _Safe4DataDir = Safe4DataDir;
    let _Safe4NodeDir = "";
    let _Safe4GethPath = "";

    const CMD_psSafe4: CommandState = new CommandState(
      "ps aux| grep geth | grep -v grep",
      (data: string) => {
        if (data) {
          console.log("[.ps]=", data);
          console.log("[.ps]", "SAFE4 节点进程存在;");
          return true;
        }
        console.log("[.ps]=", data);
        console.log("[.ps]", "SAFE4 节点进程不存在;")
        return false;
      },
      () => console.log(""),
      () => console.log("")
    );

    const CMD_catSafe4Info: CommandState = new CommandState(
      `cat ${Safe4Info}`,
      (data) => {
        const safe4InfoArr = data.split("\n");
        if (safe4InfoArr) {
          for (let i in safe4InfoArr) {
            const keyValue = safe4InfoArr[i];
            console.log("handle ::", keyValue)
            if (keyValue.indexOf("=") > 0) {
              const [key, value] = keyValue.split("=");
              if (key == "SAFE4_PATH") {
                _Safe4GethPath = value.trim();
              }
              if (key == "DATA_DIR") {
                _Safe4DataDir = value.trim();
              }
            }
          }
        }

        return true;
      },
      () => { },
      () => { }
    )

    const CMD_download: CommandState = new CommandState(
      `wget -O ${Safe4FileName} ${Safe4FileURL} --no-check-certificate`,
      () => {
        return true;
      },
      () => console.log(),
      () => console.log()
    )
    const CMD_unzip: CommandState = new CommandState(
      `tar -zxvf ${Safe4FileName}`,
      (data) => {
        _Safe4NodeDir = data.substring(0, data.indexOf("/"));
        console.log(`[.tar] Safe4NodeDir = ${_Safe4NodeDir} `)
        return true;
      },
      () => console.log(""),
      () => console.log("")
    )

    const CMD_mkdirDataDir: CommandState = new CommandState(
      `mkdir -p ${_Safe4DataDir}/keystore`,
      () => true,
      () => console.log(""),
      () => console.log(""),
    )

    if (term) {

      let needAttachIpc = false;
      let forceUpdateNode = false;
      updateSteps(0, t("ssh2_connect_exeucte_steps_checksafe4running"));
      try {
        _Safe4MD5Sum = JSON.parse((await (await fetch(DEFAULT_CONFIG.Safe4FileMD5)).text()).trim()).md5;
        console.log("从服务器获取最新 MD5值", _Safe4MD5Sum);
        const CMD_checkzip: CommandState = new CommandState(
          `[ -f ${Safe4FileName} ] && md5sum ${Safe4FileName} || echo "File does not exist"`,
          (data: string) => {
            if (data.trim() == "File does not exist") {
              console.log(`[.md5] ${Safe4FileName} 文件不存在`);
              return false;
            } else {
              const [md5] = data.trim().split(" ");
              console.log(`[.md5] ${Safe4FileName} 文件存在,md5=`, md5);
              if (_Safe4MD5Sum != md5.trim()) {
                console.log(`[.md5] ${Safe4FileName} 文件与服务器文件[${_Safe4MD5Sum}]不一致.`);
                return false;
              }
            }
            console.log(`[.md5] ${Safe4FileName} 文件且与服务器文件[${_Safe4MD5Sum}]一直.`);
            return true;
          },
          () => console.log(""),
          () => console.log("")
        );
        const CMD_checkzip_success = await CMD_checkzip.execute(term);
        forceUpdateNode = !CMD_checkzip_success;
      } catch (err) {

      }
      let CMD_psSafe4_success = await CMD_psSafe4.execute(term);
      if (CMD_psSafe4_success && forceUpdateNode) {
        const CMD_catSafe4Info_success = await CMD_catSafe4Info.execute(term);
        const _BinPath = _Safe4GethPath.substring(0, _Safe4GethPath.lastIndexOf("/"));
        const CMD_Stop: CommandState = new CommandState(
          `cd ${_BinPath} && cd ../ && ./stop.sh`,
          () => {
            return true;
          },
          () => console.log(""),
          () => console.log("")
        )
        updateSteps(0, t("节点非最新版本,正在关闭节点程序"));
        const CMD_Stop_Success = await CMD_Stop.execute(term);
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        let Loop_psSafe4_Success = true;
        while (Loop_psSafe4_Success) {
          console.log("检查 geth 是否停止..")
          Loop_psSafe4_Success = await CMD_psSafe4.execute(term);
          if (Loop_psSafe4_Success) {
            await delay(3000);
          }
        }
        CMD_psSafe4_success = false;
      }

      let keystoreExist = false;
      if (!CMD_psSafe4_success) {
        try {
          _Safe4MD5Sum = JSON.parse((await (await fetch(DEFAULT_CONFIG.Safe4FileMD5)).text()).trim()).md5;
          console.log("从服务器获取最新 MD5值", _Safe4MD5Sum);
        } catch (err) {

        }
        const CMD_checkzip: CommandState = new CommandState(
          `[ -f ${Safe4FileName} ] && md5sum ${Safe4FileName} || echo "File does not exist"`,
          (data: string) => {
            if (data.trim() == "File does not exist") {
              console.log(`[.md5] ${Safe4FileName} 文件不存在`);
              return false;
            } else {
              const [md5] = data.trim().split(" ");
              console.log(`[.md5] ${Safe4FileName} 文件存在,md5=`, md5);
              if (_Safe4MD5Sum != md5.trim()) {
                console.log(`[.md5] ${Safe4FileName} 文件与服务器文件[${_Safe4MD5Sum}]不一致.`);
                return false;
              }
            }
            console.log(`[.md5] ${Safe4FileName} 文件且与服务器文件[${_Safe4MD5Sum}]一直.`);
            return true;
          },
          () => console.log(""),
          () => console.log("")
        );
        // Safe4 节点进程不存在;
        updateSteps(0, t("ssh2_connect_exeucte_steps_checksafe4file"));
        const CMD_checkzip_success = await CMD_checkzip.execute(term);
        if (!CMD_checkzip_success) {
          // 需要从官网下载 Safe4 节点程序;
          updateSteps(0, t("ssh2_connect_exeucte_steps_downloadsafe4file"));
          const CMD_download_success = await CMD_download.execute(term);
        }
        updateSteps(0, t("ssh2_connect_exeucte_steps_unzipsafe4file"));
        const CMD_unzip_success = await CMD_unzip.execute(term);
        updateSteps(0, t("ssh2_connect_exeucte_steps_initkeystore"));
        const CMD_mkdirDataDir_success = await CMD_mkdirDataDir.execute(term);
        const CMD_checkKeystore: CommandState = new CommandState(
          `find ${_Safe4DataDir}/keystore -type f -name "*${nodeAddress.substring(2).toLocaleLowerCase()}*" -print -quit | grep -q '.' && echo "Keystore file exists" || echo "Keystore file does not exist"`,
          (data: string) => {
            let _data = data.trim();
            if (_data.indexOf("Keystore file does not exist") > -1) {
              if ("Keystore file does not exist" == _data) {
                console.log("[.keystore not exists] = ", data);
                return false;
              }
              throw new Error(data.replace("Keystore file does not exist", ""));
            } else {
              console.log("[.keystore exists] = ", data)
              return true;
            }
          },
          () => console.log(""),
          () => console.log("")
        )

        keystoreExist = await CMD_checkKeystore.execute(term);
        if (!keystoreExist) {
          updateSteps(0, t("ssh2_connect_exeucte_steps_createkeystore"));
          const { address, keystore } = await outputKeyStore();
          const keystoreStr = keystore.toString().replaceAll("\"", "\\\"");
          const hiddenKeystore = JSON.parse(keystore);
          hiddenKeystore.crypto.ciphertext = "****************************************";
          const hidden = JSON.stringify(hiddenKeystore).replaceAll("\"", "\\\"");
          const DateStr = DateTimeFormat(new Date(), "yyyy-MM-dd\'T'\HH-mm-ss.sss\'Z\'");
          const targetFile = `${_Safe4DataDir}/keystore/UTC--${DateStr}--${address.toLowerCase().substring(2)}`;
          const CMD_importKey: CommandState = new CommandState(
            `echo "${keystoreStr}" > ${targetFile}`,
            () => {
              return true;
            },
            () => console.log(""),
            () => console.log("")
          )
          const CMD_importKey_success = await CMD_importKey.execute(
            term,
            `echo "${hidden}" > ${targetFile}`
          );
          keystoreExist = true;
        }
        updateSteps(0, t("ssh2_connect_execute_steps0"));

        const testNetStartFlag = isMainnet ? "" : "--safetest"
        const CMD_start: CommandState = new CommandState(
          isSupernode ? `cd ${_Safe4NodeDir} && ./start.sh ${testNetStartFlag} ${inputParams.host} ${nodeAddress.toLowerCase()}`
            : `cd ${_Safe4NodeDir} && ./start.sh ${testNetStartFlag} ${inputParams.host}`,
          () => {
            return true;
          },
          () => console.log(""),
          () => console.log("")
        )
        const CMD_start_success = await CMD_start.execute(term);
      } else {
        updateSteps(0, t("ssh2_connect_execute_steps_safe4noderunning"));
        const CMD_catSafe4Info_success = await CMD_catSafe4Info.execute(term);
        needAttachIpc = true;
      }
      updateSteps(1, t("ssh2_connect_execute_steps_safe4noderunning"));

      const CMD_checkKeystore: CommandState = new CommandState(
        `find ${_Safe4DataDir}/keystore -type f -name "*${nodeAddress.substring(2).toLocaleLowerCase()}*" -print -quit | grep -q '.' && echo "Keystore file exists" || echo "Keystore file does not exist"`,
        (data: string) => {
          let _data = data.trim();
          if (_data.indexOf("Keystore file does not exist") > -1) {
            if ("Keystore file does not exist" == _data) {
              console.log("[.keystore not exists] = ", data);
              return false;
            }
            throw new Error(data.replace("Keystore file does not exist", ""));
          } else {
            console.log("[.keystore exists] = ", data)
            return true;
          }
        },
        () => console.log(""),
        () => console.log("")
      )

      const CMD_exportEnode: CommandState = new CommandState(
        `cat ${_Safe4DataDir}/geth/nodekey`,
        (nodeKey: string) => {
          console.log("[.cat nodekey]nodeKey=", nodeKey);
          try {
            const wallet = new ethers.Wallet(nodeKey);
            let publicKey = wallet.publicKey.substring(2);
            // 如果公钥存在 04 前缀，则把它去掉.
            if (publicKey.indexOf("04") == 0) {
              publicKey = publicKey.substring(2);
            }
            const enode = `enode://${publicKey}@${inputParams.host}:30303`;
            console.log("[.cat nodekey]enode=", enode)
            setEnode(enode);
            return true;
          } catch (err) {
            return false;
          }
        },
        () => console.log(""),
        () => console.log("")
      )

      const CMD_attachMinerStop: CommandState = new CommandState(
        `${_Safe4GethPath} --exec "miner.stop()" attach ${_Safe4DataDir}/geth.ipc`,
        (result) => {
          return true;
        },
        () => { },
        () => { }
      );
      const CMD_attachSetMiner: CommandState = new CommandState(
        `${_Safe4GethPath} --exec "miner.setEtherbase('${nodeAddress.toLowerCase()}')" attach ${_Safe4DataDir}/geth.ipc`,
        () => true,
        () => { }, () => { }
      );
      const CMD_attachUnlockMiner: CommandState = new CommandState(
        `${_Safe4GethPath} --exec "personal.unlockAccount('${nodeAddress.toLowerCase()}', '', 0)" attach ${_Safe4DataDir}/geth.ipc`,
        () => true,
        () => { }, () => { }
      );
      const CMD_attachMinderStart: CommandState = new CommandState(
        `${_Safe4GethPath} --exec "miner.start()" attach ${_Safe4DataDir}/geth.ipc`,
        (result) => {
          console.log("cmd_acctch stop result :", result)
          return true;
        },
        () => { },
        () => { }
      );

      try {
        keystoreExist = keystoreExist ? keystoreExist : await CMD_checkKeystore.execute(term);
      } catch (error) {
        console.log("error:", error);
        updateSteps(1, "", "无法定位 keystore 文件目录位置");
        return;
      }
      if (!keystoreExist) {
        updateSteps(1, t("ssh2_connect_exeucte_steps_generatenodekeystore"));
        const { address, keystore } = await outputKeyStore();
        const keystoreStr = keystore.toString().replaceAll("\"", "\\\"");
        const hiddenKeystore = JSON.parse(keystore);
        hiddenKeystore.crypto.ciphertext = "****************************************";
        const hidden = JSON.stringify(hiddenKeystore).replaceAll("\"", "\\\"");
        const DateStr = DateTimeFormat(new Date(), "yyyy-MM-dd\'T'\HH-mm-ss.sss\'Z\'");
        const targetFile = `${_Safe4DataDir}/keystore/UTC--${DateStr}--${address.toLowerCase().substring(2)}`;
        const CMD_importKey: CommandState = new CommandState(
          `echo "${keystoreStr}" > ${targetFile}`,
          () => {
            return true;
          },
          () => console.log(""),
          () => console.log("")
        )
        updateSteps(1, t("ssh2_connect_execute_steps_uploadnodekeystore"));
        const CMD_importKey_success = await CMD_importKey.execute(
          term,
          `echo "${hidden}" > ${targetFile}`
        );
      } else {
        updateSteps(1, t("ssh2_connect_execute_steps_nodekeystoreexist"));
      }
      updateSteps(2);
      if (needAttachIpc) {
        const CMD_attach_stop = await CMD_attachMinerStop.execute(term);
        if (isSupernode) {
          const CMD_attach_SetMiner = await CMD_attachSetMiner.execute(term);
          const CMD_attach_UnlockMiner = await CMD_attachUnlockMiner.execute(term);
          const CMD_attach_start = await CMD_attachMinderStart.execute(term);
        }
      }
      const CMD_catNodeKey_success = await CMD_exportEnode.execute(term);
      if (CMD_catNodeKey_success) {
        updateSteps(3);
      } else {
        updateSteps(2, "", "无法获取 ENODE 值");
        setScriptError("无法获取 ENODE 值");
      }
    }
  }, [terminalInstance, inputParams, wallet, nodeAddress]);

  return <>
    <Modal footer={null} open={openSSH2CMDTerminalNodeModal} width={1200} destroyOnClose closable={false}>
      <Row>
        <Col span={8}>
          {
            current < 0 &&
            <Card title={t("ssh2_connect")} style={{ width: "95%", height: "470px" }}>
              <Spin spinning={connecting}>
                <Row>
                  <Col span={24}>
                    <Text type="secondary">{t("ssh2_connect_serverip")}</Text>
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
                      setConnectError(undefined);
                    }} />
                    {
                      inputErrors?.host && <Alert style={{ marginTop: "5px" }} showIcon type="error" message={inputErrors?.host} />
                    }
                  </Col>
                  <Col span={24} style={{ marginTop: "10px" }}>
                    <Text type="secondary">{t("ssh2_connect_serveruser")}</Text>
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
                      setConnectError(undefined);
                    }} />
                    {
                      inputErrors.username && <Alert style={{ marginTop: "5px" }} showIcon type="error" message={inputErrors.username} />
                    }
                  </Col>
                  <Col span={24} style={{ marginTop: "10px" }}>
                    <Text type="secondary">{t("ssh2_connect_password")}</Text>
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
                      setConnectError(undefined);
                    }} />
                    {
                      inputErrors.password && <Alert style={{ marginTop: "5px" }} showIcon type="error" message={inputErrors.password} />
                    }
                  </Col>
                </Row>
                {
                  connectError && <>
                    <Divider />
                    <Row>
                      <Col span={24}>
                        <Alert type="error" showIcon message={connectError} />
                      </Col>
                    </Row>
                  </>
                }
                <Divider />
                <Row style={{ marginTop: "20px" }}>
                  <Col span={24}>
                    <Button onClick={doConnect} type="primary">{t("ssh2_connect_button")}</Button>
                    <Button style={{ marginLeft: "20px" }} onClick={() => {
                      setOpenSSH2CMDTerminalNodeModal(false);
                    }} type="default">{t("close")}</Button>
                  </Col>
                </Row>
              </Spin>
            </Card>
          }

          {
            current >= 0 &&
            <Card title="进度" style={{ width: "95%", height: "470px" }}>
              <Steps
                direction="vertical"
                size="small"
                current={current}
                items={steps}
              />
              <Divider style={{ marginTop: "5px", marginBottom: "15px" }} />
              <Row>
                <Col span={24}>
                  <Text type="secondary">{t("node_addresss")}</Text>
                </Col>
                <Col span={24}>
                  <AddressComponent address={nodeAddress} ellipsis copyable qrcode />
                </Col>
                <Col span={24}>
                  <Text type="secondary">ENODE</Text>
                </Col>
                <Col span={24}>
                  {
                    enode && <Text ellipsis copyable>{enode}</Text>
                  }
                </Col>
                <Divider style={{ marginTop: "5px", marginBottom: "15px" }} />
              </Row>

              <Row>
                <Button type={!scriptError ? "primary" : "default"}
                  disabled={!scriptError && current < steps.length}
                  onClick={() => {
                    if (enode) {
                      onSuccess(enode, nodeAddress)
                    }
                    setOpenSSH2CMDTerminalNodeModal(false);
                  }}>{t("return")}</Button>
              </Row>
            </Card>
          }
        </Col>
        <Col span={16}>
          <Card>
            <div ref={terminalRef} style={{ width: '100%', height: '400px', background: "black", padding: "10px" }} />
          </Card>
        </Col>
      </Row>
    </Modal>


  </>

}


