import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react"
import { useBlockNumber } from "../application/hooks";
import { AppDispatch } from "..";
import { useDispatch } from "react-redux";
import { useWalletsActiveAccount } from "../wallets/hooks";
import useSafeScan from "../../hooks/useSafeScan";
import { initCrosschains, updateCrosschains } from "./actions";
import { useCrosschains } from "./hooks";
import { Typography } from "antd";
import { IPC_CHANNEL } from "../../config";
import { Crosschain_Methods, CrosschainSignal, CrosschainSignalHandler } from "../../../main/handlers/CrosschainSignalHandler";
import { fetchCrossChainByAddress } from "../../services/crosschain";

const { Text } = Typography;

export default () => {
  const { provider, chainId } = useWeb3React();
  const latestBlockNumber = useBlockNumber();
  const dispatch = useDispatch<AppDispatch>();
  const activeAccount = useWalletsActiveAccount();
  const { API_Crosschain } = useSafeScan();
  const stateCrosschains = useCrosschains();
  const [safe4BlockNumber, setSafe4BlockNumber] = useState<number | undefined>();

  useEffect(() => {
    if (activeAccount && chainId) {
      window.electron.ipcRenderer.sendMessage(
        IPC_CHANNEL, [CrosschainSignal, Crosschain_Methods.getByAddress, [activeAccount, chainId]]
      );
      window.electron.ipcRenderer.on(
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
              dispatch(initCrosschains(crosschainVOs));
            }
          }
        }
      )
    }
  }, [activeAccount, chainId]);

  useEffect(() => {
    if (stateCrosschains) {
      const unconfirmSafe4BlockNumbers = Object.keys(stateCrosschains).map(srcTxHash => {
        const { srcNetwork, srcTxBlockNumber, dstNetwork, dstTxBlockNumber, status } = stateCrosschains[srcTxHash];
        if (srcNetwork == 'safe4') {
          return status == 4 ? 0 : srcTxBlockNumber;
        }
        return 0
      })
        .filter(blockNumber => blockNumber > 0)
        .sort((a, b) => a - b);
      const confirmSafe4BlockNumbers = Object.keys(stateCrosschains).map(srcTxHash => {
        const { srcNetwork, srcTxBlockNumber, dstNetwork, dstTxBlockNumber, status } = stateCrosschains[srcTxHash];
        if (srcNetwork == 'safe4') {
          return status == 4 ? srcTxBlockNumber : 0;
        } else if (dstNetwork == 'safe4') {
          return dstTxBlockNumber;
        }
        return 0;
      })
        .filter(blockNumber => blockNumber > 0)
        .sort((a, b) => b - a);
      const crosschainSafe4BlockNumber = unconfirmSafe4BlockNumbers.length > 0 ? unconfirmSafe4BlockNumbers[0] :
        confirmSafe4BlockNumbers.length > 0 ? confirmSafe4BlockNumbers[0]
          : 1;
      setSafe4BlockNumber(crosschainSafe4BlockNumber);
    }
  }, [stateCrosschains]);

  // Sync Crosschain Transaction Data
  useEffect(() => {
    if (activeAccount && latestBlockNumber > 0 && chainId && safe4BlockNumber) {
      console.log(`Fetch CrosschainDatas for ${activeAccount} by BlockNumber[${safe4BlockNumber}] // ${API_Crosschain}`)
      fetchCrossChainByAddress(API_Crosschain, { address: activeAccount })
        .then(data => {
          console.log("Fetch crosschain data ==" , data)
          dispatch(updateCrosschains(data));
          window.electron.ipcRenderer.sendMessage(
            IPC_CHANNEL, [CrosschainSignal, Crosschain_Methods.saveOrUpdate, [data , chainId]]
          )
        });
    }
  }, [activeAccount, latestBlockNumber, chainId]);

  return <>
    {/* <Text>
      {JSON.stringify(stateCrosschains)}
    </Text> */}
  </>
}
