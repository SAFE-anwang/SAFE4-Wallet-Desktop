import React from "react";
import {Layout, Menu, MenuProps} from "antd";

export const AppMenu: React.FC = () => {
  const {Header} = Layout;

  const items: MenuProps["items"] = [
    {
      label: "File",
      key: "file",
    },
    {
      label: "Setting",
      key: "setting",
    },
    {
      label: "Tool",
      key: "tool",
    },
    {
      label: "Help",
      key: "help",
    },
  ];

  return (
    <Header style={{display: "flex", alignItems: "center"}}>
      <Menu theme="dark" mode="horizontal" items={items}/>
    </Header>
  );
};