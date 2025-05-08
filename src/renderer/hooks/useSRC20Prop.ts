import { useEffect, useState } from "react";
import { ISRC20_Interface } from "../abis";
import { useContract, useMulticallContract } from "./useContracts";
import CallMulticallAggregate, { CallMulticallAggregateContractCall } from "../state/multicall/CallMulticallAggregate";



export interface SRC20TokenProp {
  name: string,
  symbol: string,
  whitePaperUrl: string,
  officialUrl: string,
  orgName: string,
  description: string,
  logoUrl: string
}

export default (address: string) => {

  const multicallContract = useMulticallContract();
  const SRC20Contract = useContract(address, ISRC20_Interface, false);
  const [loading, setLoading] = useState<boolean>();
  const [src20TokenProp, setSrc20TokenProp] = useState<SRC20TokenProp>();

  useEffect(() => {
    if (multicallContract && SRC20Contract) {
      const nameCall: CallMulticallAggregateContractCall = {
        contract: SRC20Contract,
        functionName: "name",
        params: []
      };
      const symbolCall: CallMulticallAggregateContractCall = {
        contract: SRC20Contract,
        functionName: "symbol",
        params: []
      };
      const descriptionCall: CallMulticallAggregateContractCall = {
        contract: SRC20Contract,
        functionName: "description",
        params: []
      };
      const whitePaperUrlCall: CallMulticallAggregateContractCall = {
        contract: SRC20Contract,
        functionName: "whitePaperUrl",
        params: []
      };
      const orgNameCall: CallMulticallAggregateContractCall = {
        contract: SRC20Contract,
        functionName: "orgName",
        params: []
      };
      const officiaUrlCall: CallMulticallAggregateContractCall = {
        contract: SRC20Contract,
        functionName: "officialUrl",
        params: []
      };
      const logoUrlCall: CallMulticallAggregateContractCall = {
        contract: SRC20Contract,
        functionName: "logoUrl",
        params: []
      };
      const calls = [nameCall, symbolCall,
        descriptionCall, whitePaperUrlCall, orgNameCall, officiaUrlCall , logoUrlCall];
      setLoading(true);
      CallMulticallAggregate(multicallContract, calls, () => {
        setLoading(false);
        const name = nameCall.result;
        const symbol = symbolCall.result;
        const description = descriptionCall.result;
        const whitePaperUrl = whitePaperUrlCall.result;
        const orgName = orgNameCall.result;
        const officialUrl = officiaUrlCall.result;
        const logoUrl = logoUrlCall.result;
        const src20Prop: SRC20TokenProp = {
          name, symbol,
          description, whitePaperUrl, orgName, officialUrl , logoUrl
        }
        setSrc20TokenProp(src20Prop);
      })
    }
  }, [address, multicallContract, SRC20Contract]);
  return {
    src20TokenProp , loading
  }
}
