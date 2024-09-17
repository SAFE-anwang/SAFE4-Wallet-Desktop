import { CurrencyAmount } from "@uniswap/sdk";
import { Alert, Button, Col, Divider, Flex, Input, Row, Statistic, Typography } from "antd"
import { ethers } from "ethers";
import { useCallback, useMemo, useState } from "react";
import { useSafe3Contract } from "../../../hooks/useContracts";
import { useETHBalances, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import Safe3PrivateKey, { generateRedeemSign } from "../../../utils/Safe3PrivateKey";
import { AddressPrivateKeyMap } from "./BatchRedeemStep1";
import { Safe3QueryResult, Safe3RedeemStatistic } from "./BatchRedeemStep2";

const { Text } = Typography;
const redeemNeedAmount = "0.01";

export default ({
    addressPrivateKeyMap, safe3RedeemList, safe3RedeemStatistic
}: {
    safe3RedeemList: Safe3QueryResult[],
    safe3RedeemStatistic: Safe3RedeemStatistic,
    addressPrivateKeyMap: AddressPrivateKeyMap
}) => {

    const activeAccount = useWalletsActiveAccount();
    const balance = useETHBalances([activeAccount])[activeAccount];
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

    const executeRedeem = useCallback(async () => {
        if (safe3Contract) {
            const addressArr = safe3RedeemList.map(safe3Redeem => safe3Redeem.address);
            const publicKeyArr: Uint8Array[] = [];
            const signMsgArr: Uint8Array[] = [];

            const avaialbePromises = addressArr.map(async address => {
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
            const results = await Promise.all(avaialbePromises)
            results.forEach(({ publicKey, signMsg }) => {
                publicKeyArr.push(publicKey);
                signMsgArr.push(signMsg);
            });
            try {
                console.log(publicKeyArr.length)
                let response = await safe3Contract.batchRedeemAvailable(
                    publicKeyArr,
                    signMsgArr,
                    safe4TargetAddress
                );
                console.log("redeem response >>", response)
            } catch (error: any) {

            }
        }
    }, [safe4TargetAddress, safe3RedeemList, addressPrivateKeyMap, safe3Contract])

    return <>

        {JSON.stringify(safe3RedeemList)}

        <Row style={{ marginTop: "20px" }}>
            <Col span={6}>
                <Statistic value={safe3RedeemStatistic.addressCount} title="待迁移资产地址总数" />
            </Col>
            <Col span={6}>
                <Statistic value={safe3RedeemStatistic.totalAvailable.toFixed(2)} title="待迁移总可用资产" />
            </Col>
            <Col span={6}>
                <Statistic value={safe3RedeemStatistic.totalLocked.toFixed(2)} title="待迁移总锁仓资产" />
            </Col>
            <Col span={6}>
                <Statistic value={safe3RedeemStatistic.totalMasternodes} title="待迁移主节点数量" />
            </Col>
        </Row>
        <Divider />
        <Row>
            <Col span={24}>
                <Alert type="info" showIcon message={<>
                    默认使用当前钱包地址来接收迁移资产
                </>} />
            </Col>
            <Col span={24} style={{ marginTop: "20px" }}>
                <Text type="secondary">Safe4 钱包地址</Text>
            </Col>
            <Col span={24}>
                <Input size="large" status={warningSafe4TargetAddress ? "warning" : ""} value={safe4TargetAddress} onChange={(event) => {
                    const input = event.target.value.trim();
                    if (!ethers.utils.isAddress(input)) {
                        setInputErrors({
                            ...inputErrors,
                            safe4TargetAddress: "请输入合法的Safe4钱包地址"
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
                            safe4TargetAddress: "请输入合法的Safe4钱包地址"
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
                                您输入的资产接收地址并不是当前钱包地址，请仔细确认该地址是否为您期望用于接收资产的地址.
                            </>} />
                    </>
                }
            </Col>
        </Row>
        <Divider />
        <Button type="primary" onClick={executeRedeem}>迁移</Button>
    </>
}