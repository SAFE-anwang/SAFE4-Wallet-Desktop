import React, { useState } from 'react';
import { AppstoreOutlined, WalletOutlined, SettingOutlined, ClusterOutlined, ApartmentOutlined , FilePptOutlined , ApiOutlined } from '@ant-design/icons';
import { Button, Dropdown, MenuProps, MenuTheme, Space, message } from 'antd';
import { Menu, Switch } from 'antd';
import { useNavigate } from 'react-router-dom';
import WalletSwitchComponent from './WalletSwitchComponent';

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key?: React.Key | null,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group',
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem("钱包", '/main/wallet', <WalletOutlined />),
  getItem("超级节点", '/main/supernodes', <ClusterOutlined />),
  getItem("主节点", '/main/masternodes', <ApartmentOutlined />),
  getItem("提案", '/main/proposals', <FilePptOutlined />),
  getItem("Safe3 资产迁移", '/main/safe3', <ApiOutlined />),
  getItem("Test", '/main/test', <ApiOutlined />),
  getItem('领取测试币', '/main/gettestcoin', <AppstoreOutlined />),
];

const bottom_items: MenuItem[] = [
  getItem("菜单", '/main/menu', <SettingOutlined />),
];

const MenuComponent: React.FC = () => {

  const [current, setCurrent] = useState('/main/wallet');
  const navigate = useNavigate();

  const onClick: MenuProps['onClick'] = (e) => {
    setCurrent(e.key);
    navigate(e.key)
  };

  return (
    <div style={{
      height: "100vh",
      width:"100%"
    }}>
      <div style={{
        paddingLeft: "5px", paddingRight: "5px", width: "100%"
      }}>
        <WalletSwitchComponent />
        <Menu
          style={{
            border: "0px"
          }}
          onClick={onClick}
          defaultOpenKeys={['/main/wallet']}
          selectedKeys={[current]}
          mode="inline"
          items={items}
        />
      </div>

      <div style={{
        paddingLeft: "5px", paddingRight: "5px", width: "100%",
        position: "absolute",
        bottom: "0",
        marginBottom: "50px"
      }}>
        <Menu
          style={{
            border: "0px"
          }}
          onClick={onClick}
          mode="inline"
          selectedKeys={[current]}
          items={bottom_items}
        />
      </div>
    </div>
  );
};

export default MenuComponent;
