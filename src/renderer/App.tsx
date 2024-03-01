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
              <Route path="/tools/web3" element={<TestMulticall />} />
              <Route path="/main/menu" element={<Menu />} />
            </Routes>
          </Col>
        </Row>

      </Router>
    </>
  );
}
