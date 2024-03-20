
import { Alert, Col, Row, Typography, Card, Divider, Button, Tabs, TabsProps, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { message, Steps, theme } from 'antd';
import { useCallback, useEffect, useState } from "react";
import Safe3PrivateKey from "../../../utils/Safe3PrivateKey";
import Safe3Assets, { Safe3Asset } from "./Safe3Assets";
import { useMasternodeStorageContract, useSafe3Contract, useSupernodeStorageContract } from "../../../hooks/useContracts";
import { ZERO } from "../../../utils/CurrentAmountUtils";
import { ethers } from "ethers";
import {
  CloseCircleTwoTone,
  GlobalOutlined
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
  const masternodeContract = useMasternodeStorageContract();
  const supernodeContract = useSupernodeStorageContract();

  const [redeemTxHashs, setRedeemTxHashs] = useState<{
    avaiable?: TxExecuteStatus,
    locked?: TxExecuteStatus,
    masternode?: TxExecuteStatus
  }>();
  const [redeeming, setRedeeming] = useState<boolean>(false);

  useEffect(() => {
    setSafe3PrivateKey("XFwbwpghGT8w8uqwJmZQ4uPjiB61ZdPvcN165LDu2HttQjE8Z2KR")
  }, [])

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
    if (provider && safe3Contract && safe3Wallet && safe3Asset && masternodeContract && supernodeContract) {
      if (safe3Asset.masternode && safe3Asset.masternode.redeemHeight == 0) {
        if (!enode) {
          setInputErrors({
            ...inputErrors,
            encode: "需要输入 ENODE 来进行 Safe3 网络的主节点到 Safe4 网络的迁移"
          })
          return;
        }
        // 如果需要输入主节点迁移地址,则必须输入后，才能一键迁移资产
        const enodeRegex = /^enode:\/\/[0-9a-fA-F]{128}@(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+)$/;
        const isMatch = enodeRegex.test(enode);
        if (!isMatch) {
          setInputErrors({
            ...inputErrors,
            encode: "需要输入合法的 ENODE 来进行 Safe3 网络的主节点到 Safe4 网络的迁移"
          })
          return;
        }
        const enodeExistInMasternodes = await masternodeContract.callStatic.existEnode(enode);
        console.log("enode exist in mns ?? = " , enodeExistInMasternodes);
        const enodeExistInSupernodes  = await supernodeContract.callStatic.existEnode(enode);
        console.log("enode exist in sns ?? = " , enodeExistInSupernodes);
        if ( enodeExistInMasternodes || enodeExistInSupernodes ){
          setInputErrors({
            ...inputErrors,
            encode: "该ENODE已被使用"
          })
          return;
        }
      }


      const { safe3Address, availableSafe3Info, locked, masternode } = safe3Asset;
      const publicKey = "0x" + (safe3Wallet.safe3Address == safe3Address ? safe3Wallet.publicKey : safe3Wallet.compressPublicKey);
      const { privateKey } = safe3Wallet;
      const safe4Wallet = new ethers.Wallet(privateKey);
      const sha256Address = ethers.utils.sha256(ethers.utils.toUtf8Bytes(safe3Address));
      const signMsg = await safe4Wallet.signMessage(ethers.utils.arrayify(sha256Address));

      setRedeeming(true);
      let _redeemTxHashs = redeemTxHashs ?? {};
      // safe3 可用资产大于零,且没有被赎回.
      if (availableSafe3Info.amount.greaterThan(ZERO) && availableSafe3Info.redeemHeight == 0) {
        try {
          let response = await safe3Contract.redeemAvailable(
            ethers.utils.arrayify(publicKey),
            ethers.utils.arrayify(signMsg)
          );
          _redeemTxHashs.avaiable = {
            status: 1,
            txHash: response.hash
          }
          setRedeemTxHashs({ ..._redeemTxHashs });
        } catch (error) {
          console.log("redeem Available error >>", error)
        }
      }
      // safe3 锁仓资产大于零,且没有被赎回.
      if (locked.lockedNum > 0 && locked.redeemHeight == 0) {
        try {
          const transactionParameters = {
            to: safe3Contract.address,
            data: safe3Contract.interface.encodeFunctionData("redeemLocked", [
              ethers.utils.arrayify(publicKey),
              ethers.utils.arrayify(signMsg)
            ])
          };
          const gas = await provider.estimateGas(transactionParameters);
          console.log("gas ::", gas)
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
      if (safe3Asset.masternode && safe3Asset.masternode.redeemHeight == 0) {
        try {
          let response = await safe3Contract.redeemMasterNode(
            ethers.utils.arrayify(publicKey),
            ethers.utils.arrayify(signMsg),
            enode
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
  }, [provider, safe3Wallet, safe3Asset, safe3Contract, enode, masternodeContract, supernodeContract]);

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
                    <Text strong type="secondary">Safe4 钱包地址</Text>
                  </Col>
                  <Col span={24}>
                    <Text strong>{safe3Wallet?.safe4Address}</Text>
                    <Button onClick={() => {
                      window.open(`https://safe4.anwang.com/address/${safe3Wallet?.safe4Address}`)
                    }} style={{ marginLeft: "10px" }} size="small" icon={<GlobalOutlined />} />
                  </Col>
                  {
                    safe3Asset?.masternode && safe3Asset?.masternode?.redeemHeight == 0 &&
                    <>
                      <Col span={24} style={{ marginTop: "20px" }}>
                        <Text strong type="secondary">Safe4 主节点 ENODE</Text><br />
                      </Col>
                      <Col span={24}>
                        <Input.TextArea value={enode} onChange={(event) => {
                          setEncode(event.target.value);
                        }} />
                      </Col>
                      {
                        inputErrors?.encode && <>
                          <Col span={24}>
                            <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors?.encode} />
                          </Col>
                        </>
                      }
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
