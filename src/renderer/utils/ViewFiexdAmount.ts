import { CurrencyAmount, Fraction, Token, TokenAmount } from "@uniswap/sdk";

const Default_Fixed = 4;

export default ( amount : CurrencyAmount | Fraction , token : Token , fixed ?: number ) : string => {
    let _fixed = Default_Fixed;
    if ( token ){
        if ( fixed ){
            _fixed = fixed < token.decimals ? fixed : 
                           Default_Fixed < token.decimals ? Default_Fixed 
                           : token.decimals;
        } else {
            _fixed = Default_Fixed < token.decimals ? Default_Fixed : token.decimals;
        }
    }
    return amount.toFixed(_fixed);
}