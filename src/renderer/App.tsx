import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { Button, Col, Row } from 'antd';
import MenuComponent from './pages/components/MenuComponent';
import Index from './pages/index';
import SelectCreateWallet from './pages/wallet/SelectCreateWallet';
import SetPassword from './pages/wallet/SetPassword';
import CreateMnemonic from './pages/wallet/create/CreateMnemonic';
import WaitingWalletCreate from './pages/wallet/WaitingWalletCreate';
import { useApplicationActionAtCreateWallet, useApplicationBlockchainWeb3Rpc } from './state/application/hooks';
import Wallet from './pages/main/wallets/Wallet';
import TestMulticall from './pages/main/tools/TestMulticall';
import Menu from './pages/main/menu';
import Supernodes from './pages/main/supernodes/Supernodes';
import Masternodes from './pages/main/masternodes/Masternodes';
import SupernodeVote from './pages/main/supernodes/Vote/SupernodeVote';
import SupernodeRegister from './pages/main/supernodes/Register/SupernodeRegister';
import SupernodeAppend from './pages/main/supernodes/Append/SupernodeAppend';
import MasternodeRegister from './pages/main/masternodes/Register/MasternodeRegister';
import MasternodeAppend from './pages/main/masternodes/Append/MasternodeAppend';
import GetTestCoin from './pages/gettestcoin/GetTestCoin';
import Proposals from './pages/main/proposals/Proposals';
import ProposalCreate from './pages/main/proposals/Create/ProposalCreate';
import ProposalVote from './pages/main/proposals/Vote/ProposalVote';
import ImportWallet from './pages/wallet/import/ImportWallet';
import WaitingWalletImport from './pages/wallet/WaitingWalletImport';
import Safe3 from './pages/main/safe3/Safe3';
import NetworkPage from './pages/main/menu/network/NetworkPage';
import Storage from './pages/main/menu/storage/Storage';
import { useEffect, useState } from 'react';

import { Web3ReactHooks, Web3ReactProvider, initializeConnector } from '@web3-react/core'
import { hooks as networkHooks, network, initializeConnect } from './connectors/network';
import LoopUpdate from './LoopUpdate';
import { Network } from '@web3-react/network';
import { useDispatch } from 'react-redux';
import { applicationUpdateWeb3Rpc } from './state/application/action';

export default function App() {
  const dispatch = useDispatch();
  const atCreateWallet = useApplicationActionAtCreateWallet();
  const web3Rpc = useApplicationBlockchainWeb3Rpc();
  const [activeWeb3Rpc, setActiveWeb3Rpc] = useState<{
    chainId: number,
    endpoint: string
  } | undefined>();
  const [connectors, setConnectors] = useState<[Network, Web3ReactHooks][] | undefined>();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    const { chainId, endpoint } = web3Rpc;
    if (chainId && endpoint) {
      if (endpoint != activeWeb3Rpc?.endpoint) {
        const conn = initializeConnect({
          [chainId]: [endpoint]
        })
        setConnectors([
          [conn[0] , conn[1]]
        ]);
        setActiveWeb3Rpc({
          chainId,
          endpoint
        })
      }
    }
  }, [web3Rpc]);

  const _Router = <>

    <Button onClick={() => {
      dispatch(applicationUpdateWeb3Rpc({
        chainId: 6666666,
        endpoint: "http://172.104.162.94:8545"
      }));
    }}>Safe4</Button>
    <Button onClick={() => {
      dispatch(applicationUpdateWeb3Rpc({
        chainId: 1,
        endpoint: "https://cloudflare-eth.com"
      }));
    }}>ETH</Button>

    <Router>
      <Row style={{
      }}>
        {
          !atCreateWallet && <Col span={6} style={{
            position: "fixed",
            width: "230px"
          }}>
            <MenuComponent />
          </Col>
        }
        <Col id='appContainer' span={18} style={{
          minWidth: "1200px",
          position: "fixed",
          overflowX: "auto",
          overflowY: "auto",
          top: "0",
          right: "0",
          bottom: "0",
          left: "235px",
          paddingLeft: "20px",
          paddingBottom: "20px",
        }}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/selectCreateWallet" element={<SelectCreateWallet />} />
            <Route path="/setPassword" element={<SetPassword />} />
            <Route path="/wallet/createMnemonic" element={<CreateMnemonic />} />
            <Route path="/wallet/importWallet" element={<ImportWallet />} />
            <Route path="/waitingCreateWallet" element={<WaitingWalletCreate />} />
            <Route path="/waitingImportWallet" element={<WaitingWalletImport />} />
            <Route path="/main/wallet" element={<Wallet />} />
            <Route path="/main/supernodes" element={<Supernodes />} />
            <Route path="/main/supernodes/vote" element={<SupernodeVote />} />
            <Route path="/main/supernodes/append" element={<SupernodeAppend />} />
            <Route path="/main/supernodes/create" element={<SupernodeRegister />} />
            <Route path="/main/masternodes" element={<Masternodes />} />
            <Route path="/main/masternodes/register" element={<MasternodeRegister />} />
            <Route path="/main/masternodes/append" element={<MasternodeAppend />} />
            <Route path="/main/proposals" element={<Proposals />} />
            <Route path="/main/proposals/create" element={<ProposalCreate />} />
            <Route path="/main/proposals/vote" element={<ProposalVote />} />
            <Route path="/main/gettestcoin" element={<GetTestCoin />} />
            <Route path="/main/safe3" element={<Safe3 />} />
            <Route path="/tools/web3" element={<TestMulticall />} />
            <Route path="/main/menu" element={<Menu />} />
            <Route path="/main/menu/storage" element={<Storage />} />
            <Route path="/main/menu/network" element={<NetworkPage />} />
          </Routes>
        </Col>
      </Row>
    </Router>
  </>

  return (
    <>
      {
        !loading && connectors && <>
          <Web3ReactProvider key={activeWeb3Rpc?.endpoint} connectors={connectors}>
            <LoopUpdate />
            { _Router }
          </Web3ReactProvider>
        </>
      }
    </>
  );
}
