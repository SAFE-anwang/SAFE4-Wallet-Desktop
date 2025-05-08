import { Button, Space, Table, Typography } from "antd";
import { useAuditTokenList } from "../../../state/audit/hooks"
import AddressComponent from "../../components/AddressComponent";
import EditAssetModal from "./EditAssetModal";
import { useState } from "react";
import PromotionModal from "./PromotionModal";

const { Text } = Typography;

export default () => {

  const auditTokens = useAuditTokenList();
  const [openEditAssetModal, setOpenEditAssetModal] = useState(false);
  const [openPromotionModal, setOpenPromotionModal] = useState(false);
  const [selectAddress, setSelectAddress] = useState<string>();

  const clickEdit = (address: string) => {
    setSelectAddress(address);
    setOpenEditAssetModal(true);
  }

  const clickPromotion = (address: string) => {
    setSelectAddress(address);
    setOpenPromotionModal(true);
  }

  const columns = [
    {
      title: '资产符号',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (symbol: string) => {
        return <Text strong>{symbol}</Text>
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
      dataIndex: 'address',
      key: 'address',
      render: (address: string) => {
        return <AddressComponent address={address} qrcode copyable ellipsis />
      }
    },
    {
      title: '操作',
      dataIndex: 'address',
      key: 'address',
      render: (address: string, data: any, index: number) => {
        return <Space>
          <Button onClick={() => {
            clickEdit(address);
          }}>编辑</Button>
          <Button onClick={() => {
            clickPromotion(address);
          }}>推广</Button>
        </Space>
      }
    },
  ];

  return <>
    <Table dataSource={auditTokens} columns={columns} />
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
