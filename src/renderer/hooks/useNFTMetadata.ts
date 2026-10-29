import { useEffect, useState } from "react";
import { INFT_721_Interface as INFT_Interface } from "../abis";
import { useContract, useMulticallContract } from "./useContracts";
import CallMulticallAggregate, { CallMulticallAggregateContractCall } from "../state/multicall/CallMulticallAggregate";
import { BigNumber } from "ethers";

export interface TemplateNFTAssetMetadata {
  name: string,
  symbol: string,
  whitePaperUrl: string,
  officialUrl: string,
  orgName: string,
  description: string,
  totalSupply: BigNumber,
  maxSupply: BigNumber,
  mintPrice: BigNumber,
  baseURI: string
}

export default (address: string) => {

  const multicallContract = useMulticallContract();
  const TokenContract = useContract(address, INFT_Interface, false);
  const [loading, setLoading] = useState<boolean>();
  const [tokenMetadata, setTokenMetadata] = useState<TemplateNFTAssetMetadata>();

  useEffect(() => {
    if (multicallContract && TokenContract) {
      const nameCall: CallMulticallAggregateContractCall = {
        contract: TokenContract,
        functionName: "name",
        params: []
      };
      const symbolCall: CallMulticallAggregateContractCall = {
        contract: TokenContract,
        functionName: "symbol",
        params: []
      };
      const descriptionCall: CallMulticallAggregateContractCall = {
        contract: TokenContract,
        functionName: "description",
        params: []
      };
      const whitePaperUrlCall: CallMulticallAggregateContractCall = {
        contract: TokenContract,
        functionName: "whitePaperUrl",
        params: []
      };
      const orgNameCall: CallMulticallAggregateContractCall = {
        contract: TokenContract,
        functionName: "orgName",
        params: []
      };
      const officiaUrlCall: CallMulticallAggregateContractCall = {
        contract: TokenContract,
        functionName: "officialUrl",
        params: []
      };
      const totalSupplyCall: CallMulticallAggregateContractCall = {
        contract: TokenContract,
        functionName: "totalSupply",
        params: []
      };
      const maxSupplyCall: CallMulticallAggregateContractCall = {
        contract: TokenContract,
        functionName: "maxSupply",
        params: []
      };
      const mintPriceCall: CallMulticallAggregateContractCall = {
        contract: TokenContract,
        functionName: "mintPrice",
        params: []
      };
      const baseURICall: CallMulticallAggregateContractCall = {
        contract: TokenContract,
        functionName: "baseURI",
        params: []
      };
      const calls = [nameCall, symbolCall,
        descriptionCall, whitePaperUrlCall, orgNameCall, officiaUrlCall,
        totalSupplyCall, maxSupplyCall, mintPriceCall,
        baseURICall
      ];
      setLoading(true);
      CallMulticallAggregate(multicallContract, calls, () => {
        setLoading(false);
        const name = nameCall.result;
        const symbol = symbolCall.result;
        const description = descriptionCall.result;
        const whitePaperUrl = whitePaperUrlCall.result;
        const orgName = orgNameCall.result;
        const officialUrl = officiaUrlCall.result;
        const totalSupply = totalSupplyCall.result;
        const maxSupply = maxSupplyCall.result;
        const mintPrice = mintPriceCall.result;
        const baseURI = baseURICall.result;

        const nftTokenMetadata: TemplateNFTAssetMetadata = {
          name, symbol,
          description, whitePaperUrl, orgName, officialUrl,
          totalSupply, maxSupply, mintPrice,
          baseURI
        }
        setTokenMetadata(nftTokenMetadata);
      }, (err: any) => {
        console.log("Error!! >>", err)
      })
    }
  }, [address, multicallContract, TokenContract]);
  return {
    tokenMetadata, loading
  }
}
