import { useEffect, useState } from "react"
import { useWeb3Hooks } from "../../../connectors/hooks";
import useDebounce from "../../../hooks/useDebounce";
import { useDispatch } from "react-redux";


export default () => {

  const { useProvider } = useWeb3Hooks();
  const provider = useProvider();
  const dispatch = useDispatch();

  const [state, setState] = useState<{ blockNumber: number | null }>({
    blockNumber: null
  })
  const debouncedState = useDebounce(state, 20);

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
    console.log("send blockNumber update! =>" , debouncedState.blockNumber)
  }, [dispatch, state , debouncedState.blockNumber])

  return <>
    { state.blockNumber }
  </>
}
