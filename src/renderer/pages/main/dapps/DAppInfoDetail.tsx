import { Descriptions, Space, Button, Typography, Tag, Tooltip, Divider } from "antd";
import { DAppInfo } from "../../../structs/DApp";
import AddressComponent from "../../components/AddressComponent";

const { Text, Link, Paragraph } = Typography;

export default function DAppInfoDetail({
  dAppInfo,
  onClose,
}: {
  dAppInfo: DAppInfo;
  onClose: () => void;
}) {
  const shortAddr = (addr: string) =>
    addr ? `${addr.slice(0, 10)}...${addr.slice(-8)}` : "-";

  const items = [
    // 1: 名称 | 关键词
    {
      key: "name",
      label: "名称",
      children: (
        <Space>
          <Text strong>{dAppInfo.name || "-"}</Text>
          {dAppInfo.isFrozen && <Tag color="red">已冻结</Tag>}
        </Space>
      ),
      span: 1,
    },
    {
      key: "keyword",
      label: "关键词",
      children: dAppInfo.keyword || "-",
      span: 1,
    },

    // 2: 官方网站 | 应用链接
    {
      key: "officialUrl",
      label: "官方网站",
      children: dAppInfo.officialUrl ? (
        <Link href={dAppInfo.officialUrl} target="_blank" rel="noreferrer">
          {dAppInfo.officialUrl}
        </Link>
      ) : (
        "-"
      ),
      span: 1,
    },
    {
      key: "runUrl",
      label: "应用链接",
      children: dAppInfo.runUrl ? (
        <Link href={dAppInfo.runUrl} target="_blank" rel="noreferrer">
          {dAppInfo.runUrl}
        </Link>
      ) : (
        "-"
      ),
      span: 1,
    },

    // 3: 官方账号（占满整行）
    {
      key: "officiaAccount",
      label: "官方账号",
      children: dAppInfo.officiaAccount ? (
        <AddressComponent address={dAppInfo.officiaAccount} />
      ) : (
        "-"
      ),
      span: 2,
    },

    // 4: 合约地址（占满整行）
    {
      key: "contractAddress",
      label: "合约地址",
      children: dAppInfo.contractAddress ? (
        <AddressComponent address={dAppInfo.contractAddress} />
      ) : (
        "-"
      ),
      span: 2,
    },

    // 5: Git | 官方邮箱
    {
      key: "gitUrl",
      label: "Git",
      children: dAppInfo.gitUrl ? (
        <Link href={dAppInfo.gitUrl} target="_blank" rel="noreferrer">
          {dAppInfo.gitUrl}
        </Link>
      ) : (
        "-"
      ),
      span: 1,
    },
    {
      key: "officiaEmail",
      label: "官方邮箱",
      children: dAppInfo.officiaEmail || "-",
      span: 1,
    },

    // 6: 举报次数（占满整行）
    {
      key: "fraudNum",
      label: "举报次数",
      children: (
        <Text type={dAppInfo.fraudNum > 0 ? "danger" : undefined}>
          {dAppInfo.fraudNum ?? 0}
        </Text>
      ),
      span: 2,
    },

    // 7: 应用描述（占满整行）
    {
      key: "description",
      label: "应用描述",
      children: (
        <Paragraph style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>
          {dAppInfo.description || "-"}
        </Paragraph>
      ),
      span: 2,
    },
  ];

  return (
    <div>
      <Descriptions
        bordered
        column={2}
        size="middle"
        labelStyle={{ width: 110, whiteSpace: "nowrap" }}
        items={items}
      />
      <Divider style={{ margin: "20px 0 16px" }} />
      <Space style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={onClose}>关闭</Button>
      </Space>
    </div>
  );
}
