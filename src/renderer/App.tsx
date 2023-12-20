import { MemoryRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import { Col, Row } from 'antd';
import MenuComponent from './pages/components/MenuComponent';
import Accounts from './pages/overviews/Accounts';
import Send from './pages/overviews/Send';

export default function App() {
  return (
    <Router>
        <Row>
          <Col span={4}>
            <MenuComponent />
          </Col>
          <Col span={20} style={{padding:"10px"}}>
            <Routes>
              <Route path="/" element={<Accounts />} />
              <Route path="/overviews/accounts" element={<Accounts />} />
              <Route path="/overviews/send" element={<Send />} />
            </Routes>
          </Col>
        </Row>
      </Router>
  );
}
