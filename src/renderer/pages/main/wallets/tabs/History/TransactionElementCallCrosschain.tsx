import { LoadingOutlined } from "@ant-design/icons";
import { Avatar, List, Spin, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { SAFE_LOGO, USDT_LOGO } from "../../../../../assets/logo/AssetsLogo";
import { getNetworkLogoByCoin, getNetworkNameByCoin, NetworkCoinType } from "../../../../../assets/logo/NetworkLogo";
import { TransactionDetails } from "../../../../../state/transactions/reducer"
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import EtherAmount from "../../../../../utils/EtherAmount";

const { Text } = Typography;

const enum CrosschainDirectoinType {
    SEND = 1,
    RECEIVE = 2
}

export default ({ transaction, setClickTransaction, support }: {
    transaction: TransactionDetails,
    setClickTransaction: (transaction: TransactionDetails) => void,
    support: {
        supportFuncName: string,
        inputDecodeResult: any
    }
}) => {
    const { t } = useTranslation();
    const {
        status,
        call,
        tokenTransfers,
    } = transaction;
    const { from, to, value } = call ? call : {
        from: null, to: null, value: null
    };
    const activeAccount = useWalletsActiveAccount();
    const crosschainDirectoinType = from == activeAccount ? CrosschainDirectoinType.SEND : CrosschainDirectoinType.RECEIVE;
    // TODO 
    const networkCoin = support.supportFuncName.substring(0, support.supportFuncName.indexOf("2"));
    const RenderLogosCrossDirectoin = () => {
        const NETWORK_LOGO = getNetworkLogoByCoin(networkCoin as NetworkCoinType)
        if (crosschainDirectoinType == CrosschainDirectoinType.SEND) {
            return <>
                <Avatar style={{ marginTop: "8px" }} src={USDT_LOGO} />
                <Avatar style={{ marginTop: "8px", marginLeft: "-15px" }} src={NETWORK_LOGO} />
            </>
        } else {
            return <>
                <Avatar style={{ marginTop: "8px" }} src={NETWORK_LOGO} />
                <Avatar style={{ marginTop: "8px", marginLeft: "-15px" }} src={USDT_LOGO} />
            </>
        }
    }

    return <>
        {
            <Text>{JSON.stringify(support)}</Text>
        }
        <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
            <List.Item.Meta
                avatar={
                    <>
                        <span>
                            {
                                !status && <Spin indicator={<LoadingOutlined style={{ fontSize: "34px", marginLeft: "-17px", marginTop: "-14px" }} />} >
                                    {RenderLogosCrossDirectoin()}
                                </Spin>
                            }
                            {
                                status && <>
                                    {RenderLogosCrossDirectoin()}
                                </>
                            }
                        </span>
                    </>
                }
                title={<>
                    <Text strong>
                        {crosschainDirectoinType == CrosschainDirectoinType.RECEIVE && t("wallet_history_received")}
                        {crosschainDirectoinType == CrosschainDirectoinType.SEND && `跨链到 ${getNetworkNameByCoin(networkCoin as NetworkCoinType)} 网络`}
                    </Text>
                </>}
                description={
                    <>
                        {crosschainDirectoinType == CrosschainDirectoinType.RECEIVE && from}
                        {crosschainDirectoinType == CrosschainDirectoinType.SEND && to}
                    </>
                }
            />
            <div>
                {crosschainDirectoinType == CrosschainDirectoinType.RECEIVE && <>
                    <Text strong type="success">+{value && EtherAmount({ raw: value, fix: 18 })} SAFE</Text>
                </>}
                {crosschainDirectoinType == CrosschainDirectoinType.SEND && <>
                    <Text strong>-{value && EtherAmount({ raw: value, fix: 18 })} SAFE</Text>
                </>}
            </div>
        </List.Item>
    </>
}