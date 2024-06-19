import { useWalletsWalletNames } from "../state/wallets/hooks";

export default ( address : string | undefined ) : string | undefined => {
  const walletNames = useWalletsWalletNames();
  return walletNames && address && walletNames[address] ? walletNames[address].name : undefined;
}
