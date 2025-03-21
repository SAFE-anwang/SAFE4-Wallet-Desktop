import { LoadingOutlined, SyncOutlined } from "@ant-design/icons";
import { Avatar, List, Spin, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { SAFE_LOGO } from "../../../../../assets/logo/AssetsLogo";
import { getNetworkLogoByCoin, getNetworkLogoByTxIDPrefix, getNetworkNameByCoin, getNetworkNameByTxPrefix, NetworkCoinType, NetworkTxIdPrefix } from "../../../../../assets/logo/NetworkLogo";
import { TransactionDetails } from "../../../../../state/transactions/reducer"
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import EtherAmount from "../../../../../utils/EtherAmount";
import { useMemo } from "react";
import { useCrosschain } from "../../../../../state/transactions/hooks";

const { Text } = Typography;

export const enum CrosschainDirectoinType {
  SEND = 1,
  RECEIVE = 2
}

export const enum CrosschainDirection {
  SAFE4_NETWORKS = "safe4_networks",
  NETWORKS_SAFE4 = "networks_safe4"
}

export function getCrosschainDirection(supportFuncName: string) {
  if (Object.values(NetworkCoinType).includes(supportFuncName as NetworkCoinType)) {
    return CrosschainDirection.SAFE4_NETWORKS;
  };
  if (Object.values(NetworkTxIdPrefix).includes(supportFuncName as NetworkTxIdPrefix)) {
    return CrosschainDirection.NETWORKS_SAFE4;
  }
  return undefined;
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
    hash,
    status,
    call
  } = transaction;
  const { from, to, value } = call ? call : {
    from: null, to: null, value: null
  };
  const activeAccount = useWalletsActiveAccount();
  const crosschainDirection = useMemo<CrosschainDirection | undefined>(() => {
    return getCrosschainDirection(support.supportFuncName);
  }, [support]);
  const crosschainDirectoinType = from == activeAccount ? CrosschainDirectoinType.SEND : CrosschainDirectoinType.RECEIVE;
  const crosschainVO = useCrosschain(hash);
  const crosschainSpin = useMemo(() => {
    if (crosschainDirectoinType == CrosschainDirectoinType.SEND) {
      return !(crosschainVO && crosschainVO.status == 4)
    }
    return false;
  }, [crosschainDirectoinType, crosschainVO]);

  const RenderLogosCrossDirectoin = () => {
    if (crosschainDirection == CrosschainDirection.SAFE4_NETWORKS) {
      return <>
        <Avatar style={{ marginTop: "8px" }} src={SAFE_LOGO} />
        <Avatar style={{ marginTop: "8px", marginLeft: "-15px" }} src={getNetworkLogoByCoin(support.supportFuncName as NetworkCoinType)} />
      </>
    } else if (crosschainDirection == CrosschainDirection.NETWORKS_SAFE4) {
      return <>
        <Avatar style={{ marginTop: "8px" }} src={getNetworkLogoByTxIDPrefix(support.supportFuncName as NetworkTxIdPrefix)} />
        <Avatar style={{ marginTop: "8px", marginLeft: "-15px" }} src={SAFE_LOGO} />
      </>
    }
  }

  const RenderTitle = () => {
    if (crosschainDirection == CrosschainDirection.SAFE4_NETWORKS) {
      return <>
        <Avatar style={{ marginTop: "8px" }} src={SAFE_LOGO} />
        <Avatar style={{ marginTop: "8px", marginLeft: "-15px" }} src={getNetworkLogoByCoin(support.supportFuncName as NetworkCoinType)} />
      </>
    } else if (crosschainDirection == CrosschainDirection.NETWORKS_SAFE4) {
      return <>
        <Avatar style={{ marginTop: "8px" }} src={getNetworkLogoByTxIDPrefix(support.supportFuncName as NetworkTxIdPrefix)} />
        <Avatar style={{ marginTop: "8px", marginLeft: "-15px" }} src={SAFE_LOGO} />
      </>
    }
  }

  return <>
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
            {
              crosschainDirection == CrosschainDirection.SAFE4_NETWORKS && `${t("wallet_history_crosschain_crosstonetwork", { network: getNetworkNameByCoin(support.supportFuncName as NetworkCoinType) })}`
            }
            {
              crosschainDirection == CrosschainDirection.NETWORKS_SAFE4 && `${t("wallet_history_crosschain_receivefromnetwork", { network: getNetworkNameByTxPrefix(support.supportFuncName as NetworkTxIdPrefix) })}`
            }
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
          {
            crosschainSpin && <SyncOutlined spin={crosschainSpin} style={{ marginLeft: "10px" }} />
          }
        </>}
      </div>
    </List.Item>
  </>
}
