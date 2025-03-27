import { Token } from "@uniswap/sdk";
import { ethers } from "ethers";
import { Safe4NetworkChainId, SafeswapV2FactoryAddreess, SafeswapV2InitCodeHash, WSAFE } from "../../../config";



export function calculateAmountOut(){

}

export function calculateAmountIn(){

}

export function calculatePaireAddress(_tokenA : Token | undefined , _tokenB : Token | undefined , chainId : number) : string | undefined {
    if ( _tokenA == undefined && _tokenB == undefined ){
        return undefined;
    }
    const tokenA : Token = _tokenA ? _tokenA : WSAFE[ chainId as Safe4NetworkChainId ];
    const tokenB : Token = _tokenB ? _tokenB : WSAFE[ chainId as Safe4NetworkChainId ];

    const [token0, token1] = tokenA.address.toLowerCase() < tokenB.address.toLowerCase() ? [tokenA.address, tokenB.address] : [tokenB.address, tokenA.address];
    const pairAddress = ethers.utils.getCreate2Address(
        SafeswapV2FactoryAddreess,
        ethers.utils.keccak256(ethers.utils.solidityPack(["address", "address"], [token0, token1])),
        SafeswapV2InitCodeHash
    );
    return pairAddress;
}
