import { Button, Space, Table, Typography } from "antd";
import { useAuditTokenList } from "../../../state/audit/hooks"
import AddressComponent from "../../components/AddressComponent";
import EditAssetModal from "./EditAssetModal";
import { useEffect, useState } from "react";
import PromotionModal from "./PromotionModal";
import { isLocalWallet } from "../../../hooks/useWalletName";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useWeb3React } from "@web3-react/core";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import { useContract, useMulticallContract } from "../../../hooks/useContracts";
import CallMulticallAggregate, { CallMulticallAggregateContractCall } from "../../../state/multicall/CallMulticallAggregate";
import { SRC20_ABI } from "./SRC20";
import { SRC20_Template } from "./SRC20_Template_Config";
import { Contract } from "ethers";

const { Text } = Typography;

export default () => {

  const [openEditAssetModal, setOpenEditAssetModal] = useState(false);
  const [openPromotionModal, setOpenPromotionModal] = useState(false);
  const [selectAddress, setSelectAddress] = useState<string>();
  const activeAccount = useWalletsActiveAccount();
  const { chainId } = useWeb3React();
  const auditTokens = useAuditTokenList();

  const myAuditTokens = auditTokens && auditTokens.filter(
    auditToken => auditToken.creator && isLocalWallet(auditToken.creator).isLocal);

  const myAuditTokensAddresses = myAuditTokens && myAuditTokens.map(token => token.address);
  const multicallContract = useMulticallContract();
  const [src20TokenVersionMap, setSRC20TokenVersionMap] = useState<{
    [address: string]: string
  }>();

  useEffect(() => {
    if (myAuditTokensAddresses && multicallContract) {
      const calls: CallMulticallAggregateContractCall[] = [];
      myAuditTokensAddresses.forEach(address => {
        const src20Contract = new Contract(address, SRC20_Template.SRC20.abi, undefined);
        const versionCall: CallMulticallAggregateContractCall = {
          contract: src20Contract,
          functionName: "version",
          params: []
        };
        calls.push(versionCall);
      });
      if (calls.length > 0) {
        CallMulticallAggregate(multicallContract, calls, () => {
          const tokenVersionMap = calls.reduce((map, call) => {
            map[call.contract.address] = call.result;
            return map;
          }, {} as { [address: string]: string });
          setSRC20TokenVersionMap(tokenVersionMap);
        })
      }
    }
  }, [myAuditTokensAddresses, multicallContract]);

  const clickEdit = (address: string) => {
    setSelectAddress(address);
    setOpenEditAssetModal(true);
  }

  const clickPromotion = (address: string) => {
    setSelectAddress(address);
    setOpenPromotionModal(true);
  }

  const couldMint = (address: string) => {
    if (src20TokenVersionMap) {
      return src20TokenVersionMap[address].startsWith("SRC20-mintable")
        || couldBurn(address);
    }
    return false;
  }

  const couldBurn = (address: string) => {
    if (src20TokenVersionMap) {
      return src20TokenVersionMap[address].startsWith("SRC20-burnable");
    }
    return false;
  }

  const columns = [
    {
      title: '资产符号',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (symbol: string, data: any) => {
        return <>
          {chainId && <ERC20TokenLogoComponent
            style={{ width: "30px", height: "30px", padding: "4px" }}
            chainId={chainId}
            address={data.address}
            logoURI={data.logoURI}
          />}
          <Text style={{ marginLeft: "5px" }} strong>{symbol}</Text>
        </>
      }
    },
    {
      title: '资产名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => {
        return <Text strong>{name}</Text>
      }
    },
    {
      title: '合约地址',
      dataIndex: 'address',
      key: 'address',
      render: (address: string) => {
        return <AddressComponent address={address} qrcode copyable ellipsis />
      }
    },
    {
      title: '管理者',
      dataIndex: 'creator',
      key: 'creator',
      render: (creator: string) => {
        return creator && <AddressComponent address={creator} qrcode copyable ellipsis />
      }
    },
    {
      title: '操作',
      dataIndex: 'address',
      key: 'address',
      render: (address: string, data: any, index: number) => {
        const creator = data.creator;
        const isActiveAccount = creator == activeAccount;
        return <Space>
          <Button disabled={!isActiveAccount} onClick={() => {
            clickEdit(address);
          }}>编辑</Button>
          <Button disabled={!isActiveAccount} onClick={() => {
            clickPromotion(address);
          }}>推广</Button>
          {
            isActiveAccount && couldMint(address) && <>
              <Button>增发</Button>
            </>
          }
          {
            isActiveAccount && couldBurn(address) && <>
              <Button>销毁</Button>
            </>
          }
        </Space >
      }
    },
  ];

  return <>
    <Table dataSource={myAuditTokens} columns={columns} />
    {
      openEditAssetModal && selectAddress &&
      <EditAssetModal openEditAssetModal={openEditAssetModal} setOpenEditAssetModal={setOpenEditAssetModal} address={selectAddress} />
    }
    {
      openPromotionModal && selectAddress &&
      <PromotionModal openPromotionModal={openPromotionModal} setOpenPromotionModal={setOpenPromotionModal} address={selectAddress} />
    }
  </>

}
