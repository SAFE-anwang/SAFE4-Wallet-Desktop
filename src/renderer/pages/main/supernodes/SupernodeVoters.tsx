import { useEffect, useState } from "react";
import { useSupernodeVoteContract } from "../../../hooks/useContracts"
import { CurrencyAmount, JSBI } from "@uniswap/sdk";
import { ColumnsType } from "antd/es/table";
import AddressView from "../../components/AddressView";
import { Typography, Table } from 'antd';

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

  const supernodeVoteContract = useSupernodeVoteContract();
  const [votersNumArr, setVotersNumArr] = useState<VotersNum[]>();
  const [pagination, setPagination] = useState<{
    current?: number,
    pageSize?: number,
    total?: number
  }>();

  useEffect(() => {
    if (supernodeVoteContract) {
      // function getVoterNum(address _addr) external view returns (uint);
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
  }, [supernodeVoteContract]);

  useEffect(() => {
    if (pagination && supernodeVoteContract) {
      const { current, pageSize } = pagination;
      if (current && pageSize) {
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
          })
      }
    }
  }, [pagination]);


  const columns: ColumnsType<VotersNum> = [
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      render: (addr) => {
        return <>
          <AddressView address={addr}></AddressView>
        </>
      }
    },
    {
      title: '数量',
      dataIndex: 'num',
      key: 'num',
      render: (num) => {
        return <Text strong>{num.toFixed(6)}</Text>
      }
    },
  ];
  return <>
    <Table onChange={(pagination) => {
      const { current, pageSize, total } = pagination;
      setPagination({
        current,
        pageSize,
        total
      })
    }} dataSource={votersNumArr} columns={columns} pagination={pagination} />
  </>



}
