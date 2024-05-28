import { Interface } from "ethers/lib/utils"
import { RefObject, useRef } from "react";
import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert, Table, Spin, Input } from 'antd';

const { Title, Text, Link } = Typography;

export default ({
  IContract , setConstructorValues
}: {
  IContract: Interface ,
  setConstructorValues : ( values : any[] ) => void
}) => {

  const inputRefs: {
    [inputName: string]: RefObject<{ input: HTMLInputElement }>
  } = {};
  IContract.deploy.inputs.forEach((input) => {
    inputRefs[input.name] = useRef<{ input: HTMLInputElement }>(null);
  });

  const getConstructorParams = () => {
    const inputParams: {
      [name: string]: any
    } = {};
    Object.keys(inputRefs).forEach(inputName => {
      if (inputRefs[inputName].current) {
        const value = inputRefs[inputName].current?.input.value;
        inputParams[inputName] = value;
      }
    });
    const values: any[] = [];
    IContract.deploy.inputs.forEach((input, index) => {
      const { name, type } = input;
      values.push(inputParams[name]);
    });
    setConstructorValues( values )
  }

  return <>
    <Col span={24} style={{}}>
      <Text type='secondary' strong>合约创建函数</Text>
      {
        IContract.deploy.inputs.map((input) => {
          const { name, type } = input;
          return <>
            <Row key={name} style={{ marginTop: "10px" }}>
              <Col span={4}>
                <Text style={{ fontSize: "16px", float: "right" }}>{name}:</Text>
              </Col>
              <Col offset={1} span={18}>
                <Input onBlur={getConstructorParams} ref={inputRefs[name]} placeholder={type}></Input>
              </Col>
            </Row>
          </>
        })
      }
    </Col>
  </>

}
