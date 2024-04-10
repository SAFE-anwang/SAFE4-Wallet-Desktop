
import { Row, Col } from 'antd';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useApplicationActionAtCreateWallet } from '../state/application/hooks';
import MenuComponent from './components/MenuComponent';
import GetTestCoin from './gettestcoin/GetTestCoin';
import Index from './index';
import MasternodeAppend from './main/masternodes/Append/MasternodeAppend';
import Masternodes from './main/masternodes/Masternodes';
import MasternodeRegister from './main/masternodes/Register/MasternodeRegister';
import Menu from './main/menu';
import NetworkPage from './main/menu/network/NetworkPage';
import Storage from './main/menu/storage/Storage';
import ProposalCreate from './main/proposals/Create/ProposalCreate';
import Proposals from './main/proposals/Proposals';
import ProposalVote from './main/proposals/Vote/ProposalVote';
import Safe3 from './main/safe3/Safe3';
import SupernodeAppend from './main/supernodes/Append/SupernodeAppend';
import SupernodeRegister from './main/supernodes/Register/SupernodeRegister';
import Supernodes from './main/supernodes/Supernodes';
import SupernodeVote from './main/supernodes/Vote/SupernodeVote';
import Test from './main/tools/Test';
import Wallet from './main/wallets/Wallet';
import CreateMnemonic from './wallet/create/CreateMnemonic';
import ImportWallet from './wallet/import/ImportWallet';
import SelectCreateWallet from './wallet/SelectCreateWallet';
import SetPassword from './wallet/SetPassword';
import WaitingWalletCreate from './wallet/WaitingWalletCreate';
import WaitingWalletImport from './wallet/WaitingWalletImport';
export default () => {
    const atCreateWallet = useApplicationActionAtCreateWallet();
    return <>
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
                        <Route path="/main/test" element={<Test />} />
                        <Route path="/main/menu" element={<Menu />} />
                        <Route path="/main/menu/storage" element={<Storage />} />
                        <Route path="/main/menu/network" element={<NetworkPage />} />
                    </Routes>
                </Col>
            </Row>
        </Router>
    </>

}
