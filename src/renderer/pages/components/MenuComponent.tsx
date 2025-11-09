import React, { useEffect, useMemo, useState } from 'react';
import { AppstoreOutlined, WalletOutlined, SettingOutlined, ClusterOutlined, ApartmentOutlined, FilePptOutlined, ApiOutlined, GiftOutlined, FileZipOutlined, SyncOutlined, SwapOutlined, BankOutlined, ExperimentOutlined } from '@ant-design/icons';
import { Badge, Button, Dropdown, MenuProps, MenuTheme, Space, Tooltip, Typography, message } from 'antd';
import { Menu, Switch } from 'antd';
import { useNavigate } from 'react-router-dom';
import WalletSwitchComponent from './WalletSwitchComponent';
import { useTranslation } from 'react-i18next';
import { fetchWalletLatest } from '../../services/getWalletVersion';
import useSafeScan from '../../hooks/useSafeScan';
import { useApplicationPlatform, useApplicationWalletUpdate, useBlockNumber } from '../../state/application/hooks';
import { useDispatch } from 'react-redux';
import { applicationUpdateWalletUpdateVersion } from '../../state/application/action';
import VersionModal from '../main/menu/version/VersionModal';
import { useUnreadProposalIds } from '../../state/proposals/hooks';
import { useWeb3React } from '@web3-react/core';
import { Safe4NetworkChainId } from '../../config';

const { Text } = Typography;
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
  const { chainId } = useWeb3React();
  const { API } = useSafeScan();
  const platform = useApplicationPlatform();
  const blockNumber = useBlockNumber();
  const dispatch = useDispatch();
  const unreadProposalIds = useUnreadProposalIds();

  const items: MenuItem[] = useMemo(() => {
    if ( chainId == Safe4NetworkChainId.Testnet ){
      // 测试网菜单
      return [
        getItem(t("wallet"), '/main/wallet', <WalletOutlined />),
        getItem(t("supernode"), '/main/supernodes', <ClusterOutlined />),
        getItem(t("masternode"), '/main/masternodes', <ApartmentOutlined />),
        /////
        getItem(
          <>
            {t("proposal")}
            {
              unreadProposalIds && unreadProposalIds.length > 0 && <>
                <Tooltip title="未查看的提案">
                  <Text style={{ marginLeft: "5px" }} type='secondary'>({unreadProposalIds?.length})</Text>
                </Tooltip>
              </>
            }
          </>,
          '/main/proposals', <FilePptOutlined />),
        ////
        getItem(t("safe3AssetRedeem"), '/main/safe3nav', <ApiOutlined />),
        getItem(t("wallet_crosschain"), '/main/crosschain', <SyncOutlined />),
        getItem(t("wallet_safeswap"), '/main/swap', <SwapOutlined />),
        getItem("流动性挖矿", '/main/farm', <ExperimentOutlined />),
        getItem(t("wallet_issue"), '/main/issue', <BankOutlined />),
        getItem(t("contract"), '/main/contracts', <FileZipOutlined />),
        getItem(t("getTestCoin"), '/main/gettestcoin', <GiftOutlined />),
      ]
    } else {
      // 主网菜单
      return [
        getItem(t("wallet"), '/main/wallet', <WalletOutlined />),
        getItem(t("supernode"), '/main/supernodes', <ClusterOutlined />),
        getItem(t("masternode"), '/main/masternodes', <ApartmentOutlined />),
        /////
        getItem(
          <>
            {t("proposal")}
            {
              unreadProposalIds && unreadProposalIds.length > 0 && <>
                <Tooltip title="未查看的提案">
                  <Text style={{ marginLeft: "5px" }} type='secondary'>({unreadProposalIds?.length})</Text>
                </Tooltip>
              </>
            }
          </>,
          '/main/proposals', <FilePptOutlined />),
        ////
        getItem(t("safe3AssetRedeem"), '/main/safe3nav', <ApiOutlined />),
        getItem(t("wallet_crosschain"), '/main/crosschain', <SyncOutlined />),
        getItem(t("wallet_safeswap"), '/main/swap', <SwapOutlined />),
        getItem(t("wallet_issue"), '/main/issue', <BankOutlined />),
        getItem(t("contract"), '/main/contracts', <FileZipOutlined />),
        getItem(t("getTestCoin"), '/main/gettestcoin', <GiftOutlined />),
      ]
    }
  }, [t, unreadProposalIds,chainId]);

  const onClick: MenuProps['onClick'] = (e) => {
    setCurrent(e.key);
    navigate(e.key)
  };

  useEffect(() => {
    if (platform && API) {
      fetchWalletLatest(API, { appOS: platform }).then(data => {
        if (data.appName) {
          dispatch(applicationUpdateWalletUpdateVersion(data));
        }
      }).catch(err => {

      })
    }
  }, [API, platform, blockNumber]);

  const walletUpdate = useApplicationWalletUpdate();
  const isLatestWalletVersion = walletUpdate.latestWallet ? (walletUpdate.latestWallet.version == walletUpdate.currentVersion || walletUpdate.latestWallet.versionCode <= walletUpdate.currentVersionCode) : true;

  const bottom_items = useMemo<MenuItem[]>(() => {
    return [
      getItem(<>{t("menu")}</>, '/main/menu', !isLatestWalletVersion ? <Badge style={{ height: "8px", width: "8px" }} dot><SettingOutlined /></Badge> : <SettingOutlined />),
    ]
  }, [isLatestWalletVersion]);
  const [openVersionModal, setOpenVersionModal] = useState<boolean>(false);

  useEffect(() => {
    if (walletUpdate && walletUpdate.latestWallet) {
      if (walletUpdate.currentVersion != walletUpdate.latestWallet.version
        && walletUpdate.currentVersionCode < walletUpdate.latestWallet.versionCode
        && !walletUpdate.ignore) {
        setOpenVersionModal(true);
      }
    }
  }, [walletUpdate])

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
      <VersionModal openVersionModal={openVersionModal} setOpenVersionModal={setOpenVersionModal} />
    </div>
  );
};

export default MenuComponent;
