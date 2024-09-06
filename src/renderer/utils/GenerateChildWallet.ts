import { Wallet } from "ethers";
import { HDNode } from "ethers/lib/utils";

export function getPath( account : number , change : number , addressIndex : number ) : string {
    return `m/44'/60'/${account}'/${change}/${addressIndex}`;
}

export function generateMasternodeTypeChildWallet( mnemonic : string , password : string , addressIndex : number ){

}

export function generateMasternodeTypeChildWallets( mnemonic : string , password : string , addressIndex : number , size : number ) : HDNode[]{
    const hdNode = HDNode.fromMnemonic(mnemonic, password, undefined)
    const wallets : HDNode[] = [];
    for( let i = addressIndex; i<addressIndex + size;i++ ){
        /**
         * account : 1 , Supernode
         * account : 2 , Masternode
         */
        const path = getPath( 2 , 1 , i );
        wallets.push( hdNode.derivePath( path ) );
    }
    return wallets;
}

export function generateSupernodeTypeChildWallets( mnemonic : string , password : string , addressIndex : number , size : number ) : HDNode[]{
    const hdNode = HDNode.fromMnemonic(mnemonic, password, undefined)
    const wallets : HDNode[] = [];
    for( let i = addressIndex; i<addressIndex + size;i++ ){
        /**
         * account : 1 , Supernode
         * account : 2 , Masternode
         */
        const path = getPath( 1 , 1 , i );
        console.log("path==>",path)
        wallets.push( hdNode.derivePath( path ) );
    }
    return wallets;
}