import { Button, Card, Col, Divider, Row, Spin, Typography } from "antd";
import { useEffect, useState, useMemo } from "react";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import AddressComponent from "../../../../components/AddressComponent";
import { useNftTokens } from "../../../../../state/audit/hooks";
import { useBlockNumber } from "../../../../../state/application/hooks";
import { fetchNftAssetsCount } from "../../../../../services/audit";
import useSafeScan from "../../../../../hooks/useSafeScan";
import NFTTokenLogoComponent from "../../../../components/NFTTokenLogoComponent";
import { useWeb3React } from "@web3-react/core";
import { NftAssetsCountVO, NftTokenVO } from "../../../../../services/insight";
import NftTokenAssets from "./NftTokenAssets";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function NftAssetsList() {
  const activeAccount = useWalletsActiveAccount();
  const { INSIGHT_API } = useSafeScan();
  const { chainId } = useWeb3React();
  const blockNumber = useBlockNumber();
  const nftTokens = useNftTokens();
  const [nftAssetsCount, setNftAssetsCount] = useState<NftAssetsCountVO[]>();
  const [selectedNftToken, setSelectedNftToken] = useState<NftTokenVO | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  // 1. 高效构建 NFT Token Map
  const nftTokenMap = useMemo(() => {
    if (!nftTokens) return {};
    return nftTokens.reduce((map, token) => {
      map[token.address] = token;
      return map;
    }, {} as Record<string, NftTokenVO>);
  }, [nftTokens]);

  // 2. 异步获取用户 NFT 资产数量
  useEffect(() => {
    if (!activeAccount) return;
    setLoading(true);
    fetchNftAssetsCount(INSIGHT_API, activeAccount)
      .then((result) => {
        console.log("查询用户NFT资产:", result);
        setNftAssetsCount(result);
      })
      .catch((error) => {
        console.log("查询用户NFT资产失败", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [blockNumber, activeAccount, INSIGHT_API]);

  // 3. 过滤并按规则排序：有 Logo 的优先，其次按数量从大到小排序
  const sortedNftAssets = useMemo(() => {
    if (!nftAssetsCount) return [];

    return nftAssetsCount
      .filter((item) => nftTokenMap[item.token] !== undefined)
      .sort((a, b) => {
        const tokenA = nftTokenMap[a.token];
        const tokenB = nftTokenMap[b.token];

        const hasLogoA = Boolean(tokenA?.logoURI);
        const hasLogoB = Boolean(tokenB?.logoURI);

        // 规则一：有 logo 的排在前面 (true > false)
        if (hasLogoA !== hasLogoB) {
          return hasLogoA ? -1 : 1;
        }

        // 规则二：数量多的排在前面 (降序)
        return b.count - a.count;
      });
  }, [nftAssetsCount, nftTokenMap]);

  if (!nftTokenMap || !nftAssetsCount || !chainId || sortedNftAssets.length === 0) {
    return <>
      该地址暂无 NFT 资产
    </>;
  }

  return <>
    {
      selectedNftToken && <>
        <Row>
          <Button icon={<ArrowLeftOutlined />} size="large" onClick={() => setSelectedNftToken(undefined)}>返回</Button>
          <Divider type="vertical" style={{ height: "40px" }} />
          <NFTTokenLogoComponent height={40} style={{ width: "40px", height: "40px" }} chainId={chainId} address={selectedNftToken.address} />
          <Row style={{ marginLeft: "10px" }}>
            <Col span={24}>
              <Text strong>{selectedNftToken.name}</Text>
            </Col>
            <Col span={24}>
              <Text type="secondary">{selectedNftToken.symbol}</Text>
            </Col>
          </Row>
        </Row>
        <NftTokenAssets nftTokenVO={selectedNftToken} />
      </>
    }

    {
      !selectedNftToken && <>
        {
          sortedNftAssets && sortedNftAssets.length > 0 &&
          <Card className="menu-item-container" style={{ marginBottom: "20px" }}>
            {sortedNftAssets.map((nftAssetCount, index) => {
              const nftTokenVO = nftTokenMap[nftAssetCount.token];
              const { count } = nftAssetCount;
              const tokenType = nftTokenVO.type === "erc1155" ? "SRC-1155" : "SRC-721";
              return (
                <div key={nftTokenVO.address}>
                  {index > 0 && <Divider style={{ margin: "0px 0px" }} />}
                  <Row className="menu-item" style={{ height: "80px", lineHeight: "80px" }}>
                    <Col onClick={() => setSelectedNftToken(nftTokenVO)} span={2} style={{ textAlign: "center" }}>
                      <NFTTokenLogoComponent chainId={chainId} address={nftTokenVO.address} />
                    </Col>
                    <Col span={8} onClick={() => {
                      setSelectedNftToken(nftTokenVO);
                    }}>
                      <Row>
                        <Col span={24} style={{ lineHeight: "35px", marginTop: "5px" }}>
                          <Text strong>{nftTokenVO.name}</Text>
                          <Text style={{ fontSize: "14px", marginLeft: "2px" }} code>
                            {tokenType}
                          </Text>
                        </Col>
                        <Col span={24} style={{ lineHeight: "35px" }}>
                          <Text title="资产数量" code strong>
                            {count}
                          </Text>
                          <Divider type="vertical" />
                          <Text type="secondary">{nftTokenVO.symbol}</Text>
                        </Col>
                      </Row>
                    </Col>

                    <Col span={14} style={{ paddingRight: "30px", paddingTop: "5px" }}>
                      <Row>
                        <Col span={24} style={{ lineHeight: "35px", marginTop: "5px" }}>
                          <Text style={{ float: "right" }} type="secondary">
                            NFT 资产合约地址
                          </Text>
                        </Col>
                        <Col span={24} style={{ lineHeight: "35px" }}>
                          <Text style={{ float: "right", marginTop: "10px" }}>
                            <AddressComponent address={nftTokenVO.address} copyable qrcode />
                          </Text>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </div>
              );
            })}
          </Card>
        }

      </>
    }
  </>

}
