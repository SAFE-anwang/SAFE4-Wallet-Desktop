import { useEffect } from "react"
import { useBlockNumber } from "../application/hooks";
import { useMulticallContract, useProposalContract } from "../../hooks/useContracts";
import { useWeb3React } from "@web3-react/core";
import { formatProposalInfo } from "../../structs/Proposal";
import { useDispatch } from "react-redux";

const MAX_PROPOSALS_PAGE_SIZE = 2;

export default () => {

  const blockNumber = useBlockNumber();
  const proposalContract = useProposalContract();
  const { chainId } = useWeb3React();
  const multicallContract = useMulticallContract();
  const dispatch = useDispatch();

  useEffect(() => {
    if (proposalContract && chainId && multicallContract) {
      const loadProposals = async function () {
        // 提案总数
        const totalNum = (await proposalContract.getNum()).toNumber();
        // 计算分页数量
        const pages = Math.ceil(totalNum / MAX_PROPOSALS_PAGE_SIZE);
        const promises: Promise<any[]>[] = [];
        for (let i = 0; i < pages; i++) {
          // <-- 计算每一页的 position / offset -->
          let position = totalNum - (i + 1) * MAX_PROPOSALS_PAGE_SIZE;
          let offset = MAX_PROPOSALS_PAGE_SIZE;
          if (position < 0) {
            offset = position + MAX_PROPOSALS_PAGE_SIZE;
            position = 0;
          }
          // 将每一页的调用作为 async 任务 push 到 promises
          promises.push((async () => {
            // 1. 先拿该页的 proposalId 列表
            const _proposalIds = await proposalContract.getAll(position, offset);
            const proposalIds = _proposalIds
              .map((id: any) => id.toNumber())
              .sort((a: number, b: number) => b - a);
            // 2. 根据 id 构造 multicall 参数
            const fragment = proposalContract.interface.getFunction("getInfo")
            const calls = proposalIds.map((id: number) => [
              proposalContract.address,
              proposalContract.interface.encodeFunctionData(fragment, [id])
            ]);
            // 3. 调用 multicall，解析结果
            const data = await multicallContract.callStatic.aggregate(calls);
            const proposalInfos = data[1].map((raw: string) => {
              const decoded = proposalContract.interface.decodeFunctionResult(fragment, raw)[0];
              return formatProposalInfo(decoded);
            });
            return proposalInfos;
          })());
        }
        // 等待全部分页结果
        const allPageResults = await Promise.all(promises);
        // 二维数组 => 一维 flatten
        const proposals = allPageResults.flat();
      }
      loadProposals();
    }
  }, [chainId, proposalContract, multicallContract]);

  return <>

  </>
}
