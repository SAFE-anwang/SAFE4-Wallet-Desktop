import { ChainId, JSBI, Token, TokenAmount } from "@uniswap/sdk"
import { format } from "../utils/NumberFormat";

export default ( { address ,  decimals , name , symbol , raw , fixed } : {
    address : string,
    decimals : number,
    name : string ,
    symbol : string,
    raw : string,
    fixed : number
} ) => {
    const token = new Token(ChainId.MAINNET , address , decimals , name , symbol);
    return (
        <>{format(new TokenAmount(token,JSBI.BigInt(raw)).toFixed( fixed ))}</>
    )
}