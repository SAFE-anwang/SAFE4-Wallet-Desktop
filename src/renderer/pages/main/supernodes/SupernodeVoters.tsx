import { useEffect, useState } from "react";
import { useSupernodeVoteContract } from "../../../hooks/useContracts"
import { CurrencyAmount, JSBI } from "@uniswap/sdk";
import { ColumnsType } from "antd/es/table";
import AddressView from "../../components/AddressView";
import { Typography, Table } from 'antd';
import AddressComponent from "../../components/AddressComponent";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

const Supernode_Voters_Page_Size = 10;

interface VotersNum {
  address: string,
  num: CurrencyAmount
}

export default ({
  supernodeAddr
}: {
  supernodeAddr: string
}) => {

  const { t } = useTranslation();
  const supernodeVoteContract = useSupernodeVoteContract();
  const [votersNumArr, setVotersNumArr] = useState<VotersNum[]>();
  const [pagination, setPagination] = useState<{
    current?: number,
    pageSize?: number,
    total?: number
  }>();

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (supernodeVoteContract) {
      // function getVoterNum(address _addr) external view returns (uint);
      setVotersNumArr([]);
      supernodeVoteContract.callStatic.getVoterNum(supernodeAddr)
        .then(data => {
          const total = data.toNumber();
          console.log(`Supernode-[${supernodeAddr}] Total Voters:${total}}`)
          setPagination({
            current: 1,
            pageSize: Supernode_Voters_Page_Size,
            total
          })
        })
    }
  }, [supernodeVoteContract, supernodeAddr]);

  useEffect(() => {
    if (pagination && supernodeVoteContract) {
      const { current, pageSize, total } = pagination;
      if (current && pageSize && total && total > 0) {
        setLoading(true);
        // function getVoters(address _addr, uint _start, uint _count) external view returns (address[] memory, uint[] memory);
        supernodeVoteContract.callStatic.getVoters(supernodeAddr, (current - 1) * pageSize, pageSize)
          .then((data) => {
            const votersNumArr = data[0].map((_data: any) => {
              const address = _data;
              return {
                address,
                num: CurrencyAmount.ether(JSBI.BigInt(0))
              }
            })
            for (let i in votersNumArr) {
              const _num = data[1][i];
              votersNumArr[i].num = CurrencyAmount.ether(_num);
            }
            setVotersNumArr(votersNumArr);
            setLoading(false);
          })
      } else {
        setLoading(false);
      }
    }
  }, [pagination]);


  const columns: ColumnsType<VotersNum> = [
    {
      title: t("address"),
      dataIndex: 'address',
      key: 'address',
      render: (addr) => {
        return <>
          <div style={{width:"70%"}}>
            <AddressComponent address={addr} qrcode copyable />
          </div>
        </>
      },
      width:"70%"
    },
    {
      title: t("votes"),
      dataIndex: 'num',
      key: 'num',
      render: (num) => {
        return <Text strong>{num.toFixed(2)}</Text>
      }
    },
  ];
  return <>
    <Table loading={loading} onChange={(pagination) => {
      const { current, pageSize, total } = pagination;
      setPagination({
        current,
        pageSize,
        total
      })
    }} dataSource={votersNumArr} columns={columns} pagination={pagination} />
  </>



}
