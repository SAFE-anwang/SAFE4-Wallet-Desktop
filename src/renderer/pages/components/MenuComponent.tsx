import React, { useState } from 'react';
import { AppstoreOutlined, MailOutlined, SettingOutlined } from '@ant-design/icons';
import type { MenuProps, MenuTheme } from 'antd';
import { Menu, Switch } from 'antd';
import { useNavigate } from 'react-router-dom';

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
  getItem('Overviews', 'sub1', <MailOutlined />, [
    getItem('Accounts', '/overviews/accounts' ),
    getItem('Send', '/overviews/send'),
    getItem('Receive', '/overviews/receive'),
    getItem('Transactions', '/overviews/receive2'),
  ]),
  getItem('Tools', 'sub2', <AppstoreOutlined />, [

  ]),
  getItem('Settings', 'sub4', <SettingOutlined />, [

  ]),
];

const MenuComponent: React.FC = () => {

  const [current, setCurrent] = useState('/overviews/accounts');
  const navigate = useNavigate();

  const onClick: MenuProps['onClick'] = (e) => {
    setCurrent(e.key);
    navigate(e.key)
  };

  return (
    <>
      <Menu
        style={{
          minHeight:"98vh"
        }}
        onClick={onClick}
        defaultOpenKeys={['sub1']}
        selectedKeys={[current]}
        mode="inline"
        items={items}
      />
    </>
  );
};

export default MenuComponent;
