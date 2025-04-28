
import { Alert, Col, Row, Typography, Card, Divider, Button, Input } from "antd";
import { Steps } from 'antd';
import { useCallback, useEffect, useMemo, useState } from "react";
import Safe3PrivateKey, { generateRedeemSign } from "../../../utils/Safe3PrivateKey";
import { useMasternodeStorageContract, useSafe3Contract, useSupernodeStorageContract } from "../../../hooks/useContracts";
import { ZERO } from "../../../utils/CurrentAmountUtils";
import { ethers } from "ethers";
import {
  CloseCircleTwoTone,
} from '@ant-design/icons';
import { useETHBalances, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { CurrencyAmount } from "@uniswap/sdk";
import Safe3AssetRender, { Safe3Asset } from "./Safe3AssetRender";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import { useTranslation } from "react-i18next";

const { Text, Title } = Typography;

const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{52}$/;
const evmPrivateRegex = /^(0x)?[0-9a-fA-F]{64}$/;
const safe3AddressBase58Regex = /^X[a-zA-Z0-9]{33}$/;
const redeemNeedAmount = "0.005";

export const Redeem_Locked_MAX = 100;

const isSafe3DesktopExportPrivateKey = (input: string) => {
  return base58Regex.test(input);
};
const isEVMPrivateKey = (input: string) => {
  return evmPrivateRegex.test(input)
}

const isSafe3Address = (input: string) => {
  return safe3AddressBase58Regex.test(input);
}

export interface TxExecuteStatus {
  txHash?: string,
  status: number,
  error?: any
}

export default () => {

  const { t } = useTranslation();
  const activeAccount = useWalletsActiveAccount();
  const [current, setCurrent] = useState(0);

  const addTransaction = useTransactionAdder();

  const [safe3Address, setSafe3Address] = useState<string>();
  const [safe3PrivateKey, setSafe3PrivateKey] = useState<string>();
  const [safe4TargetAddress, setSafe4TargetAddress] = useState<string>(activeAccount);

  const steps = [
    {
      title: t("wallet_redeems_single_step0"),
    },
    {
      title: t("wallet_redeems_single_step1"),
    },
    {
      title: t("wallet_redeems_single_step2"),
    },
  ];
  const items = steps.map((item) => ({ key: item.title, title: item.title }));

  const [inputErrors, setInputErrors] = useState<{
    safe3PrivateKeyError?: string,
    safe3Address?: string,
    safe4TargetAddress?: string
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
  const balance = useETHBalances([activeAccount])[activeAccount];
  const [redeemTxHashs, setRedeemTxHashs] = useState<{
    avaiable?: TxExecuteStatus,
    locked: TxExecuteStatus[],
    masternode?: TxExecuteStatus
  }>();
  const [redeeming, setRedeeming] = useState<boolean>(false);

  const notEnough = useMemo(() => {
    const needAmount = CurrencyAmount.ether(ethers.utils.parseEther(redeemNeedAmount).toBigInt());
    if (!balance) {
      return false;
    }
    return needAmount.greaterThan(balance);
  }, [activeAccount, balance]);

  const warningSafe4TargetAddress = useMemo(() => {
    return activeAccount != safe4TargetAddress;
  }, [activeAccount, safe4TargetAddress]);

  const redeemEnable = useMemo(() => {
    if (inputErrors?.safe3Address || inputErrors?.safe3PrivateKeyError || inputErrors?.safe4TargetAddress) {
      return false;
    }
    if (!safe3Asset) {
      return false;
    }
    if (!safe3Wallet) {
      return false;
    }
    if (notEnough) {
      return false;
    }
    const avaiable = safe3Asset.availableSafe3Info.amount.greaterThan(ZERO)
      && safe3Asset.availableSafe3Info.redeemHeight == 0;
    const locked = safe3Asset.locked.unredeem.amount.greaterThan(ZERO)
      && safe3Asset.locked.unredeem.count > 0;
    const masternode = safe3Asset.masternode
      && safe3Asset.masternode.redeemHeight == 0;
    return avaiable || locked || masternode;
  }, [safe3Asset, safe3Wallet, notEnough, inputErrors]);

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
          safe3Address: t("enter_correct") + t("wallet_redeems_safe3_address")
        });
      }
    }
  }, [safe3Address]);

  useEffect(() => {
    setSafe3Wallet(undefined);
    setRedeemTxHashs(undefined);
    setFinished(false);
    const safe3Address = safe3Asset?.safe3Address;
    if (safe3PrivateKey && safe3Address) {
      setInputErrors({
        ...inputErrors,
        safe3PrivateKeyError: undefined
      });
      if (isSafe3DesktopExportPrivateKey(safe3PrivateKey) || isEVMPrivateKey(safe3PrivateKey)) {
        const safe3Wallet = Safe3PrivateKey(safe3PrivateKey);
        if (safe3Wallet.safe3Address == safe3Address || safe3Wallet.safe3CompressAddress == safe3Address) {
          setSafe3Wallet(safe3Wallet);
        } else {
          setInputErrors({
            ...inputErrors,
            safe3PrivateKeyError: t("wallet_redeems_safe3_privatekey_notmatch")
          });
        }
      } else {
        setInputErrors({
          ...inputErrors,
          safe3PrivateKeyError: t("wallet_redeems_safe3_privatekey_enterfromsafe3wallet")
        });
      }
    }
  }, [safe3PrivateKey, safe3Asset]);

  useEffect(() => {
    // 当用户切换用户时 , 将所有输入重置;
    setSafe3Address(undefined);
    setSafe3PrivateKey(undefined);
    setSafe4TargetAddress(activeAccount);
  }, [activeAccount]);

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

  const [finished, setFinished] = useState<boolean>(false);

  const executeRedeem = useCallback(async () => {
    if (safe4TargetAddress && safe3Wallet && safe3Asset && masternodeContract && supernodeContract && safe3Contract) {
      if (!ethers.utils.isAddress(safe4TargetAddress)) {
        return;
      }
      const { safe3Address, availableSafe3Info, locked } = safe3Asset;
      const publicKey = "0x" + (safe3Wallet.safe3Address == safe3Address ? safe3Wallet.publicKey : safe3Wallet.compressPublicKey);
      const { privateKey } = safe3Wallet;
      const signMsg = await generateRedeemSign(privateKey, safe3Address, safe4TargetAddress);
      setRedeeming(true);
      let _redeemTxHashs = redeemTxHashs ?? { locked: [] };
      // safe3 可用资产大于零,且没有被赎回.
      if (
        availableSafe3Info.redeemHeight == 0 &&
        availableSafe3Info.amount.greaterThan(ZERO)
      ) {
        try {
          let response = await safe3Contract.batchRedeemAvailable(
            [ethers.utils.arrayify(publicKey)],
            [ethers.utils.arrayify(signMsg)],
            safe4TargetAddress
          );
          _redeemTxHashs.avaiable = {
            status: 1,
            txHash: response.hash
          }
          setRedeemTxHashs({ ..._redeemTxHashs });
          addTransaction({ to: safe3Contract.address }, response, {
            call: {
              from: activeAccount,
              to: safe3Contract.address,
              input: response.data,
              value: "0"
            }
          });
          console.log("执行迁移可用资产Hash:", response.hash);
        } catch (error: any) {
          _redeemTxHashs.avaiable = {
            status: 0,
            error: error.toString()
          }
          setRedeemTxHashs({ ..._redeemTxHashs })
          console.log("执行迁移可用资产错误,Error:", error.error.reason);
          return;
        }
      } else {
        console.log("无需执行迁移可用资产");
      }
      // safe3 锁仓资产大于零,且没有被赎回.
      if (
        locked.unredeem.count > 0 &&
        locked.unredeem.amount.greaterThan(ZERO)
      ) {
        try {
          const unredeemCount = locked.unredeem.count;
          const needRedeemTime = Math.ceil(unredeemCount / Redeem_Locked_MAX);
          console.log("Need Redeem Time :", needRedeemTime);
          for (let i = 0; i < needRedeemTime; i++) {

            const estimateGas = await safe3Contract.estimateGas.batchRedeemLocked(
              [ethers.utils.arrayify(publicKey)],
              [ethers.utils.arrayify(signMsg)],
              safe4TargetAddress
            );
            const gasLimit = estimateGas.mul(2);
            let response = await safe3Contract.batchRedeemLocked(
              [ethers.utils.arrayify(publicKey)],
              [ethers.utils.arrayify(signMsg)],
              safe4TargetAddress,
              { gasLimit }
            );
            console.log(`redeem lockeed txhash:${i}`, response.hash)
            _redeemTxHashs.locked?.push({
              status: 1,
              txHash: response.hash
            });
            setRedeemTxHashs({ ..._redeemTxHashs });
            addTransaction({ to: safe3Contract.address }, response, {
              call: {
                from: activeAccount,
                to: safe3Contract.address,
                input: response.data,
                value: "0"
              }
            });
            console.log("执行迁移锁定资产Hash:", response.hash);
          }
        } catch (error: any) {
          _redeemTxHashs.locked?.push({
            status: 0,
            error: error.toString()
          });
          setRedeemTxHashs({ ..._redeemTxHashs });
          console.log("执行迁移锁定资产错误,Error:", error);
          return;
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
          let response = await safe3Contract.batchRedeemMasterNode(
            [ethers.utils.arrayify(publicKey)],
            [ethers.utils.arrayify(signMsg)],
            [""],
            safe4TargetAddress
          );
          _redeemTxHashs.masternode = {
            status: 1,
            txHash: response.hash
          }
          setRedeemTxHashs({ ..._redeemTxHashs });
          addTransaction({ to: safe3Contract.address }, response, {
            call: {
              from: activeAccount,
              to: safe3Contract.address,
              input: response.data,
              value: "0"
            }
          });
          console.log("执行迁移主节点Hash:", response.hash);
        } catch (error: any) {
          _redeemTxHashs.masternode = {
            status: 0,
            error: error.toString()
          }
          setRedeemTxHashs({ ..._redeemTxHashs })
          console.log("执行迁移主节点错误,Error:", error)
          return;
        }
      } else {
        console.log("无需执行迁移主节点.")
      }
      setRedeeming(false);
      setFinished(true);
    }
  }, [safe3Wallet, safe3Asset, safe4TargetAddress, safe3Contract, masternodeContract, supernodeContract]);

  return (<>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          {t("safe3AssetRedeem")}
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card>
          <Alert showIcon type="info" message={<>
            <Text>{t("wallet_redeems_tip0")}</Text><br />
            <Text>{t("wallet_redeems_tip1")}</Text><br />
          </>} />
          <Steps style={{ marginTop: "20px" }} current={current} items={items} />
          <Row style={{ marginTop: "20px" }}>
            {/****************** Safe3 钱包地址 *********************/}
            <Col span={24}>
              <Text strong type="secondary">{t("wallet_redeems_safe3_address")}</Text>
            </Col>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Input value={safe3Address} disabled={redeeming} size="large" onChange={(event) => {
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
                <Col span={24} style={{ marginTop: "5px" }}>
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
                  <Text strong type="secondary">{t("wallet_redeems_safe3_privatekey")}</Text>
                </Col>
                <Col span={24} style={{ marginTop: "5px" }}>
                  <Input placeholder={t("enter") + t("wallet_redeems_safe3_privatekey")}
                    value={safe3PrivateKey}
                    disabled={redeeming} size="large" onChange={(event) => {
                      const value = event.target.value;
                      if (isSafe3DesktopExportPrivateKey(value) || isEVMPrivateKey(value)) {
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
                    {t("wallet_redeems_safe4_address_tip")}
                  </>} />
                  <Col span={24} style={{ marginTop: "20px" }}>
                    <Text strong type="secondary">{t("wallet_redeems_safe4_address")}</Text>
                  </Col>
                  <Col span={24}>
                    <Input disabled={redeeming} size="large"
                      status={warningSafe4TargetAddress ? "warning" : ""} value={safe4TargetAddress} onChange={(event) => {
                        const input = event.target.value.trim();
                        if (!ethers.utils.isAddress(input)) {
                          setInputErrors({
                            ...inputErrors,
                            safe4TargetAddress: t("enter_correct") + t("wallet_redeems_safe4_address")
                          })
                        } else {
                          setInputErrors({
                            ...inputErrors,
                            safe4TargetAddress: undefined
                          })
                        }
                        setSafe4TargetAddress(input);
                      }} onBlur={(event) => {
                        const input = event.target.value.trim();
                        if (!ethers.utils.isAddress(input)) {
                          setInputErrors({
                            ...inputErrors,
                            safe4TargetAddress: t("enter_correct") + t("wallet_redeems_safe4_address")
                          })
                        } else {
                          setInputErrors({
                            ...inputErrors,
                            safe4TargetAddress: undefined
                          })
                        }
                        setSafe4TargetAddress(input);
                      }} />
                    {
                      inputErrors?.safe4TargetAddress && <>
                        <Alert style={{ marginTop: "5px" }} type="error"
                          showIcon message={inputErrors?.safe4TargetAddress} />
                      </>
                    }
                    {
                      !inputErrors?.safe4TargetAddress && warningSafe4TargetAddress && <>
                        <Alert style={{ marginTop: "5px" }} type="warning"
                          showIcon message={<>
                            {t("wallet_redeems_safe4_address_warning")}
                          </>} />
                      </>
                    }
                  </Col>
                  <Divider />

                  {
                    notEnough && <>
                      <Alert style={{ marginBottom: "5px" }} showIcon type="error" message={
                        <>
                          {t("wallet_redeems_notenough")}
                        </>
                      } />
                    </>
                  }
                  {
                    !finished && <Button
                      loading={redeeming}
                      disabled={redeemEnable && !redeemTxHashs ? false : true}
                      style={{ marginTop: "5px" }} type="primary"
                      onClick={() => {
                        executeRedeem();
                      }}>
                      {t("wallet_redeems_button")}
                    </Button>
                  }
                  {
                    finished &&
                    <Row>
                      <Col span={24}>
                        <Alert type="success" showIcon message={t("finished")} />
                      </Col>
                    </Row>
                  }
                  {
                    redeemTxHashs &&
                    <>
                      <Alert style={{ marginTop: "20px" }} type="success" message={<>
                        {
                          redeemTxHashs?.avaiable && <>
                            {
                              redeemTxHashs.avaiable.status == 1 && <>
                                <Text type="secondary">{t("wallet_redeems_available_txhash")}</Text><br />
                                <Text strong>{redeemTxHashs.avaiable.txHash}</Text> <br />
                              </>
                            }
                            {
                              redeemTxHashs.avaiable.status == 0 && <>
                                <Text type="secondary">{t("wallet_redeems_available_error")}</Text><br />
                                <Text strong type="danger">
                                  <CloseCircleTwoTone twoToneColor="red" style={{ marginRight: "5px" }} />
                                  {redeemTxHashs.avaiable.error}
                                </Text> <br />
                              </>
                            }
                          </>
                        }
                        {
                          redeemTxHashs.locked && redeemTxHashs.locked.map((locked) => {
                            return <>
                              {
                                locked.status == 1 && <Row key={locked.txHash}>
                                  <Col span={24}>
                                    <Text type="secondary">{t("wallet_redeems_locked_txhash")}</Text><br />
                                    <Text strong>{locked.txHash}</Text> <br />
                                  </Col>
                                </Row>
                              }
                              {
                                locked.status == 0 && <Row>
                                  <Col span={24}>
                                    <Text type="secondary">{t("wallet_redeems_locked_error")}</Text><br />
                                    <Text strong type="danger">
                                      <CloseCircleTwoTone twoToneColor="red" style={{ marginRight: "5px" }} />
                                      {locked.error}
                                    </Text> <br />
                                  </Col>
                                </Row>
                              }
                            </>
                          })
                        }
                        {
                          redeemTxHashs?.masternode && <>
                            {
                              redeemTxHashs.masternode.status == 1 && <>
                                <Text type="secondary">{t("wallet_redeems_masternode_txhash")}</Text><br />
                                <Text strong>{redeemTxHashs.masternode.txHash}</Text> <br />
                              </>
                            }
                            {
                              redeemTxHashs.masternode.status == 0 && <>
                                <Text type="secondary">{t("wallet_redeems_masternode_error")}</Text><br />
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
