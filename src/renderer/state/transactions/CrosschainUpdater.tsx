import { useWeb3React } from "@web3-react/core";
import { useEffect } from "react"
import { useBlockNumber } from "../application/hooks";
import { AppDispatch } from "..";
import { useDispatch } from "react-redux";
import { useWalletsActiveAccount } from "../wallets/hooks";
import useSafeScan from "../../hooks/useSafeScan";
import { updateCrosschains } from "./actions";
import { useCrosschains } from "./hooks";
import { Typography } from "antd";
import { IPC_CHANNEL } from "../../config";
import { Crosschain_Methods, CrosschainSignal, CrosschainSignalHandler } from "../../../main/handlers/CrosschainSignalHandler";

const { Text } = Typography;

export default () => {
  const { provider, chainId } = useWeb3React();
  const latestBlockNumber = useBlockNumber();
  const dispatch = useDispatch<AppDispatch>();
  const activeAccount = useWalletsActiveAccount();
  const { API_Crosschain } = useSafeScan();
  const stateCrosschains = useCrosschains();

  useEffect(() => {
    if (activeAccount) {
      window.electron.ipcRenderer.sendMessage(
        IPC_CHANNEL, [CrosschainSignal, Crosschain_Methods.getByAddress, [activeAccount]]
      );
      window.electron.ipcRenderer.once(
        IPC_CHANNEL, (arg) => {
          if (arg instanceof Array && arg[0] == CrosschainSignal && arg[1] == Crosschain_Methods.getByAddress) {
            if (arg[2] && arg[2][0] instanceof Array) {
              const crosschainVOs = arg[2][0].map(row => {
                const {
                  asset,
                  src_tx_hash, src_address, src_tx_block_number, src_tx_timestamp, src_amount, src_network,
                  dst_tx_hash, dst_address, dst_tx_block_number, dst_tx_timestamp, dst_amount, dst_network,
                  fee, status
                } = row;
                return {
                  asset,
                  srcAddress: src_address,
                  srcNetwork: src_network,
                  srcAmount: src_amount,
                  srcTxHash: src_tx_hash,
                  srcTxBlockNumber: src_tx_block_number,
                  srcTxTimestamp: src_tx_timestamp,
                  dstAddress: dst_address,
                  dstNetwork: dst_network,
                  dstAmount: dst_amount,
                  dstTxHash: dst_tx_hash,
                  dstTxBlockNumber: dst_tx_block_number,
                  dstTxTimestamp: dst_tx_timestamp,
                  fee,
                  status
                }
              });
              setTimeout(
                () => dispatch(updateCrosschains(crosschainVOs)),
                500
              )
            }
          }
        }
      )
    }
  }, [activeAccount]);

  // Sync Crosschain Transaction Data
  useEffect(() => {
    if (activeAccount && latestBlockNumber > 0 && chainId) {
      console.log(">> ", stateCrosschains);
      // const unconfirmSafe4BlockNumbers =
      const numbers = Object.keys(stateCrosschains).map(srcTxHash => {
        const { srcNetwork, srcTxBlockNumber, dstNetwork, dstTxBlockNumber , status } = stateCrosschains[srcTxHash];
        if (srcNetwork == 'safe4') {
          return srcTxBlockNumber;
        }
        if (dstNetwork == 'safe4') {
          return dstTxBlockNumber;
        }
        return 0
      }).sort( (a , b) => b - a );
      const maxSafe4BlockNumber = numbers ? numbers[0] : 1;
      console.log("Max Safe4BlockNumber =" , maxSafe4BlockNumber)
      // fetchCrossChainByAddress(API_Crosschain, {address: activeAccount})
      //   .then(data => {
      //     dispatch(updateCrosschains(data));
      //     window.electron.ipcRenderer.sendMessage(
      //       IPC_CHANNEL, [CrosschainSignal, Crosschain_Methods.saveOrUpdate, [data]]
      //     )
      //   });
    }
  }, [activeAccount, latestBlockNumber, chainId, stateCrosschains])
  return <>
    <Text>
      {JSON.stringify(stateCrosschains)}
    </Text>
  </>
}
