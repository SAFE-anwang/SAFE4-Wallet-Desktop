import { Card, Col, Row, Typography } from "antd";
import NFT_PLACEHOLDER from "../../../../../assets/logo/nft-placeholder.svg";
import { NftAssetVO } from "../../../../../services/insight";
const { Text } = Typography;

export default ({
  nftAssetVO,
  showTokenId = true,
  height = 128
}: {
  nftAssetVO: NftAssetVO,
  showTokenId?: boolean,
  height?: number
}) => {

  return <>
    <Card key={nftAssetVO.tokenId} size="small">
      <Row>
        <Col span={24} style={{ textAlign: "center" }}>
          <img src={NFT_PLACEHOLDER} style={{ height }} />
        </Col>
        {
          showTokenId && <Col span={24}>
            <Text># {nftAssetVO.tokenId}</Text>
          </Col>
        }
      </Row>
    </Card>
  </>

}
