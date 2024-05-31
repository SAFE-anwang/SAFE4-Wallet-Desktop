import { Typography, Button, Card, Divider, Collapse, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert, Table } from 'antd';
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
import type { CollapseProps } from 'antd';


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

const text = `
  A dog is a type of domesticated animal.
  Known for its loyalty and faithfulness,
  it can be found as a welcome guest in many households across the world.
`;

export default () => {

  useEffect(() => {
    const method = ContractCompile_Methods.compile;
    window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [ContractCompileSignal, method, [
      Solidity_Template
    ]]);
    window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
      if (arg instanceof Array && arg[0] == ContractCompileSignal && arg[1] == method) {
        console.log(arg[2])
        setCompileResult(arg[2]);
      }
    })
  }, []);

  const [compileResult, setCompileResult] = useState();

  const items: CollapseProps['items'] = [
    {
      key: '1',
      label: 'This is panel header 1',
      children: <p>{text}</p>,
    },
    {
      key: '2',
      label: 'This is panel header 2',
      children: <p>{text}</p>,
    },
    {
      key: '3',
      label: <Row>
        <Col span={24}>
          <Text strong>Storage</Text>
          <Button type='primary' onClick={(event) =>{ event.stopPropagation() }} size='small' style={{float:"right"}}>部署</Button>
        </Col>
      </Row>,
      children: <p>{text}</p>,
    },
  ];

  return <>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          编辑合约
        </Title>
      </Col>
    </Row>

    {/* <Text>{JSON.stringify(compileResult)}</Text> */}
    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>

        <Card>
          <Alert type='info' showIcon message={<>
            <Text>Solidity 使用文档</Text><br />
            <Text>已有 合约ABI 和 合约字节码,直接部署</Text>
          </>} />
          <Divider />

          <Row>
            <Col span={24}>
              <Button>编译</Button>
            </Col>
            <Col span={24} style={{ marginTop: "20px" }}>
              <Collapse items={items} defaultActiveKey={['1']} />
            </Col>

          </Row>

          <Divider />
          <AceEditor
            mode="solidity"
            value={Solidity_Template}
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
        </Card>


      </div>
    </div>





  </>

}
