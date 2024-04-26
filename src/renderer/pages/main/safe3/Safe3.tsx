
import { Alert, Col, Row, Typography, Card, Divider, Button, Input } from "antd";
import { Steps } from 'antd';
import { useCallback, useEffect, useMemo, useState } from "react";
import Safe3PrivateKey from "../../../utils/Safe3PrivateKey";
import { useMasternodeStorageContract, useSafe3Contract, useSupernodeStorageContract } from "../../../hooks/useContracts";
import { ZERO } from "../../../utils/CurrentAmountUtils";
import { ethers } from "ethers";
import {
  CloseCircleTwoTone,
  GlobalOutlined
} from '@ant-design/icons';
import { useETHBalances, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { CurrencyAmount } from "@uniswap/sdk";
import Safe3AssetRender, { Safe3Asset } from "./Safe3AssetRender";

const { Text, Title } = Typography;

const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{52}$/;
const safe3AddressBase58Regex = /^X[a-zA-Z0-9]{33}$/;
const redeemNeedAmount = "0.01";

const isSafe3DesktopExportPrivateKey = (input: string) => {
  return base58Regex.test(input);
};
const isSafe3Address = (input: string) => {
  return safe3AddressBase58Regex.test(input);
}

const steps = [
  {
    title: '资产查询',
    content: 'First-content',
  },
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

  const [current, setCurrent] = useState(0);
  const items = steps.map((item) => ({ key: item.title, title: item.title }));

  const [safe3Address, setSafe3Address] = useState<string>();
  const [safe3PrivateKey, setSafe3PrivateKey] = useState<string>();
  const [enode, setEncode] = useState<string>();

  const [inputErrors, setInputErrors] = useState<{
    safe3PrivateKeyError?: string,
    encode?: string,
    safe3Address?: string
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

  const activeAccount = useWalletsActiveAccount();
  const balance = useETHBalances([activeAccount])[activeAccount];

  const [redeemTxHashs, setRedeemTxHashs] = useState<{
    avaiable?: TxExecuteStatus,
    locked?: TxExecuteStatus,
    masternode?: TxExecuteStatus
  }>();
  const [redeeming, setRedeeming] = useState<boolean>(false);

  // useEffect(() => {
  // XeT5MPR5BH6i2Z66XHRXqRjVFs3iAp4Rco
  //   setSafe3PrivateKey("XFwbwpghGT8w8uqwJmZQ4uPjiB61ZdPvcN165LDu2HttQjE8Z2KR")
  // }, []);

  const notEnough = useMemo(() => {
    const needAmount = CurrencyAmount.ether(ethers.utils.parseEther(redeemNeedAmount).toBigInt());
    if (!balance) {
      return false;
    }
    return needAmount.greaterThan(balance);
  }, [activeAccount, balance]);

  const redeemEnable = useMemo(() => {
    if (!safe3Asset) {
      return false;
    }
    if (!safe3Wallet){
      return false;
    }
    if (notEnough) {
      return false;
    }
    const avaiable = safe3Asset.availableSafe3Info.amount.greaterThan(ZERO) &&
      safe3Asset.availableSafe3Info.redeemHeight == 0;
    const locked = safe3Asset.locked.txLockedAmount.greaterThan(ZERO) && safe3Asset.locked.redeemHeight == 0;
    const masternode = safe3Asset.masternode && safe3Asset.masternode.redeemHeight == 0;
    return avaiable || locked || masternode;
  }, [safe3Asset, safe3Wallet , notEnough]);

  useEffect(() => {
    setSafe3Asset(undefined);
    setSafe3PrivateKey(undefined);
    setInputErrors(undefined);
    if (safe3Address) {
      if (isSafe3Address(safe3Address)) {
        // 合法的地址.
      } else {
        setInputErrors({
          ...inputErrors,
          safe3Address: "请输入正确的Safe3钱包地址"
        });
      }
    }
  }, [safe3Address]);

  useEffect(() => {
    setSafe3Wallet(undefined);
    setRedeemTxHashs(undefined);
    setEncode(undefined);
    const safe3Address = safe3Asset?.safe3Address;
    if (safe3PrivateKey && safe3Address) {
      setInputErrors({
        ...inputErrors,
        safe3PrivateKeyError: undefined
      });
      if (isSafe3DesktopExportPrivateKey(safe3PrivateKey)) {
        const safe3Wallet = Safe3PrivateKey(safe3PrivateKey);
        if (safe3Wallet.safe3Address == safe3Address || safe3Wallet.safe3CompressAddress == safe3Address) {
          setSafe3Wallet(safe3Wallet);
        } else {
          setInputErrors( {
            ...inputErrors,
            safe3PrivateKeyError: "私钥与钱包地址不匹配"
          } );
        }
      } else {
        setInputErrors({
          ...inputErrors,
          safe3PrivateKeyError: "请输入从 Safe3 桌面钱包导出的私钥"
        });
      }
    }
  }, [safe3PrivateKey,safe3Asset]);

  useEffect(() => {
    if (safe3Asset) {
      if (safe3Wallet) {
        setCurrent(2)
      } else {
        setCurrent(1)
      }
    } else {
      setCurrent(0)
    }
  }, [safe3Asset, safe3Wallet]);

  const executeRedeem = useCallback(async () => {
    if (safe3Contract && safe3Wallet && safe3Asset && masternodeContract && supernodeContract) {
      if (safe3Asset.masternode && safe3Asset.masternode.redeemHeight != 0) {
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
        const enodeExistInSupernodes = await supernodeContract.callStatic.existEnode(enode);
        if (enodeExistInMasternodes || enodeExistInSupernodes) {
          setInputErrors({
            ...inputErrors,
            encode: "该ENODE已被使用"
          })
          return;
        }
        setInputErrors(undefined);
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
      if (
        availableSafe3Info.redeemHeight == 0 &&
        availableSafe3Info.amount.greaterThan(ZERO)
      ) {
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
          console.log("执行迁移可用资产Hash:", response.hash);
        } catch (error: any) {
          _redeemTxHashs.avaiable = {
            status: 0,
            error: error.error.reason
          }
          setRedeemTxHashs({ ..._redeemTxHashs })
          console.log("执行迁移可用资产错误,Error:", error.error.reason);
        }
      } else {
        console.log("无需执行迁移可用资产");
      }

      // safe3 锁仓资产大于零,且没有被赎回.
      if (
        locked.redeemHeight == 0 &&
        locked.txLockedAmount.greaterThan(ZERO)
      ) {
        try {
          let response = await safe3Contract.redeemLocked(
            ethers.utils.arrayify(publicKey),
            ethers.utils.arrayify(signMsg)
          );
          console.log("redeem lockeed txhash:", response.hash)
          _redeemTxHashs.locked = {
            status: 1,
            txHash: response.hash
          }
          setRedeemTxHashs({ ..._redeemTxHashs });
          console.log("执行迁移锁定资产Hash:", response.hash);
        } catch (error: any) {
          _redeemTxHashs.locked = {
            status: 0,
            error: error.toString()
          }
          setRedeemTxHashs({ ..._redeemTxHashs })
          console.log("执行迁移锁定资产错误,Error:", error);
        }
      } else {
        console.log("无需执行迁移锁定资产.")
      }

      // safe3 主节点
      if (
        safe3Asset.masternode
        && safe3Asset.masternode.redeemHeight == 0
      ) {
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
          console.log("执行迁移主节点Hash:", response.hash);
        } catch (error: any) {
          _redeemTxHashs.masternode = {
            status: 0,
            error: error.toString()
          }
          setRedeemTxHashs({ ..._redeemTxHashs })
          console.log("执行迁移主节点错误,Error:", error)
        }
      } else {
        console.log("无需执行迁移主节点.")
      }
      setRedeeming(false);
    }
  }, [ safe3Wallet, safe3Asset, safe3Contract, enode, masternodeContract, supernodeContract]);

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
            <Text>将 Safe3 网络的资产迁移到 Safe4 网络 (当前测试使用 Safe3 网络 2024年之前的资产快照)</Text><br />
          </>} />
          <Steps style={{ marginTop: "20px" }} current={current} items={items} />
          <Row style={{ marginTop: "20px" }}>

            {/****************** Safe3 钱包地址 *********************/}
            <Col span={24}>
              <Text strong type="secondary">Safe3 钱包地址</Text>
            </Col>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Input disabled={redeeming} size="large" onChange={(event) => {
                setInputErrors({
                  ...inputErrors,
                  safe3Address: undefined
                });
                setSafe3Address(undefined);
                const value = event.target.value.trim();
                if (isSafe3Address(value)) {
                  setSafe3Address(value);
                }
              }} onBlur={(event) => {
                const value = event.target.value.trim();
                setSafe3Address(value);
              }} />
            </Col>
            {
              inputErrors && inputErrors.safe3Address && <>
                <Col span={24} style={{ marginTop: "5px" }}>
                  <Alert type="error" showIcon message={<>
                    {inputErrors.safe3Address}
                  </>} />
                </Col>
              </>
            }
            {
              safe3Address && isSafe3Address(safe3Address) && <>
                <Col span={24} style={{marginTop:"5px"}}>
                  <Safe3AssetRender safe3Address={safe3Address} setSafe3Asset={setSafe3Asset} />
                </Col>
              </>
            }
            {/****************** Safe3 钱包地址 *********************/}

            {/****************** Safe3 地址私钥 *********************/}
            {
              safe3Asset && <>
                <Divider />
                <Col span={24}>
                  <Text strong type="secondary">Safe3 钱包私钥</Text>
                </Col>
                <Col span={24} style={{ marginTop: "5px" }}>
                  <Input placeholder="输入钱包私钥" 
                    disabled={redeeming} size="large" onChange={(event) => {
                    const value = event.target.value;
                    if (isSafe3DesktopExportPrivateKey(value)) {
                      setSafe3PrivateKey(value);
                    } else {
                      setSafe3PrivateKey(undefined);
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
                {/****************** Safe3 地址私钥 *********************/}
              </>
            }

            {
              safe3Wallet && <>
                <Divider />
                <Col span={24}>
                  <Alert type="info" showIcon message={<>
                    Safe3 网络的资产将会迁移到该私钥对应的 Safe4 网络的钱包地址上
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
                    safe3Asset?.masternode
                      && safe3Asset.masternode.redeemHeight == 0
                      &&
                    <>
                      <Col span={24} style={{ marginTop: "20px" }}>
                        <Text strong type="secondary">Safe4 主节点 ENODE</Text><br />
                      </Col>
                      <Col span={24}>
                        <Input.TextArea disabled={redeeming} value={enode} onChange={(event) => {
                          setEncode(event.target.value);
                          setInputErrors({
                            ...inputErrors,
                            encode: undefined
                          })
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
                  <Divider />
                  <Button
                    loading={redeeming}
                    disabled={redeemEnable && !redeemTxHashs ? false : true}
                    style={{ marginTop: "20px" }} type="primary"
                    onClick={() => {
                      console.log("try do execute redeem..")
                      executeRedeem();
                    }}>
                    迁移
                  </Button>
                  {
                    notEnough && <>
                      <Alert style={{ marginTop: "5px" }} showIcon type="error" message={
                        <>
                          当前正在使用的钱包没有 SAFE 来支付迁移资产所需要支付的手续费。
                        </>
                      } />
                    </>
                  }
                  {
                    redeemTxHashs &&
                    <>
                      <Alert style={{ marginTop: "20px" }} type="success" message={<>
                        {
                          redeemTxHashs?.avaiable && <>
                            {
                              redeemTxHashs.avaiable.status == 1 && <>
                                <Text type="secondary">可用余额迁移交易哈希</Text><br />
                                <Text strong>{redeemTxHashs.avaiable.txHash}</Text> <br />
                              </>
                            }
                            {
                              redeemTxHashs.avaiable.status == 0 && <>
                                <Text type="secondary">可用余额迁移交易失败</Text><br />
                                <Text strong type="danger">
                                  <CloseCircleTwoTone twoToneColor="red" style={{ marginRight: "5px" }} />
                                  {redeemTxHashs.avaiable.error}
                                </Text> <br />
                              </>
                            }
                          </>
                        }
                        {
                          redeemTxHashs?.locked && <>
                            {
                              redeemTxHashs.locked.status == 1 && <>
                                <Text type="secondary">锁仓余额迁移交易哈希</Text><br />
                                <Text strong>{redeemTxHashs.locked.txHash}</Text> <br />
                              </>
                            }
                            {
                              redeemTxHashs.locked.status == 0 && <>
                                <Text type="secondary">锁仓余额迁移交易失败</Text><br />
                                <Text strong type="danger">
                                  <CloseCircleTwoTone twoToneColor="red" style={{ marginRight: "5px" }} />
                                  {redeemTxHashs.locked.error}
                                </Text> <br />
                              </>
                            }
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
