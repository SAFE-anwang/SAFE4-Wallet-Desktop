

import { useWeb3React } from "@web3-react/core";
import { useBlockNumber } from "../application/hooks"
import { useEffect } from "react";
import useSafeScan from "../../hooks/useSafeScan";
import { fetchAuditTokens } from "../../services/audit";
import { useDispatch } from "react-redux";
import { updateAuditTokens, updateTokenPrices } from "./actions";
import { fetchMarketPrices } from "../../services/market";


const REFRESH_INTERVAL = 10000; // 10000 毫秒 = 10 秒

export default () => {
  const { chainId } = useWeb3React();
  const blockNumber = useBlockNumber();
  const { URL, API } = useSafeScan();
  const dispatch = useDispatch();
  useEffect(() => {
    if (!API || !chainId) {
      return;
    }
    const fetchData = () => {
      // Fetch Audit Tokens
      fetchAuditTokens(API).then(data => {
        dispatch(updateAuditTokens({
          chainId,
          tokens: data.tokens
        }));
      });
      // Fetch Market Prices
      fetchMarketPrices(URL).then(data => {
        dispatch(updateTokenPrices({
          chainId,
          tokens: data
        }));
      });
    };
    fetchData();
    const intervalId = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [API, chainId, dispatch, URL]);
  return <>
  </>
}
