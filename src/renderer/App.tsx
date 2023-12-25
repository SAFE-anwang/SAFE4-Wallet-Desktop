import { MemoryRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import { Col, Row } from 'antd';
import MenuComponent from './pages/components/MenuComponent';
import Accounts from './pages/main/Accounts';
import Index from './pages/index';
import SelectCreateWallet from './pages/wallet/SelectCreateWallet';
import SetPassword from './pages/wallet/SetPassword';
import CreateMnemonic from './pages/wallet/create/CreateMnemonic';
import WaitingWalletCreate from './pages/wallet/WaitingWalletCreate';
import { useAtCreateWallet } from './state/application/hooks';

export default function App() {

  const atCreateWallet = useAtCreateWallet();
  const left = atCreateWallet ? "50px" : "300px";

  return (
    <>
      <Router>
        <Row style={{
        }}>
          {
            !atCreateWallet && <Col span={6} style={{
              position: "fixed",
              width: "300px"
            }}>
              <MenuComponent />
            </Col>
          }
          <Col span={18} style={{
            position: "fixed",
            overflowX: "auto",
            overflowY: "auto",
            top: "0",
            right: "0",
            bottom: "0",
            left,
            paddingLeft: "20px",
            paddingBottom: "20px"
          }}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/selectCreateWallet" element={<SelectCreateWallet />} />
              <Route path="/setPassword" element={<SetPassword />} />
              <Route path="/wallet/createMnemonic" element={<CreateMnemonic />} />
              <Route path="/waitingCreateWallet" element={<WaitingWalletCreate />} />
              <Route path="/main/wallet" element={<Accounts />} />
            </Routes>
          </Col>
        </Row>

      </Router>
    </>
  );
}
