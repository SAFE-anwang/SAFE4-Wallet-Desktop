

import { useWeb3React } from "@web3-react/core";
import { useBlockNumber } from "../application/hooks"
import { useEffect } from "react";
import useSafeScan from "../../hooks/useSafeScan";
import { fetchAuditTokens } from "../../services/audit";
import { useDispatch } from "react-redux";
import { updateAuditTokens, updateTokenPriceQuote, updateTokenPrices } from "./actions";
import { fetchMarketPrices } from "../../services/market";
import { Safe4NetworkChainId, USDT, WSAFE } from "../../config";


const REFRESH_INTERVAL = 10000; // 10000 毫秒 = 10 秒

export default () => {
  const { chainId } = useWeb3React();
  const blockNumber = useBlockNumber();
  const { URL, API } = useSafeScan();
  const dispatch = useDispatch();
  const WSAFE_Address = chainId && WSAFE[chainId as Safe4NetworkChainId].address;
  const USDT_Address = chainId && USDT[chainId as Safe4NetworkChainId].address;

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
      if (USDT_Address) {
        fetchMarketPrices(API).then(data => {
          console.log("fetchMarketPrices-USDT", data);
          dispatch(updateTokenPrices({
            chainId,
            tokens: data
          }));
        });
      }
      // Fetch Market Prices for WSAFE
      if (WSAFE_Address) {
        fetchMarketPrices(API, WSAFE_Address).then(data => {
          dispatch(updateTokenPriceQuote({
            chainId,
            quote: WSAFE_Address,
            tokens: data
          }));
        });
      }
    };
    fetchData();
    const intervalId = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [API, chainId, dispatch, URL, WSAFE_Address]);
  return <>
  </>
}
