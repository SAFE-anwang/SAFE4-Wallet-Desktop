import { Button, Card, Col, Input, Row, Spin, Typography } from "antd"
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IPC_CHANNEL } from "../../config";
import { IndexSingal } from "../../../main/handlers/IndexSingalHandler";
import { useDispatch } from "react-redux";
import { Wallets_Load_Keystores } from "../../state/wallets/action";
import { useWalletsList } from "../../state/wallets/hooks";

const { Text } = Typography;

export default () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const method = "load";
    window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [IndexSingal, 'load', []]);
    window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
      if (arg instanceof Array && arg[0] == IndexSingal && arg[1] == method) {
        const data = arg[2][0];
        const {
          walletKeystores
        } = data;
        console.log( "Index load => "  , walletKeystores )
        if ( walletKeystores.length == 0 ){
          navigate("/selectCreateWallet")
        }else{
          dispatch(Wallets_Load_Keystores(walletKeystores));
          navigate("/main/wallet")
        }
      }
    });
  }, [])
  return <Spin spinning={true} />
}
