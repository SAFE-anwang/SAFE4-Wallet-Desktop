import React, { useMemo, useState } from 'react';
import { AppstoreOutlined, WalletOutlined, SettingOutlined, ClusterOutlined, ApartmentOutlined, FilePptOutlined, ApiOutlined, GiftOutlined, FileZipOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Dropdown, MenuProps, MenuTheme, Space, message } from 'antd';
import { Menu, Switch } from 'antd';
import { useNavigate } from 'react-router-dom';
import WalletSwitchComponent from './WalletSwitchComponent';
import { useTranslation } from 'react-i18next';

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

const MenuComponent: React.FC = () => {
  const [current, setCurrent] = useState('/main/wallet');
  const navigate = useNavigate();
  const { t } = useTranslation();
  // const items: MenuItem[] = [
  //   getItem( "钱包" , '/main/wallet', <WalletOutlined />),
  //   getItem("超级节点", '/main/supernodes', <ClusterOutlined />),
  //   getItem("主节点", '/main/masternodes', <ApartmentOutlined />),
  //   getItem("提案", '/main/proposals', <FilePptOutlined />),
  //   getItem("Safe3 资产迁移", '/main/safe3nav', <ApiOutlined />),
  //   getItem('智能合约', '/main/contracts', <FileZipOutlined />),
  //   // getItem("Test", '/main/test', <ApiOutlined />),
  //   getItem('领取测试币', '/main/gettestcoin', <GiftOutlined />),
  // ];
  const items: MenuItem[] = useMemo(() => {
    return [
      getItem(t("wallet"), '/main/wallet', <WalletOutlined />),
      getItem(t("supernode"), '/main/supernodes', <ClusterOutlined />),
      getItem(t("masternode"), '/main/masternodes', <ApartmentOutlined />),
      getItem(t("proposal"), '/main/proposals', <FilePptOutlined />),
      getItem(t("safe3AssetRedeem"), '/main/safe3nav', <ApiOutlined />),
      getItem(t("contract"), '/main/contracts', <FileZipOutlined />),
      getItem(t("wallet_crosschain"), '/main/crosschain', <SyncOutlined />),
      getItem(t("getTestCoin"), '/main/gettestcoin', <GiftOutlined />),
    ]
  }, [t]);
  const bottom_items: MenuItem[] = [
    getItem(t("menu"), '/main/menu', <SettingOutlined />),
  ];

  const onClick: MenuProps['onClick'] = (e) => {
    setCurrent(e.key);
    navigate(e.key)
  };

  return (
    <div style={{
      height: "100vh",
      width: "100%"
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
