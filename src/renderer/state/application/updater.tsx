import { useEffect, useState } from "react"
import { useDispatch } from "react-redux";
import { useWeb3Hooks, useWeb3Network } from "../../connectors/hooks";
import useDebounce from "../../hooks/useDebounce";
import { Application_Blockchain_Update_BlockNumber } from "./action";
import { useBlockNumber } from "./hooks";


export default () => {

    const { useProvider } = useWeb3Hooks();
    const network = useWeb3Network();
    const provider = useProvider();
    const dispatch = useDispatch();
    const latestBlockNumber = useBlockNumber();

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
        dispatch(Application_Blockchain_Update_BlockNumber(debouncedState.blockNumber));
    }, [dispatch, state, debouncedState.blockNumber])


    return <></>

}