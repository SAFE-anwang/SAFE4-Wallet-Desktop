import { Contract, Wallet } from "ethers";
import { HDNode } from "ethers/lib/utils";
import { SystemContract } from "../constants/SystemContracts";
import CallMulticallAggregate, { CallMulticallAggregateContractCall, SyncCallMulticallAggregate } from "../state/multicall/CallMulticallAggregate";


//////////////////////////////////////////////////
export enum SupportNodeAddressSelectType {
  INPUT = 1,
  GEN = 2
}
export const NodeAddressSelectType = {
  INPUT : SupportNodeAddressSelectType.INPUT,
  GEN : SupportNodeAddressSelectType.GEN
}
///////////////////////////////////////////////////

export enum SupportChildWalletType {
  SN = 1,
  MN = 2
}
export const WalletType = {
  SN: SupportChildWalletType.SN,
  MN: SupportChildWalletType.MN
}

export function getPath(account: SupportChildWalletType, change: number, addressIndex: number): string {
  return `m/44'/60'/${account}'/${change}/${addressIndex}`;
}

export function generateChildWalletsCheckResult(
  mnemonic: string, password: string,
  addressIndex: number, size: number,
  nodeStorage: Contract, multicallContract: Contract,
  callback: (err: any, result: {
    list: { address: string, hdNode: HDNode, exist: boolean }[],
    map: {
      [address: string]: { hdNode: HDNode, exist: boolean }
    }
  }) => void
) {
  const addressHDNodeMap: {
    [address: string]: {
      hdNode: HDNode,
      exist: boolean
    }
  } = {};
  const list: {
    address: string,
    hdNode: HDNode,
    exist: boolean
  }[] = [];
  const HDNodes = nodeStorage.address == SystemContract.SuperNodeStorage
    ? generateSupernodeTypeChildWallets(
      mnemonic,
      password,
      addressIndex,
      size
    )
    : generateMasternodeTypeChildWallets(
      mnemonic,
      password,
      addressIndex,
      size
    );
  HDNodes.forEach(hdNode => {
    addressHDNodeMap[hdNode.address] = { hdNode, exist: true };
    list.push({
      address: hdNode.address,
      exist: true,
      hdNode
    });
  });
  const addrExistCalls: CallMulticallAggregateContractCall[] = HDNodes.map(({ address }) => {
    return {
      contract: nodeStorage,
      functionName: "exist",
      params: [address]
    }
  });
  CallMulticallAggregate(multicallContract, addrExistCalls, () => {
    addrExistCalls.forEach(call => {
      const address = call.params[0];
      addressHDNodeMap[address].exist = call.result;
      list[addrExistCalls.indexOf(call)].exist = call.result;
    });
    callback(undefined, {
      map: addressHDNodeMap,
      list
    });
  }, (err: any) => {
    callback(err, {
      map: addressHDNodeMap,
      list
    });
  })
}

export function generateMasternodeTypeChildWallets(mnemonic: string, password: string, addressIndex: number, size: number): HDNode[] {
  const hdNode = HDNode.fromMnemonic(mnemonic, password, undefined)
  const wallets: HDNode[] = [];
  for (let i = addressIndex; i < addressIndex + size; i++) {
    /**
     * account : 1 , Supernode
     * account : 2 , Masternode
     */
    const path = getPath(SupportChildWalletType.MN, 1, i);
    wallets.push(hdNode.derivePath(path));
  }
  return wallets;
}

export function generateSupernodeTypeChildWallets(mnemonic: string, password: string, addressIndex: number, size: number): HDNode[] {
  const hdNode = HDNode.fromMnemonic(mnemonic, password, undefined)
  const wallets: HDNode[] = [];
  for (let i = addressIndex; i < addressIndex + size; i++) {
    /**
     * account : 1 , Supernode
     * account : 2 , Masternode
     */
    const path = getPath(SupportChildWalletType.SN, 1, i);
    wallets.push(hdNode.derivePath(path));
  }
  return wallets;
}

export function generateChildWallet(mnemonic: string, password: string, path: string): HDNode {
  const hdNode = HDNode.fromMnemonic(mnemonic, password, undefined)
    .derivePath(path);
  return hdNode;
}
