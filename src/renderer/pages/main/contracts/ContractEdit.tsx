import { Typography, Button, Card, Divider, Collapse, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert, Table, Spin } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { applicationControlDirectDeploy } from '../../../state/application/action';

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

  // useEffect(() => {
  //   const method = ContractCompile_Methods.compile;
  //   window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [ContractCompileSignal, method, [
  //     Solidity_Template
  //   ]]);
  //   window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
  //     if (arg instanceof Array && arg[0] == ContractCompileSignal && arg[1] == method) {
  //       setCompileResult(arg[2]);
  //     }
  //   })
  // }, []);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [compileResult, setCompileResult] = useState();
  const [sourceCode, setSourceCode] = useState<string>(Solidity_Template);
  const [compiling, setCompiling] = useState<boolean>(false);

  useEffect(() => {
    console.log("source code >>", sourceCode)
  }, [sourceCode])

  const compile = useCallback(() => {
    const method = ContractCompile_Methods.compile;
    setCompiling(true);
    window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [ContractCompileSignal, method, [
      sourceCode
    ]]);
    window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
      if (arg instanceof Array && arg[0] == ContractCompileSignal && arg[1] == method) {
        setCompileResult(arg[2]);
        setCompiling(false);
      }
    })
  }, [sourceCode]);

  return <>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          编辑合约
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>

        <Card>
          <Alert type='info' showIcon message={<>
            <Text>在编辑框中编写智能合约,点击编译按钮将其部署到 Safe4 网络 (<Link onClick={() => window.open("https://docs.soliditylang.org/en/v0.8.17/")}>Soliditiy 使用文档</Link>)</Text>
            <br />
            <Text>已有 ABI 和合约字节码(Bytecode),也可以选择 <Link onClick={() => {
              dispatch(applicationControlDirectDeploy(true));
              navigate("/main/contracts/deploy")
            }}>直接部署</Link></Text>
          </>} />
          <Divider />

          <Spin spinning={compiling}>
            <Row>
              <Col span={24}>
                <Button icon={<ReloadOutlined />} onClick={compile}>编译</Button>
              </Col>
              {
                compileResult && <Col span={24} style={{ marginTop: "20px" }}>
                  <ContractCompileResult sourceCode={sourceCode} compileResult={compileResult} />
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
