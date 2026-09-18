import { ArrowLeftOutlined, ArrowRightOutlined, HomeOutlined, LeftOutlined, ReloadOutlined, RightOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Col, Divider, Drawer, Form, Input, message, Row, Typography } from "antd"
import { useEffect, useRef, useState } from "react";
import DAppRequestDrawer from "./DAppRequestDrawer";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useWeb3React } from "@web3-react/core";
import BlockchainNetwork from "../../components/BlockchainNetwork";
import AddressComponent from "../../components/AddressComponent";
import { WalletState } from "../../../../main/preload-dapp";
import DAppIndex from "./DAppIndex";
import { useDAppBlockchainRpcProps } from "../../../state/dApp/hooks";

export default () => {

  // https://dapp-at.opensky.vip
  // https://pancakeswap.finance/swap
  // https://lmb-dapp.anwang.com
  const [dAppURL, setDAppURL] = useState<string | undefined>(undefined);
  const [dAppViewOpened, setDAppViewOpened] = useState(false);
  const activeAccount = useWalletsActiveAccount();
  const chainId = useWeb3React().chainId;
  const activeAccountRef = useRef(activeAccount);
  const chainIdRef = useRef(chainId);
  const [dAppWalletState, setDAppWalletState] = useState<WalletState | undefined>();
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const dAppBlockchainRpcProps = useDAppBlockchainRpcProps();


  useEffect(() => {
    activeAccountRef.current = activeAccount;
    chainIdRef.current = chainId;
  }, [activeAccount, chainId]);

  useEffect(() => {
    return () => {
      window.electron.dapp.closeView();
    }
  }, []);

  useEffect(() => {
    // 定义Dapp 钱包初始化监听器
    const handleWalletStateInitialize = (data: any) => {
      const { requestId, origin } = data;
      window.electron.dapp.response(
        requestId,
        true,
        {
          activeAccount: activeAccountRef.current,
          chainId: chainIdRef.current,
          rpc: chainIdRef.current ? dAppBlockchainRpcProps[chainIdRef.current].rpcUrls[0] : null
        }
      );
    };
    // 定义 Dapp 导航状态监听器
    const handleDappNavigationState = (data: any) => {
      const { canGoBack, canGoForward, url } = data;
      setDAppViewOpened(true);
      setCanGoBack(canGoBack);
      setCanGoForward(canGoForward);
      setDAppURL(url);
    }
    const handleDAppWalletStateSync = (data: { origin: string, dAppWalletState: WalletState }) => {
      setDAppWalletState(data.dAppWalletState);
    }
    // 注册监听器
    const cleanup_walletStateInit = window.electron.dapp.onWalletStateInitialize(handleWalletStateInitialize);
    const cleanup_dappViewNavigation = window.electron.dapp.onNavigationState(handleDappNavigationState);
    const cleanup_walletStateSync = window.electron.dapp.onWalletStateSync(handleDAppWalletStateSync);
    return () => {
      if (cleanup_walletStateInit) {
        cleanup_walletStateInit();
      }
      if (cleanup_dappViewNavigation) {
        cleanup_dappViewNavigation();
      }
      if (cleanup_walletStateSync) {
        cleanup_walletStateSync();
      }
    }
  }, []);

  useEffect(() => {
    if (activeAccount) {
      window.electron.ipcRenderer.sendMessage('dapp-wallet-change', [{
        method: "accountsChanged",
        accounts: [activeAccount]
      }])
    }
  }, [activeAccount]);

  const openDAppURL = () => {
    if (dAppURL) {
      if (dAppURL.startsWith("https://")) {
        setDAppViewOpened(true);
        window.electron.dapp.openView(dAppURL);
        setDAppWalletState(undefined);
      } else {
        message.error("不支持访问非 Https 协议的应用地址");
        return;
      }
    }
  }

  const goHome = () => {
    setDAppURL(undefined);
    setDAppViewOpened(false);
    setDAppWalletState(undefined);
    window.electron.dapp.closeView();
  }
  const goBack = () => {
    window.electron.dapp.goBack();
  };
  const goForward = () => {
    window.electron.dapp.goForward();
  };
  const reload = () => {
    window.electron.dapp.reload();
  };

  return <>
    <Row style={{ marginTop: "20px" }}>
      <Col span={24}>
        <Button onClick={goHome} style={{ float: "left", marginRight: "10px" }} shape="circle" icon={<HomeOutlined />} />
        <Button onClick={goBack} disabled={!canGoBack} style={{ float: "left", marginRight: "10px" }} shape="circle" icon={<ArrowLeftOutlined />} />
        <Button onClick={goForward} disabled={!canGoForward} style={{ float: "left", marginRight: "10px" }} shape="circle" icon={<ArrowRightOutlined />} />
        <Button onClick={reload} disabled={dAppURL == undefined} style={{ float: "left", marginRight: "10px" }} shape="circle" icon={<ReloadOutlined />} />
        <div style={{ float: "left", width: "40%" }}>
          <Form>
            <Input.Search onSearch={openDAppURL} value={dAppURL} placeholder="输入Dapp应用访问地址" onChange={(e) => {
              setDAppURL(e.target.value);
            }} />
            <Button style={{ display: "none" }} htmlType='submit' onClick={openDAppURL}></Button>
          </Form>
        </div>

        {
          dAppWalletState && dAppWalletState.accounts && dAppWalletState.accounts.length > 0 && <>
            <div style={{ float: "left", marginTop: "4px", marginLeft: "10px" }}>
              {
                dAppWalletState && dAppWalletState.chainId && <BlockchainNetwork chainId={dAppWalletState.chainId} size="small" />
              }
            </div>
            <Divider type="vertical" style={{ float: "left", marginTop: "10px" }} />
            <div style={{ float: "left", marginTop: "4px", marginLeft: "10px", width: "18%" }}>
              {
                dAppWalletState && dAppWalletState.accounts && dAppWalletState.accounts.length > 0 && <AddressComponent ellipsis address={dAppWalletState.accounts[0]} />
              }
            </div>
          </>
        }

      </Col>
    </Row>
    <DAppRequestDrawer />
    {
      !dAppViewOpened && <DAppIndex />
    }
  </>

}
