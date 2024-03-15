
import { Alert, Col, Row, Typography, Card, Divider, Button, Tabs, TabsProps, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { message, Steps, theme } from 'antd';
import { useCallback, useEffect, useState } from "react";
import Safe3PrivateKey from "../../../utils/Safe3PrivateKey";
import Safe3Assets, { Safe3Asset } from "./Safe3Assets";
import { useSafe3Contract } from "../../../hooks/useContracts";
import { ZERO } from "../../../utils/CurrentAmountUtils";
import { ethers } from "ethers";
import {
  CloseCircleTwoTone
} from '@ant-design/icons';
import { useWeb3Hooks } from "../../../connectors/hooks";

const { Text, Title } = Typography;

const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{52}$/;
const isSafe3DesktopExportPrivateKey = (input: string) => {
  return base58Regex.test(input);
};

const steps = [
  {
    title: '验证私钥',
    content: 'First-content',
  },
  {
    title: '资产迁移',
    content: 'Second-content',
  },
];

export interface TxExecuteStatus {
  txHash?: string,
  status: number,
  error?: any
}

export default () => {

  const { useProvider } = useWeb3Hooks();
  const provider = useProvider();
  const [current, setCurrent] = useState(0);
  const items = steps.map((item) => ({ key: item.title, title: item.title }));

  const [safe3PrivateKey, setSafe3PrivateKey] = useState<string>();
  const [enode, setEncode] = useState<string>();

  const [inputErrors, setInputErrors] = useState<{
    safe3PrivateKeyError?: string,
    encode?: string
  }>();

  const [safe3Wallet, setSafe3Wallet] = useState<{
    privateKey: string,
    publicKey: string,
    compressPublicKey: string,
    safe3Address: string,
    safe3CompressAddress: string,
    safe4Address: string
  }>();
  const [safe3Asset, setSafe3Asset] = useState<Safe3Asset>();
  const safe3Contract = useSafe3Contract(true);

  const [redeemTxHashs, setRedeemTxHashs] = useState<{
    avaiable?: TxExecuteStatus,
    locked?: TxExecuteStatus,
    masternode?: TxExecuteStatus
  }>();
  const [redeeming, setRedeeming] = useState<boolean>(false);

  useEffect(() => {
    // const result = Safe3PrivateKey("XJ2M1PbCAifB8W91hcHDEho18kA2ByB4Jdmi4XBHq5sNgtuEpXr4");
    console.log("safe3 private key >> :", safe3PrivateKey);
    if (safe3PrivateKey) {
      if (isSafe3DesktopExportPrivateKey(safe3PrivateKey)) {
        setInputErrors(undefined);
        setSafe3Wallet(
          Safe3PrivateKey(safe3PrivateKey)
        )
      } else {
        setInputErrors({
          ...inputErrors,
          safe3PrivateKeyError: "请输入从 Safe3 桌面钱包导出的私钥"
        })
        setSafe3Wallet(undefined);
      }
    } else {
      setInputErrors(undefined);
      setSafe3Wallet(undefined);
    }
  }, [safe3PrivateKey]);

  useEffect(() => {
    if (safe3Asset) {
      setCurrent(1)
    } else {
      setCurrent(0)
    }
  }, [safe3Asset]);

  const executeRedeem = useCallback(async () => {
    if (provider && safe3Contract && safe3Wallet && safe3Asset) {

      const { safe3Address, availableSafe3Info, lockedNum, specialSafe3Info } = safe3Asset;
      const publicKey = "0x" + (safe3Wallet.safe3Address == safe3Address ? safe3Wallet.publicKey : safe3Wallet.compressPublicKey);
      const { privateKey } = safe3Wallet;
      const safe4Wallet = new ethers.Wallet(privateKey);
      const sha256Address = ethers.utils.sha256(ethers.utils.toUtf8Bytes(safe3Address));
      const signMsg = await safe4Wallet.signMessage(ethers.utils.arrayify(sha256Address));

      console.log("safe3Wallet:", safe3Wallet);
      console.log("privateKey :", privateKey);
      console.log("publicKey  :", publicKey);
      console.log("address:", safe3Address);
      console.log("sha256_address:", sha256Address);
      console.log("signMsg    :", signMsg);
      setRedeeming(true);

      let _redeemTxHashs = redeemTxHashs ?? {};
      // safe3 可用资产大于零,且没有被赎回.
      if ( // availableSafe3Info?.amount.greaterThan(ZERO) &&
        true) {
        try {
          let response = await safe3Contract.redeemAvailable(
            ethers.utils.arrayify(publicKey),
            ethers.utils.arrayify(signMsg)
          );
          console.log("redeem avaialbe txhash:", response.hash)
          _redeemTxHashs.avaiable = {
            status: 1,
            txHash: response.hash
          }
          setRedeemTxHashs({ ..._redeemTxHashs })
        } catch (error) {
          console.log("redeem Available error >>", error)
        }
      }
      // safe3 锁仓资产大于零,且没有被赎回.
      if (lockedNum && lockedNum > 0) {
        try {
          const transactionParameters = {
            to: safe3Contract.address,
            data: safe3Contract.interface.encodeFunctionData("redeemLocked", [
              ethers.utils.arrayify(publicKey),
              ethers.utils.arrayify(signMsg)
            ])
          };
          const gas = await provider.estimateGas(transactionParameters);
          console.log("gas ::" , gas)
          let response = await safe3Contract.redeemLocked(
            ethers.utils.arrayify(publicKey),
            ethers.utils.arrayify(signMsg)
          );
          console.log("redeem lockeed txhash:", response.hash)
          _redeemTxHashs.locked = {
            status: 1,
            txHash: response.hash
          }
          setRedeemTxHashs({ ..._redeemTxHashs })
        } catch (error: any) {
          _redeemTxHashs.locked = {
            status: 0,
            error: error.toString()
          }
          setRedeemTxHashs({ ..._redeemTxHashs })
          console.log("redeem Locked error >>", error)
        }
      }
      // safe3 主节点
      if ( true
      ) {
        try {
          let response = await safe3Contract.redeemMasterNode(
            ethers.utils.arrayify(publicKey),
            ethers.utils.arrayify(signMsg),
            "enode://a7470f55fa1921b412eb66503d87857cb0840a65407c41016f10557ccd6bdf454bc38fa17629fd19ce66ca89445a92516b3f3f33ff7fed3f9ebdbdd2bb261358@10.0.1.164:30303"
          );
          _redeemTxHashs.masternode = {
            status: 1,
            txHash: response.hash
          }
          setRedeemTxHashs({ ..._redeemTxHashs });
        } catch (error: any) {
          _redeemTxHashs.masternode = {
            status: 0,
            error: error.toString()
          }
          setRedeemTxHashs({ ..._redeemTxHashs })
          console.log("redeem Masternode-Error:", error)
        }
      }
      setRedeeming(false);
    }
  }, [provider , safe3Wallet, safe3Asset, safe3Contract]);

  return (<>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          Safe3 资产迁移
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card>
          <Alert showIcon type="info" message={<>
            <Text>使用该页面输入钱包地址私钥将 Safe3 网络的资产迁移到 Safe4 网络</Text><br />
          </>} />
          <Steps style={{ marginTop: "20px" }} current={current} items={items} />
          <Row style={{ marginTop: "20px" }}>
            <Col span={24}>
              <Text strong type="secondary">Safe3 钱包私钥</Text>
            </Col>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Input size="large" onChange={(event) => {
                const value = event.target.value;
                if (isSafe3DesktopExportPrivateKey(value)) {
                  setSafe3PrivateKey(value);
                } else {
                  setSafe3PrivateKey(undefined);
                  setSafe3Asset(undefined);
                }
              }} onBlur={(event) => {
                const value = event.target.value;
                setSafe3PrivateKey(value);
              }} />
            </Col>
            {
              inputErrors && inputErrors.safe3PrivateKeyError && <>
                <Col span={24} style={{ marginTop: "5px" }}>
                  <Alert type="error" showIcon message={<>
                    {inputErrors.safe3PrivateKeyError}
                  </>} />
                </Col>
              </>
            }
            {
              safe3Wallet && <>
                <Divider />
                <Safe3Assets setSafe3Asset={setSafe3Asset} safe3Address={safe3Wallet?.safe3Address} safe3CompressAddress={safe3Wallet?.safe3CompressAddress} />
                <Divider />
                <Col span={24}>
                  <Alert type="info" showIcon message={<>
                    您在 Safe3 网络的资产将会迁移到该私钥对应的 Safe4 网络的钱包地址上
                  </>} />
                  <Col span={24} style={{ marginTop: "20px" }}>
                    <Text strong type="secondary">Safe4 钱包地址</Text><br />
                  </Col>
                  <Col span={24}>
                    <Text strong>{safe3Wallet?.safe4Address}</Text><br />
                  </Col>
                  {
                    safe3Asset?.specialSafe3Info &&
                    //safe3Asset?.specialSafe3Info.amount.greaterThan(ZERO) &&
                    safe3Asset?.specialSafe3Info.redeemHeight == 0 &&
                    <>
                      <Col span={24} style={{ marginTop: "20px" }}>
                        <Text strong type="secondary">Safe4 主节点 ENODE</Text><br />
                      </Col>
                      <Col span={24}>
                        <Input.TextArea value={enode} onChange={(event) => {
                          setEncode(event.target.value);
                        }} />
                      </Col>
                    </>
                  }

                  <Button
                    loading={redeeming}
                    disabled={safe3Asset && !redeemTxHashs ? false : true}
                    style={{ marginTop: "20px" }} type="primary"
                    onClick={() => {
                      executeRedeem();
                    }}>
                    迁移
                  </Button>
                  {
                    redeemTxHashs &&
                    <>
                      <Alert style={{ marginTop: "20px" }} type="success" message={<>
                        {
                          redeemTxHashs?.avaiable && <>
                            <Text type="secondary">可用余额迁移交易哈希</Text><br />
                            <Text strong>{redeemTxHashs.avaiable.txHash}</Text> <br />
                          </>
                        }
                        {
                          redeemTxHashs?.locked && <>
                            <Text type="secondary">锁仓余额迁移交易哈希</Text><br />
                            <Text strong>{redeemTxHashs.locked.txHash}</Text> <br />
                          </>
                        }
                        {
                          redeemTxHashs?.masternode && <>
                            {
                              redeemTxHashs.masternode.status == 1 && <>
                                <Text type="secondary">主节点迁移交易哈希</Text><br />
                                <Text strong>{redeemTxHashs.masternode.txHash}</Text> <br />
                              </>
                            }
                            {
                              redeemTxHashs.masternode.status == 0 && <>
                                <Text type="secondary">主节点迁移交易失败</Text><br />
                                <Text strong type="danger">
                                  <CloseCircleTwoTone twoToneColor="red" style={{ marginRight: "5px" }} />
                                  {redeemTxHashs.masternode.error}
                                </Text> <br />
                              </>
                            }
                          </>
                        }
                      </>} />
                    </>
                  }

                </Col>
              </>
            }
          </Row>

        </Card>
      </div>
    </div>
  </>)

}
