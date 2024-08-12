import { Typography, Button, Card, Divider, Collapse, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert, Table, Spin, Select, Switch, InputNumber } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AceEditor from 'react-ace';
// Import Ace Editor's theme
import 'ace-builds/src-noconflict/theme-monokai';
// Import Ace Editor's base modes
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/ext-language_tools';
import './mode-solidity'; // Adjust the path accordingly
import { IPC_CHANNEL } from '../../../config';
import { ContractCompileSignal, ContractCompile_Methods } from '../../../../main/handlers/ContractCompileHandler';
import ContractCompileResult from './ContractCompileResult';
import { LeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { applicationControlDirectDeploy } from '../../../state/application/action';
import { AppState } from '../../../state';
import { EvmVersionOptions } from './Compile_Option';

const { Title, Text, Link } = Typography;

const Solidity_Template = "pragma solidity >=0.8.2 <0.9.0 ;\n\n"
  + "/** \n"
  + "* @title Storage \n"
  + "* @dev Store & retrieve value in a variable \n"
  + "*/  \n"
  + "contract Storage { \n\n"
  + "   uint256 number;   \n\n"
  + "  /** \n"
  + "   * @dev Store value in variable \n"
  + "   * @param num value to store \n"
  + "   */ \n"
  + "   function store(uint256 num) public { \n"
  + "     number = num; \n"
  + "   } \n\n"
  + "  /**\n"
  + "   * @dev Return value \n"
  + "   * @return value of 'number' \n"
  + "   */\n"
  + "   function retrieve() public view returns(uint256){ \n"
  + "     return number; \n"
  + "   }\n\n"
  + "}";

export default () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const compile = useSelector<AppState, {
    sourceCode: string, abi: string, bytecode: string
  } | undefined>(state => state.application.control.compile);

  const [compileResult, setCompileResult] = useState();
  const [sourceCode, setSourceCode] = useState<string>(compile ? compile.sourceCode : Solidity_Template);
  const [compiling, setCompiling] = useState<boolean>(false);
  const [solcVersionOptions, setSolcVersionOptions] = useState();

  const [compileOption, setCompileOption] = useState<{
    compileVersion: string,
    evmVersion: string,
    optimizer: {
      enabled: boolean,
      runs: number
    }
  }>({
    compileVersion: "v0.8.17+commit.8df45f5f",
    evmVersion: "",
    optimizer: {
      enabled: false,
      runs: 200
    }
  });

  useEffect(() => {
    const method = ContractCompile_Methods.getSolcVersions;
    window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [ContractCompileSignal, method, []]);
    window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
      if (arg instanceof Array && arg[0] == ContractCompileSignal && arg[1] == method) {
        const allSolcVersions = arg[2][0];
        const versionRegex = /soljson-v(\d+)\.(\d+)\.(\d+)\+commit\.[\da-f]+\.js/;
        const versionOptionRegex = /v\d+\.\d+\.\d+\+commit\.[\da-f]+/;
        const solcVersionOptions = allSolcVersions.map((solcVersion: string) => {
          const match = solcVersion.match(versionRegex);
          if (match) {
            const [, major, minor, patch] = match;
            return {
              solcVersion,
              version: `${major}.${minor}.${patch}`,
              major: parseInt(major, 10),
              minor: parseInt(minor, 10),
              patch: parseInt(patch, 10)
            };
          }
          return null;
        }).filter(Boolean)
          // 不使用高于 0.8.17 版本进行编译，会出问题.
          .filter((solc: any) => (solc.major == 0 && solc.minor < 8 && solc.minor > 4 || (solc.major == 0 && solc.minor == 8 && solc.patch <= 17)))
          .sort((b: any, a: any) => {
            if (a.major !== b.major) {
              return a.major - b.major;
            }
            if (a.minor !== b.minor) {
              return a.minor - b.minor;
            }
            return a.patch - b.patch;
          })
          .map((solc: any) => {
            const option = solc.solcVersion.match(versionOptionRegex)[0];
            return {
              value: option,
              label: option
            }
          })
        setSolcVersionOptions(solcVersionOptions);
      };
    })
  }, []);

  const doSolccompile = useCallback(() => {
    const method = ContractCompile_Methods.compile;
    setCompiling(true);
    window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [ContractCompileSignal, method, [
      sourceCode, compileOption
    ]]);
    window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
      if (arg instanceof Array && arg[0] == ContractCompileSignal && arg[1] == method) {
        setCompileResult(arg[2]);
        setCompiling(false);
      }
    })
  }, [sourceCode, compileOption]);

  return <>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Button style={{ marginTop: "14px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/contracts")
        }} />
        <Title level={4} style={{ lineHeight: "16px" }}>
          编辑合约
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>

        <Card>
          <Alert type='info' showIcon message={<>
            <Text>在编辑框中编写智能合约,点击编译按钮将其部署到 Safe4 网络 (<Link onClick={() => window.open("https://docs.soliditylang.org/zh/v0.8.17/")}>Soliditiy 使用文档</Link>)</Text>
            <br />
            <Text>已有 ABI 和合约字节码(Bytecode),也可以选择 <Link onClick={() => {
              dispatch(applicationControlDirectDeploy(true));
              navigate("/main/contracts/deploy")
            }}>直接部署</Link></Text>
          </>} />
          <Divider />

          <Spin spinning={compiling}>
            <Row>

              <Col span={8}>
                <Text type='secondary'>Solidity 编译版本</Text><br />
                <Select style={{ borderRadius: "8px", width: "80%" }}
                  value={compileOption.compileVersion}
                  options={solcVersionOptions}
                  onChange={(value) => {
                    setCompileOption({
                      ...compileOption,
                      compileVersion: value
                    })
                  }}
                >
                </Select>
              </Col>

              <Col span={8}>
                <Text type='secondary'>EVM 版本</Text><br />
                <Select style={{ borderRadius: "8px", width: "80%" }}
                  value={compileOption.evmVersion}
                  options={EvmVersionOptions}
                  onChange={(value) => {
                    setCompileOption({
                      ...compileOption,
                      evmVersion: value
                    })
                  }}
                >
                </Select>
              </Col>

              <Col span={8}>
                <Text type='secondary'>Enable optimization</Text><br />
                <Switch style={{ marginRight: "5px" }}
                  checkedChildren="开启" unCheckedChildren="关闭" value={compileOption.optimizer.enabled}
                  onChange={(value) => {
                    setCompileOption({
                      ...compileOption,
                      optimizer: {
                        enabled: value,
                        runs: compileOption.optimizer.runs
                      }
                    })
                  }} />
                <InputNumber disabled={!compileOption.optimizer.enabled}
                  min={100} max={1000} value={compileOption.optimizer.runs} step={100}
                  onChange={(value) => {
                    if (value) {
                      setCompileOption({
                        ...compileOption,
                        optimizer: {
                          enabled: compileOption.optimizer.enabled,
                          runs: value
                        }
                      })
                    }
                  }} />
              </Col>

            </Row>
            <Row style={{ marginTop: "20px" }}>
              <Col span={24}>
                <Button type='primary' icon={<ReloadOutlined />} onClick={doSolccompile}>编译</Button>
              </Col>
              {
                compileResult && <Col span={24} style={{ marginTop: "20px" }}>
                  <ContractCompileResult sourceCode={sourceCode} compileResult={compileResult} compileOption={compileOption} />
                </Col>
              }
            </Row>
            <Divider />
            <AceEditor
              mode="solidity"
              value={sourceCode}
              onChange={(sourceCode) => setSourceCode(sourceCode)}
              // theme="monokai"
              name="editor"
              editorProps={{ $blockScrolling: true }}
              width="100%"
              height="100vh"
              setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
                showLineNumbers: true,
                tabSize: 2,
              }}
            />
          </Spin>
        </Card>
      </div>
    </div>
  </>

}
