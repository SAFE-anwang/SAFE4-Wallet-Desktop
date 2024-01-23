import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { Col, Row } from 'antd';
import MenuComponent from './pages/components/MenuComponent';
import Index from './pages/index';
import SelectCreateWallet from './pages/wallet/SelectCreateWallet';
import SetPassword from './pages/wallet/SetPassword';
import CreateMnemonic from './pages/wallet/create/CreateMnemonic';
import WaitingWalletCreate from './pages/wallet/WaitingWalletCreate';
import { useApplicationActionAtCreateWallet } from './state/application/hooks';
import Wallet from './pages/main/wallets/Wallet';
import TestMulticall from './pages/main/tools/TestMulticall';
import Menu from './pages/main/menu';
import Supernodes from './pages/main/supernodes/Supernodes';
import Masternodes from './pages/main/masternodes/Masternodes';
import SupernodeDetail from './pages/main/supernodes/SupernodeDetail';
import SupernodeVote from './pages/main/supernodes/SupernodeVote';
import SupernodeCreate from './pages/main/supernodes/SupernodeCreate';
import SupernodeAppend from './pages/main/supernodes/SupernodeAppend';

export default function App() {

  const atCreateWallet = useApplicationActionAtCreateWallet();

  return (
    <>
      <Router>
        <Row style={{
        }}>
          {
            !atCreateWallet && <Col span={6} style={{
              position: "fixed",
              width: "200px"
            }}>
              <MenuComponent />
            </Col>
          }
          <Col span={18} style={{
            minWidth:"1000px",
            position: "fixed",
            overflowX: "auto",
            overflowY: "auto",
            top: "0",
            right: "0",
            bottom: "0",
            left : "200px",
            paddingLeft: "20px",
            paddingBottom: "20px",
          }}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/selectCreateWallet" element={<SelectCreateWallet />} />
              <Route path="/setPassword" element={<SetPassword />} />
              <Route path="/wallet/createMnemonic" element={<CreateMnemonic />} />
              <Route path="/waitingCreateWallet" element={<WaitingWalletCreate />} />
              <Route path="/main/wallet" element={<Wallet />} />
              <Route path="/main/supernodes" element={<Supernodes />} />
              <Route path="/main/supernodes/vote" element={<SupernodeVote />} />
              <Route path="/main/supernodes/append" element={<SupernodeAppend />} />
              <Route path="/main/supernodes/create" element={<SupernodeCreate />} />
              <Route path="/main/masternodes" element={<Masternodes />} />
              <Route path="/tools/web3" element={<TestMulticall />} />
              <Route path="/main/menu" element={<Menu />} />
            </Routes>
          </Col>
        </Row>

      </Router>
    </>
  );
}
