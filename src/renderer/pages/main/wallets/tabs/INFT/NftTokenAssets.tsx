import { useEffect, useState, useMemo } from "react"
import { NftAssetVO, NftTokenVO } from "../../../../../services/insight"
import { fetchNftAssets } from "../../../../../services/audit";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import useSafeScan from "../../../../../hooks/useSafeScan";
import { List } from "antd";
import NftAsset from "./NftAsset";
import "./index.css";
import NftAssetSendModal from "./NftAssetSendModal";
import { useBlockNumber } from "../../../../../state/application/hooks";

export default ({
  nftTokenVO
}: {
  nftTokenVO: NftTokenVO
}) => {

  const activeAccount = useWalletsActiveAccount();
  const { INSIGHT_API } = useSafeScan();
  const [nftAssetVOList, setNftAssetVOList] = useState<NftAssetVO[] | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const blockNumber = useBlockNumber();

  useEffect(() => {
    setLoading(true);
    fetchNftAssets(INSIGHT_API, activeAccount, nftTokenVO.address)
      .then(result => {
        setNftAssetVOList(result);
      })
      .catch(err => {
        console.log("查询指定Nft资产条目失败")
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeAccount, INSIGHT_API, nftTokenVO.address, blockNumber]);

  // 👇 使用 useMemo 对列表按 tokenId 逆序排列（number 类型直接相减）
  const sortedNftAssetList = useMemo(() => {
    if (!nftAssetVOList) return undefined;
    return [...nftAssetVOList].sort((a, b) => b.tokenId - a.tokenId);
  }, [nftAssetVOList]);

  const [selectedNftAssetVO, setSelectedNftAssetVO] = useState<NftAssetVO | undefined>(undefined);
  const [openSendModal, setOpenSendModal] = useState(false);

  const RenderNftAssetVO = (nftAssetVO: NftAssetVO) => {
    return (
      <div className="nft-card-wrapper" style={{ padding: "5px" }} onClick={() => {
        setSelectedNftAssetVO(nftAssetVO);
        setOpenSendModal(true);
      }}>
        <NftAsset nftAssetVO={nftAssetVO} />
      </div>
    );
  };

  return (
    <>
      <List
        loading={loading}
        dataSource={sortedNftAssetList}
        renderItem={RenderNftAssetVO}
        style={{ marginTop: "10px" }}
        grid={{ gutter: 6, column: 6 }}
        pagination={{
          pageSize: 24,
          position: "bottom",
          align: "end",
          showSizeChanger: false,
        }}
      />
      {selectedNftAssetVO && <NftAssetSendModal nftTokenVO={nftTokenVO} openSendModal={openSendModal} setOpenSendModal={setOpenSendModal}
        nftAssetVO={selectedNftAssetVO} />}
    </>


  );
};
