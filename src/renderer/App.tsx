import { MemoryRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import { Col, Row } from 'antd';
import MenuComponent from './pages/components/MenuComponent';
import Accounts from './pages/overviews/Accounts';
import Send from './pages/overviews/Send';
import SysInfo from './pages/settings/SysInfo';
import Index from './pages/index';
import SelectCreateWallet from './pages/wallet/SelectCreateWallet';
import SetPassword from './pages/wallet/SetPassword';
import CreateMnemonic from './pages/wallet/create/CreateMnemonic';
import WaitingWalletCreate from './pages/wallet/WaitingWalletCreate';

export default function App() {

  const isCreateWallet = true;

  return (
    <>
      {
        isCreateWallet &&
        <div style={{
          margin:"auto",
          paddingTop:"5%",
          width:"800px"
        }}>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/selectCreateWallet" element={<SelectCreateWallet />} />
              <Route path="/setPassword" element={<SetPassword />} />
              <Route path="/wallet/createMnemonic" element={<CreateMnemonic />} />
              <Route path="/waitingCreateWallet" element={<WaitingWalletCreate />} />

              <Route path="/main/" element={<Accounts />} />

            </Routes>
          </Router>
        </div>
      }
      {
        !isCreateWallet &&
        <Router>
          <Row>
            <Col span={4}>
              <MenuComponent />
            </Col>
            <Col span={20} style={{ padding: "10px" }}>
              <Routes>
                <Route path="/" element={<Accounts />} />
                <Route path="/overviews/accounts" element={<Accounts />} />
                <Route path="/overviews/send" element={<Send />} />
                <Route path="/settings/sysInfo" element={<SysInfo />} />
              </Routes>
            </Col>
          </Row>
        </Router>
      }
    </>
  );
}
