import { Alert, Button, Card, Col, Image, Input, Row, Spin, Typography } from 'antd';
import { useApplicationBlockchainWeb3Rpc } from './state/application/hooks';
import { useCallback, useEffect, useState } from 'react';
import { Web3ReactHooks, Web3ReactProvider } from '@web3-react/core'
import { initializeConnect } from './connectors/network';
import LoopUpdate from './LoopUpdate';
import { Network } from '@web3-react/network';
import { useDispatch } from 'react-redux';
import AppRouters from './pages/AppRouters';
import { IndexSingal, Index_Methods } from '../main/handlers/IndexSingalHandler';
import config, { IPC_CHANNEL } from './config';
import { applicationDataLoaded, applicationSetPassword, applicationUpdateWeb3Rpc } from './state/application/action';
import { walletsLoadKeystores } from './state/wallets/action';
import SAFE_LOGO from './assets/logo/SAFE.png'
const CryptoJS = require('crypto-js');

const { Text } = Typography;

export default function App() {

  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(true);

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
  const [dbRpcConfigs, setDbRpcConfigs] = useState<{
    chainId: number,
    endpoint: string,
    active: number
  }[]>();

  useEffect(() => {
    if (!loading && dbRpcConfigs) {
      console.log("[App.tsx] load rpc-configs :" , dbRpcConfigs);
      const activeRpcConfig = dbRpcConfigs.find(rpcConfig => rpcConfig.active == 1);
      const endpoint = activeRpcConfig ? activeRpcConfig.endpoint : config.Default_Web3_Endpoint;
      const chainId = activeRpcConfig ? activeRpcConfig.chainId : config.Default_Web3_ChainId;
      dispatch(applicationUpdateWeb3Rpc({
        chainId: chainId,
        endpoint: endpoint
      }));
    }
  }, [loading, dbRpcConfigs]);
  useEffect(() => {
    if (web3Rpc) {
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
    }
  }, [web3Rpc]);

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
          rpc_configs
        } = data;
        setDbRpcConfigs(rpc_configs.map((rpc_config: any) => {
          const { id, chain_id, endpoint, active } = rpc_config;
          return {
            chainId: chain_id,
            endpoint,
            active
          }
        }));
        dispatch(applicationDataLoaded({
          path
        }));
        if (encrypt) {
          setEncrypt(encrypt);
        } else {
          setWalletKeystores(walletKeystores);
        }
        setLoading(false);
      }
    });
  }, []);



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
        console.log("decrypt error:", err);
        setPasswordError("输入正确的密码才能打开本地加密文件");
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
        loading && <Spin fullscreen spinning={loading} />
      }

      {
        !loading && !walletsKeystores && encrypt && <>
          <Row style={{ marginTop: "20%" }}>
            <Card style={{ width: "400px", margin: "auto", boxShadow: "5px 5px 10px #888888" }}>
              <Row>
                <Col span={24} style={{ textAlign: "center" }}>
                  <Image preview={false} style={{ marginTop: "10px", width: "80%" }} src={SAFE_LOGO} />
                </Col>
                <Col span={24} style={{ textAlign: "center", marginTop: "10px" }}>
                  <Text style={{ fontSize: "28px" }}>Safe4</Text>
                </Col>
                <Col span={24} style={{ textAlign: "center", marginTop: "10px" }}>
                  <Text type='secondary' style={{ fontSize: "18px" }}>即将进入去中心化网络</Text>
                </Col>
                <Col span={24} style={{ marginTop: "20px" }}>
                  <Input.Password size='large' onChange={(event) => {
                    setPassword(event.target.value);
                    setPasswordError(undefined);
                  }} placeholder='输入密码' />
                  {
                    passwordError && <>
                      <Alert style={{ marginTop: "5px" }} type='error' showIcon message={passwordError} />
                    </>
                  }
                </Col>
                <Button disabled={password ? false : true} onClick={decrypt} type='primary' size='large' style={{ width: "100%", marginTop: "20px" }}>
                  解锁
                </Button>
              </Row>
            </Card>
          </Row>
        </>
      }

      {
        !loading && walletsKeystores && connectors && <>
          <Web3ReactProvider key={activeWeb3Rpc?.endpoint} connectors={connectors}>
            <LoopUpdate />
            <AppRouters />
          </Web3ReactProvider>
        </>
      }

    </>
  );
}
