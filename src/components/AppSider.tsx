import React from "react";
import {Layout, Menu, MenuProps} from "antd";
import {
  DownCircleOutlined,
  HomeOutlined,
  LaptopOutlined,
  PartitionOutlined,
  ProfileOutlined,
  ReconciliationOutlined,
  UpCircleOutlined,
} from "@ant-design/icons";
import {useNavigate} from "react-router-dom";

export const AppSider: React.FC = () => {
  const {Sider} = Layout;

  const navigate = useNavigate();

  const onClick = (e: any) => {
    console.log(e)
    navigate(e.key);
  }

  const items: MenuProps["items"] = [
    {
      label: "Overview",
      key: "/",
      icon: React.createElement(HomeOutlined),
    },
    {
      label: "Send",
      key: "/send",
      icon: React.createElement(UpCircleOutlined),
    },
    {
      label: "Receive",
      key: "/receive",
      icon: React.createElement(DownCircleOutlined),
    },
    {
      label: "Transaction",
      key: "/transaction",
      icon: React.createElement(ReconciliationOutlined),
    },
    {
      label: "MasterNode",
      key: "/masternode",
      icon: React.createElement(LaptopOutlined),
    },
    {
      label: "SuperNode",
      key: "/supernode",
      icon: React.createElement(PartitionOutlined),
    },
    {
      label: "Proposal",
      key: "/proposal",
      icon: React.createElement(ProfileOutlined),
    },
  ];

  return (
    <Sider width={200}>
      <Menu
        mode="inline"
        defaultSelectedKeys={["overview"]}
        style={{
          height: "100%",
          borderRight: 0,
          background: "#3C6B9D",
          color: "white",
        }}
        items={items}
        onClick={onClick}
      />
    </Sider>
  );
};