import { Button, Card, Col, Input, Row, Spin, Typography } from "antd"
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IPC_CHANNEL } from "../../config";
import { IndexSingal, Index_Methods } from "../../../main/handlers/IndexSingalHandler";
import { useDispatch } from "react-redux";
import { walletsLoadKeystores } from "../../state/wallets/action";
import { applicationDataUpdate } from "../../state/application/action";

export default () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const method = Index_Methods.load;
    window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [IndexSingal, 'load', []]);
    window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
      if (arg instanceof Array && arg[0] == IndexSingal && arg[1] == method) {
        const data = arg[2][0];
        const {
          walletKeystores ,
          nodeServerPath ,
          resourcePath,
        } = data;
        dispatch(applicationDataUpdate({nodeServerPath,resourcePath}));
        if ( walletKeystores.length == 0 ){
          navigate("/selectCreateWallet");
        }else{
          dispatch(walletsLoadKeystores(walletKeystores));
          navigate("/main/wallet")
        }
      }
    });
  }, []);

  return <Spin spinning={true} />
}
