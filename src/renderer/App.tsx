import { Button, Card, Col, Input, Row } from 'antd';
import { useApplicationBlockchainWeb3Rpc } from './state/application/hooks';
import { useCallback, useEffect, useState } from 'react';
import { Web3ReactHooks, Web3ReactProvider } from '@web3-react/core'
import { hooks as networkHooks, network, initializeConnect } from './connectors/network';
import LoopUpdate from './LoopUpdate';
import { Network } from '@web3-react/network';
import { useDispatch } from 'react-redux';
import AppRouters from './pages/AppRouters';
import { IndexSingal, Index_Methods } from '../main/handlers/IndexSingalHandler';
import { IPC_CHANNEL } from './config';
import { applicationDataLoaded, applicationSetPassword } from './state/application/action';
import { walletsLoadKeystores } from './state/wallets/action';
const CryptoJS = require('crypto-js');

export default function App() {
  const dispatch = useDispatch();

  const [walletsKeystores, setWalletKeystores] = useState();
  const [encrypt, setEncrypt] = useState<{
    salt: string,
    iv: string,
    ciphertext: string
  }>();
  const [password, setPassword] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();

  const web3Rpc = useApplicationBlockchainWeb3Rpc();
  const [activeWeb3Rpc, setActiveWeb3Rpc] = useState<{
    chainId: number,
    endpoint: string
  } | undefined>();
  const [connectors, setConnectors] = useState<[Network, Web3ReactHooks][] | undefined>();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const method = Index_Methods.load;
    window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [IndexSingal, 'load', []]);
    window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
      if (arg instanceof Array && arg[0] == IndexSingal && arg[1] == method) {
        const data = arg[2][0];
        const {
          walletKeystores,
          path,
          encrypt,
        } = data;
        dispatch(applicationDataLoaded({
          path
        }));
        if (encrypt) {
          setEncrypt(encrypt);
          return;
        }
        setWalletKeystores(walletKeystores);
      }
    });
  }, []);

  useEffect(() => {
    const { chainId, endpoint } = web3Rpc;
    if (chainId && endpoint) {
      if (endpoint != activeWeb3Rpc?.endpoint) {
        const conn = initializeConnect({
          [chainId]: [endpoint]
        })
        setConnectors([
          [conn[0], conn[1]]
        ]);
        setActiveWeb3Rpc({
          chainId,
          endpoint
        })
      }
    }
  }, [web3Rpc]);

  const decrypt = useCallback(() => {
    if (password && encrypt) {
      const salt = CryptoJS.enc.Hex.parse(encrypt.salt);
      const ciphertext = CryptoJS.enc.Hex.parse(encrypt.ciphertext);
      const iv = CryptoJS.enc.Hex.parse(encrypt.iv);
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 1024,
        hasher: CryptoJS.algo.SHA256
      });
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext },
        key,
        { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
      );
      try {
        const text = decrypted.toString(CryptoJS.enc.Utf8);
        const walletKeystores = JSON.parse(text);
        setWalletKeystores(walletKeystores);
        dispatch(applicationSetPassword(password));
      } catch (err) {
        console.log("decrypt error:", err)
      }
    }
  }, [password, encrypt]);

  useEffect(() => {
    if (walletsKeystores) {
      dispatch(walletsLoadKeystores(walletsKeystores));
    }
  }, [walletsKeystores]);
  
  return (
    <>
      {
        !walletsKeystores && <>
          <Row style={{ marginTop: "100px" }}>
            <Card style={{ width: "50%", margin: "auto" }}>
              <Input.Password onChange={(event) => {
                setPassword(event.target.value)
              }} />
              <Button onClick={decrypt} type='primary' size='large' style={{ width: "100%", marginTop: "20px" }}>
                确认
              </Button>
            </Card>
          </Row>
        </>
      }
      {
        walletsKeystores && connectors && <>
          <Web3ReactProvider key={activeWeb3Rpc?.endpoint} connectors={connectors}>
            <LoopUpdate />
            <AppRouters />
          </Web3ReactProvider>
        </>
      }
    </>
  );
}
