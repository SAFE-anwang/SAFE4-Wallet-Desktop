
import { useEffect } from "react";
import { useETHBalances, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useWeb3Hooks } from "../../../connectors/hooks";

export default () => {

    const activeAccount = useWalletsActiveAccount();
    const balance = useETHBalances( [activeAccount] )[activeAccount];
    const { useProvider } = useWeb3Hooks();
    const provider = useProvider();
    useEffect( () => {
      if (provider){
        provider.getTransactionReceipt("0xaa0bd31a2318171389f28e3935138599702ae48b6db05177db24ff0100d238e6")
          .then( data => {
            console.log(data)
          } )
      }
    } , [] )

    return <>
        multicall page = { balance && <> { balance && JSON.stringify(balance) } </> }
    </>
}
