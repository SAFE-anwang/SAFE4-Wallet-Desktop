

import { useWeb3React } from "@web3-react/core";
import { useBlockNumber } from "../application/hooks"
import { useEffect } from "react";
import useSafeScan from "../../hooks/useSafeScan";
import { fetchAuditTokens } from "../../services/audit";
import { useDispatch } from "react-redux";
import { updateAuditTokens } from "./actions";


export default () => {
  const { chainId } = useWeb3React();
  const blockNumber = useBlockNumber();
  const { API } = useSafeScan();
  const dispatch = useDispatch();
  useEffect(() => {
    if (API && chainId) {
      fetchAuditTokens(API).then(data => {
        dispatch(updateAuditTokens({
          chainId,
          tokens: data.tokens
        }));
      })
    }
  }, [API, blockNumber, dispatch]);
  return <>
  </>
}
