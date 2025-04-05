import { useEffect, useState } from "react";
import { useBlockNumber } from "../state/application/hooks";
import CallMulticallAggregate, { CallMulticallAggregateContractCall } from "../state/multicall/CallMulticallAggregate";
import { useMulticallContract, useSafeswapV2Factory } from "./useContracts";


export default () => {

    const safeswapV2Factory = useSafeswapV2Factory(false);
    const blockNumber = useBlockNumber();
    const multicallContract = useMulticallContract();
    const [allPairs, setAllPairs] = useState<string[]>();

    useEffect(() => {
        if (safeswapV2Factory && multicallContract) {
            safeswapV2Factory.allPairsLength()
                .then((data: any) => {
                    const pairsLength = data.toNumber();
                    console.log("Query SafeswapV2Factory.PairsLength=", pairsLength);
                    const calls: CallMulticallAggregateContractCall[] = [];
                    for (let i = 0; i < pairsLength; i++) {
                        calls.push({
                            contract: safeswapV2Factory,
                            functionName: "allPairs",
                            params: [i],
                        })
                    }
                    CallMulticallAggregate(multicallContract, calls, () => {
                        setAllPairs(calls.map(call => call.result));
                    });
                });
        }
    }, [blockNumber, safeswapV2Factory, multicallContract])

    return allPairs;

}