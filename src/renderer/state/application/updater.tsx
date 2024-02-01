import { useEffect, useState } from "react"
import { useDispatch } from "react-redux";
import { useWeb3Hooks, useWeb3Network } from "../../connectors/hooks";
import useDebounce from "../../hooks/useDebounce";
import { applicationBlockchainUpdateBlockNumber } from "./action";


export default () => {

    const { useProvider } = useWeb3Hooks();
    const provider = useProvider();
    const dispatch = useDispatch();

    const [state, setState] = useState<{ blockNumber: number | null }>({
        blockNumber: null
    })
    const debouncedState = useDebounce(state, 100);
    const blockNumberCallback = (blockNumber: number) => {
        
        setState({ blockNumber });
    }

    useEffect(() => {
        provider?.getBlockNumber()
            .then(blockNumberCallback)
            .catch(error => {
             
            });
        provider?.on("block", blockNumberCallback)
        return () => {
            provider?.removeListener('block', blockNumberCallback)
        } 
    }, [provider]);

    useEffect(() => {
        if (!debouncedState.blockNumber) return
        provider?.getBlock(debouncedState.blockNumber)
            .then( response => {
                const { timestamp } = response;
                dispatch(applicationBlockchainUpdateBlockNumber({
                    blockNumber : debouncedState.blockNumber ?? 0,
                    timestamp
                }));
            }).catch(err => {
                
            })
    }, [dispatch, state, debouncedState.blockNumber])


    return <></>

}