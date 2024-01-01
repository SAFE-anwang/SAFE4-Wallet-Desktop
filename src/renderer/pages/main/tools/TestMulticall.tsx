
import { useETHBalances, useWalletsActiveAccount } from "../../../state/wallets/hooks";

export default () => {

    const activeAccount = useWalletsActiveAccount();
    const balance = useETHBalances( [activeAccount] )[activeAccount];
    console.log( "dasdasd" , balance?.toFixed(6) )
    return <>
        multicall page = { balance && <> { balance && JSON.stringify(balance) } </> }
    </>
}