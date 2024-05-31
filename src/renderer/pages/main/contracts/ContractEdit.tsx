import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert, Table } from 'antd';
import { useEffect, useRef, useState } from 'react';
import AceEditor from 'react-ace';
// Import Ace Editor's theme
import 'ace-builds/src-noconflict/theme-monokai';
// Import Ace Editor's base modes
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/ext-language_tools';
import './mode-solidity'; // Adjust the path accordingly
import { IPC_CHANNEL } from '../../../config';
import { ContractCompileSignal, ContractCompile_Methods } from '../../../../main/handlers/ContractCompileHandler';


const { Title, Text } = Typography;

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

  useEffect( () => {
    const method = ContractCompile_Methods.compile;
    window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [ContractCompileSignal, method, [
      Solidity_Template
    ]]);
    window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
      if (arg instanceof Array && arg[0] == ContractCompileSignal && arg[1] == method) {
        console.log( arg[2] )
        setCompileResult(arg[2]);
      }
    })
  } , [] );

  const [compileResult , setCompileResult] = useState();

  return <>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          编辑合约11
        </Title>
      </Col>
    </Row>

    <Text>{JSON.stringify(compileResult)}</Text>


    <AceEditor
      mode="solidity"
      value={ Solidity_Template }
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



  </>

}
