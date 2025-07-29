import { HDNode } from "ethers/lib/utils";

//////////////////////////////////////////////////
export enum SupportNodeAddressSelectType {
  INPUT = 1,
  GEN = 2
}
export const NodeAddressSelectType = {
  INPUT: SupportNodeAddressSelectType.INPUT,
  GEN: SupportNodeAddressSelectType.GEN
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

export function generateNodeChildWallets(
  mnemonic: string, password: string,
  childWalletType: SupportChildWalletType,
  addressIndex: number, size: number,
) {
  let list: {
    address: string,
    path: string,
  }[] = [];
  const HDNodes = childWalletType == SupportChildWalletType.SN
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
  list = HDNodes.map(hdNode => {
    return {
      address: hdNode.address,
      path: hdNode.path,
      privateKey: hdNode.privateKey
    }
  })
  return list;
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
