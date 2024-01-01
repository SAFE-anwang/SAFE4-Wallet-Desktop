import { useEffect, useState } from "react"
import { useWeb3Hooks } from "../../../connectors/hooks";
import useDebounce from "../../../hooks/useDebounce";
import { useDispatch } from "react-redux";
import { Contract } from "ethers";


export default () => {

  const { useProvider } = useWeb3Hooks();
  const provider = useProvider();
  const dispatch = useDispatch();

  const [state, setState] = useState<{ blockNumber: number | null }>({
    blockNumber: null
  })
  const debouncedState = useDebounce(state, 100);

  const blockNumberCallback = (blockNumber: number) => {
    setState( {blockNumber} );
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
  }, []);

  useEffect(() => {
    if (!debouncedState.blockNumber) return
  }, [dispatch, state , debouncedState.blockNumber])

  return <>
    { state.blockNumber }
  </>
}
