import { CurrencyAmount } from "@uniswap/sdk";
import { Alert, Button, Col, Divider, Flex, Input, Row, Statistic, Typography } from "antd"
import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSafe3Contract } from "../../../hooks/useContracts";
import { useETHBalances, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import Safe3PrivateKey, { generateRedeemSign } from "../../../utils/Safe3PrivateKey";
import { AddressPrivateKeyMap } from "./BatchRedeemStep1";
import { Safe3QueryResult, Safe3RedeemStatistic } from "./BatchRedeemStep2";
import { TxExecuteStatus } from "../safe3/Safe3";
import { CloseCircleTwoTone } from "@ant-design/icons";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import { useTranslation } from "react-i18next";

const { Text } = Typography;
const redeemNeedAmount = "0.005";

export default ({
  addressPrivateKeyMap, safe3RedeemList, safe3RedeemStatistic
}: {
  safe3RedeemList: Safe3QueryResult[],
  safe3RedeemStatistic: Safe3RedeemStatistic,
  addressPrivateKeyMap: AddressPrivateKeyMap
}) => {
  const { t } = useTranslation();
  const activeAccount = useWalletsActiveAccount();
  const balance = useETHBalances([activeAccount])[activeAccount];
  const addTransaction = useTransactionAdder();
  const [inputErrors, setInputErrors] = useState<{
    safe4TargetAddress?: string
  }>();
  const notEnough = useMemo(() => {
    const needAmount = CurrencyAmount.ether(ethers.utils.parseEther(redeemNeedAmount).toBigInt());
    if (!balance) {
      return false;
    }
    return needAmount.greaterThan(balance);
  }, [activeAccount, balance]);

  const [safe4TargetAddress, setSafe4TargetAddress] = useState<string>(activeAccount);
  const warningSafe4TargetAddress = useMemo(() => {
    return activeAccount != safe4TargetAddress;
  }, [activeAccount, safe4TargetAddress]);
  const safe3Contract = useSafe3Contract();
  const [redeemTxHashs, setRedeemTxHashs] = useState<{
    avaiable?: TxExecuteStatus,
    locked?: TxExecuteStatus,
    masternode?: TxExecuteStatus
  }>();
  const [redeeming, setRedeeming] = useState<boolean>(false);

  useEffect(() => {
    setSafe4TargetAddress(activeAccount)
  }, [activeAccount])

  const executeRedeem = useCallback(async () => {
    if (safe3Contract) {

      const addressArr = safe3RedeemList.map(safe3Redeem => safe3Redeem.address);
      const publicKeyArr: Uint8Array[] = [];
      const signMsgArr: Uint8Array[] = [];

      const encodePromises = addressArr.map(async address => {
        const base58PrivateKey = addressPrivateKeyMap[address].privateKey;
        const safe3Wallet = Safe3PrivateKey(base58PrivateKey);
        const privateKey = safe3Wallet.privateKey;
        const publicKey = "0x" + (safe3Wallet.safe3Address == address ? safe3Wallet.publicKey : safe3Wallet.compressPublicKey);
        const signMsg = await generateRedeemSign(privateKey, address, safe4TargetAddress);
        return {
          publicKey: ethers.utils.arrayify(publicKey),
          signMsg: ethers.utils.arrayify(signMsg),
        };
      })

      setRedeeming(true);
      const results = await Promise.all(encodePromises);
      results.forEach(({ publicKey, signMsg }) => {
        publicKeyArr.push(publicKey);
        signMsgArr.push(signMsg);
      });
      let _redeemTxHashs = redeemTxHashs ?? {};
      try {
        let response = await safe3Contract.batchRedeemAvailable(
          publicKeyArr,
          signMsgArr,
          safe4TargetAddress
        );
        _redeemTxHashs.avaiable = {
          status: 1,
          txHash: response.hash
        }
        setRedeemTxHashs({ ..._redeemTxHashs });
        console.log("执行迁移可用资产Hash:", response.hash);
        const { data } = response;
        addTransaction({ to: safe3Contract.address }, response, {
          call: {
            from: activeAccount,
            to: safe3Contract.address,
            input: data,
            value: "0"
          }
        });
      } catch (error: any) {
        _redeemTxHashs.avaiable = {
          status: 0,
          error: error.error.reason
        }
        setRedeemTxHashs({ ..._redeemTxHashs })
        console.log("执行迁移可用资产错误,Error:", error.error.reason);
      }
      try {
        let response = await safe3Contract.batchRedeemLocked(
          publicKeyArr,
          signMsgArr,
          safe4TargetAddress
        );
        _redeemTxHashs.locked = {
          status: 1,
          txHash: response.hash
        }
        setRedeemTxHashs({ ..._redeemTxHashs });
        console.log("执行迁移锁定资产Hash:", response.hash);
        const { data } = response;
        addTransaction({ to: safe3Contract.address }, response, {
          call: {
            from: activeAccount,
            to: safe3Contract.address,
            input: data,
            value: "0"
          }
        });
      } catch (error: any) {
        _redeemTxHashs.locked = {
          status: 0,
          error: error.error.reason
        }
        setRedeemTxHashs({ ..._redeemTxHashs })
        console.log("执行迁移锁定资产错误,Error:", error);
      }

      try {
        let response = await safe3Contract.batchRedeemMasterNode(
          publicKeyArr,
          signMsgArr,
          // 做一个等长的空值enode数组;
          publicKeyArr.map(uint8array => ""),
          safe4TargetAddress
        );
        _redeemTxHashs.masternode = {
          status: 1,
          txHash: response.hash
        }
        setRedeemTxHashs({ ..._redeemTxHashs });
        console.log("执行迁移主节点Hash:", response.hash);
        const { data } = response;
        addTransaction({ to: safe3Contract.address }, response, {
          call: {
            from: activeAccount,
            to: safe3Contract.address,
            input: data,
            value: "0"
          }
        });
      } catch (error: any) {
        _redeemTxHashs.masternode = {
          status: 0,
          error: error.error.reason
        }
        setRedeemTxHashs({ ..._redeemTxHashs })
        console.log("执行迁移主节点错误,Error:", error)
      }
      setRedeeming(false);
    }
  }, [safe4TargetAddress, safe3RedeemList, addressPrivateKeyMap, safe3Contract])

  return <>
    <Row style={{ marginTop: "20px" }}>
      <Col span={6}>
        <Statistic value={safe3RedeemStatistic.addressCount} title={t("wallet_redeems_batch_totalwaitaddrcount")} />
      </Col>
      <Col span={6}>
        <Statistic value={safe3RedeemStatistic.totalAvailable.toFixed(2)} title={t("wallet_redeems_batch_totalwaitavailable")} />
      </Col>
      <Col span={6}>
        <Statistic value={safe3RedeemStatistic.totalLocked.toFixed(2)} title={t("wallet_redeems_batch_totalwaitlocked")} />
      </Col>
      <Col span={6}>
        <Statistic value={safe3RedeemStatistic.totalMasternodes} title={t("wallet_redeems_batch_totalwaitmasternode")} />
      </Col>
    </Row>
    <Divider />
    <Row>
      <Col span={24}>
        <Alert type="info" showIcon message={<>
          {t("wallet_redeems_safe4_address_tip")}
        </>} />
      </Col>
      <Col span={24} style={{ marginTop: "20px" }}>
        <Text type="secondary">{t("wallet_redeems_safe4_address")}</Text>
      </Col>
      <Col span={24}>
        <Input size="large" status={warningSafe4TargetAddress ? "warning" : ""} value={safe4TargetAddress} onChange={(event) => {
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
    </Row>
    <Divider />
    {
      redeemTxHashs &&
      <>
        <Alert style={{ marginTop: "20px", marginBottom: "20px" }} type="success" message={<>
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
            redeemTxHashs?.locked && <>
              {
                redeemTxHashs.locked.status == 1 && <>
                  <Text type="secondary">{t("wallet_redeems_locked_txhash")}</Text><br />
                  <Text strong>{redeemTxHashs.locked.txHash}</Text> <br />
                </>
              }
              {
                redeemTxHashs.locked.status == 0 && <>
                  <Text type="secondary">{t("wallet_redeems_locked_error")}</Text><br />
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

    {
      notEnough && <>
        <Alert style={{ marginBottom: "5px" }} showIcon type="error" message={
          <>
            {t("wallet_redeems_notenough")}
          </>
        } />
      </>
    }
    <Button type="primary" loading={redeeming} disabled={notEnough || redeemTxHashs != undefined} onClick={executeRedeem}>{t("wallet_redeems_button")}</Button>


  </>
}
