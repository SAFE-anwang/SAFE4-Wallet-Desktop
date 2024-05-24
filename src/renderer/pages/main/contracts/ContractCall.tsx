import { Interface } from "ethers/lib/utils";
import SystemContractAbiConfig from "../../../constants/SystemContractAbiConfig"
import { SystemContract } from "../../../constants/SystemContracts"
import { Col, Divider, Input, Row, Typography } from "antd";
import { CaretRightOutlined } from '@ant-design/icons';
import type { CollapseProps } from 'antd';
import type { CSSProperties } from 'react';
import { Collapse, theme } from 'antd';
import ContractFunction from "./ContractFunction";

const { Text } = Typography;

export default () => {

  const abi = SystemContractAbiConfig.AccountManagerABI;
  const IContract = new Interface(abi);
  const functions = IContract.functions;

  const getItems: (panelStyle: CSSProperties) => CollapseProps['items'] = (panelStyle) => {
    return Object.keys(functions).map(name => {
      const contractFunction = functions[name];
      return {
        key: name,
        label: name,
        children: <ContractFunction functionFragment={contractFunction} IContract={IContract} address={SystemContract.AccountManager} />,
        style: panelStyle
      }
    })
  };

  const { token } = theme.useToken();
  const panelStyle: React.CSSProperties = {
    marginBottom: 24,
    background: token.colorFillAlter,
    borderRadius: token.borderRadiusLG,
    border: 'none',
  };

  return <>
    <Collapse
      bordered={false}
      defaultActiveKey={['1']}
      expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
      style={{ background: token.colorBgContainer }}
      items={getItems(panelStyle)}
    />
  </>

}
