import { useWeb3React } from "@web3-react/core";
import { useEffect } from "react"
import { useBlockNumber } from "../application/hooks";
import { AppDispatch } from "..";
import { useDispatch } from "react-redux";
import { useWalletsActiveAccount } from "../wallets/hooks";
import { fetchCrossChainByAddress } from "../../services/crosschain";
import useSafeScan from "../../hooks/useSafeScan";


export default () => {

  const { provider, chainId } = useWeb3React();
  const latestBlockNumber = useBlockNumber();
  const dispatch = useDispatch<AppDispatch>();
  const activeAccount = useWalletsActiveAccount();
  const { API_Crosschain } = useSafeScan();

  // Sync Crosschain Transaction Data
  useEffect(() => {
    if (activeAccount && latestBlockNumber > 0 && chainId) {
      fetchCrossChainByAddress( API_Crosschain , { address : activeAccount } )
      .then( data => {
        console.log("Get Crosschain Data for Account={}" , activeAccount)
        console.log( data )
      });
    }
  }, [activeAccount, latestBlockNumber, chainId])
  return <></>
}
