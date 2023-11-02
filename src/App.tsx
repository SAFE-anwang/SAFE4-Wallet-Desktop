import React from "react";
import {Layout} from "antd";
import {AppMenu} from "./components/AppMenu";
import {AppSider} from "./components/AppSider";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {OverviewPage} from "./components/pages/OverviewPage";
import {SendPage} from "./components/pages/SendPage";
import {TransactionPage} from "./components/pages/TransactionPage";
import {ReceivePage} from "./components/pages/ReceivePage";
import {MasterNodePage} from "./components/pages/MasterNodePage";
import {SuperNodePage} from "./components/pages/SuperNodePage";
import {ProposalPage} from "./components/pages/ProposalPage";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <AppMenu/>
        <Layout>
          <AppSider/>
          <Routes>
            <Route path={"/"} element={<OverviewPage/>}/>
            <Route path={"/send"} element={<SendPage/>}/>
            <Route path={"/receive"} element={<ReceivePage/>}/>
            <Route path={"/transaction"} element={<TransactionPage/>}/>
            <Route path={"/masternode"} element={<MasterNodePage/>}/>
            <Route path={"/supernode"} element={<SuperNodePage/>}/>
            <Route path={"/proposal"} element={<ProposalPage/>}/>
          </Routes>
        </Layout>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
