import { Button, Space, Table, Typography } from "antd";
import { useAuditTokenList, useNftTokens } from "../../../../state/audit/hooks"
import AddressComponent from "../../../components/AddressComponent";
import { useEffect, useMemo, useState } from "react";
import { isLocalWallet } from "../../../../hooks/useWalletName";
import { useWalletsActiveAccount, useWalletsList } from "../../../../state/wallets/hooks";
import { useWeb3React } from "@web3-react/core";
import { useMulticallContract } from "../../../../hooks/useContracts";
import CallMulticallAggregate, { CallMulticallAggregateContractCall } from "../../../../state/multicall/CallMulticallAggregate";
import { NFT_Template } from "./NFT_Template_Config";
import { Contract } from "ethers";
import { useTranslation } from "react-i18next";
import NFTTokenLogoComponent from "../../../components/NFTTokenLogoComponent";
import NFTSetLogo from "./NFTSetLogo";
import { NftTokenVO } from "../../../../services/insight";
import EditNFTAssetModal from "./EditNFTAssetModal";
import MintNFTAssetModal from "./MintNFTAssetModal";
import BurnNFTAssetModal from "./BurnNFTAssetModal";

const { Text } = Typography;

export default () => {

  const walletList = useWalletsList();
  const localWalletAddressSet = useMemo(() => {
    if (!walletList) return new Set<string>();
    return new Set(
      walletList
        .filter(w => w && w.address)
        .map(w => w.address)
    );
  }, [walletList]);

  const [openEditAssetModal, setOpenEditAssetModal] = useState(false);
  const [openPromotionModal, setOpenPromotionModal] = useState(false);
  const [openMintAssetModal, setOpenMintAssetModal] = useState(false);
  const [openBurnAssetModal, setOpenBurnAssetModal] = useState(false);

  const { t } = useTranslation();
  const [selectAddress, setSelectAddress] = useState<string>();
  const [selectNFTTokenVO, setSelectNFTTokenVO] = useState<NftTokenVO | undefined>();

  const activeAccount = useWalletsActiveAccount();
  const { chainId } = useWeb3React();
  const nftTokens = useNftTokens();
  const myAuditTokens = nftTokens && nftTokens.filter(
    nftToken => nftToken.template && nftToken.creator && localWalletAddressSet.has(nftToken.creator)
  );
  const myAuditTokensAddresses = myAuditTokens && myAuditTokens.map(token => token.address);
  const myAuditTokensAddressesStr = myAuditTokensAddresses?.join(",") || "";


  const multicallContract = useMulticallContract();
  const [versionMap, setVersionMap] = useState<{
    [address: string]: string
  }>();

  useEffect(() => {
    if (!myAuditTokensAddressesStr || !multicallContract) {
      return;
    }
    const addresses = myAuditTokensAddressesStr.split(",");
    console.log("[Multicall] Query NFTs Version", addresses);
    const calls: CallMulticallAggregateContractCall[] = [];
    addresses.forEach(address => {
      const tokenContract = new Contract(address, NFT_Template.SRC721.abi, undefined);
      const versionCall: CallMulticallAggregateContractCall = {
        contract: tokenContract,
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
        setVersionMap(tokenVersionMap);
      })
    }
  }, [myAuditTokensAddressesStr, multicallContract]);

  const clickEdit = (address: string, nftTokenVO: NftTokenVO) => {
    setSelectAddress(address);
    setOpenEditAssetModal(true);
  }

  const clickPromotion = (address: string, nftTokenVO: NftTokenVO) => {
    setSelectAddress(address);
    setSelectNFTTokenVO(nftTokenVO);
    setOpenPromotionModal(true);
  }

  const clickMint = (address: string, nftTokenVO: NftTokenVO) => {
    setSelectAddress(address);
    setSelectNFTTokenVO(nftTokenVO);
    setOpenMintAssetModal(true);
  }

  const clickBurn = (address: string, nftTokenVO: NftTokenVO) => {
    setSelectAddress(address);
    setSelectNFTTokenVO(nftTokenVO);
    setOpenBurnAssetModal(true);
  }
  const couldMint = (address: string) => {
    return true;
  }
  const couldBurn = (address: string) => {
    if (versionMap && versionMap[address]) {
      return versionMap[address].startsWith("SRC721-burnable");
    }
    return false;
  }
  const columns = [
    {
      title: t("wallet_src20_symbol"),
      dataIndex: 'symbol',
      key: 'symbol',
      render: (symbol: string, data: any) => {
        return <>
          {chainId && <NFTTokenLogoComponent
            style={{ width: "36px", height: "36px" }}
            height={ 36 }
            chainId={chainId}
            address={data.address}
            logoURI={data.logoURI}
          />}
          <Text style={{ marginLeft: "5px" }} strong>{symbol}</Text>
        </>
      }
    },
    {
      title: t("wallet_src20_name"),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => {
        return <Text strong>{name}</Text>
      }
    },
    {
      title: t("wallet_contracts_address"),
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
      title: t("wallet_proposals_operation"),
      dataIndex: 'address',
      key: 'address',
      render: (address: string, data: NftTokenVO, index: number) => {
        const creator = data.creator;
        const isActiveAccount = creator == activeAccount;
        return <Space>
          <Button disabled={!isActiveAccount} onClick={() => {
            clickEdit(address, data);
          }}>
            {t("wallet_issue_asset_manage_edit")}
          </Button>
          <Button disabled={!isActiveAccount} onClick={() => {
            clickPromotion(address, data);
          }}>
            {t("wallet_issue_asset_manage_promotion")}
          </Button>
          {
            isActiveAccount && couldMint(address) && <>
              <Button onClick={() => {
                clickMint(address, data);
              }}>
                {t("wallet_issue_asset_manage_mint")}
              </Button>
            </>
          }
          {
            isActiveAccount && couldBurn(address) && <>
              <Button onClick={() => {
                clickBurn(address,data);
              }}>
                {t("wallet_issue_asset_manage_burn")}
              </Button>
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
      <EditNFTAssetModal openEditAssetModal={openEditAssetModal} setOpenEditAssetModal={setOpenEditAssetModal} address={selectAddress} />
    }
    {
      openPromotionModal && selectNFTTokenVO &&
      <NFTSetLogo openPromotionModal={openPromotionModal} setOpenPromotionModal={setOpenPromotionModal} nftTokenVO={selectNFTTokenVO} />
    }
    {
      openMintAssetModal && selectNFTTokenVO &&
      <MintNFTAssetModal openMintModal={openMintAssetModal} setOpenMintModal={setOpenMintAssetModal} nftTokenVO={selectNFTTokenVO} />
    }
    {
      openBurnAssetModal && selectNFTTokenVO &&
      <BurnNFTAssetModal openBurnModal={openBurnAssetModal} setOpenBurnModal={setOpenBurnAssetModal} nftTokenVO={selectNFTTokenVO} />
    }
  </>

}
