import { Contract, Wallet } from "ethers";
import { HDNode } from "ethers/lib/utils";
import { CallMulticallAggregateContractCall, SyncCallMulticallAggregate } from "../state/multicall/CallMulticallAggregate";

export function getPath(account: number, change: number, addressIndex: number): string {
    return `m/44'/60'/${account}'/${change}/${addressIndex}`;
}


export async function generateSupernodeTypeChildWalletResult(
    mnemonic: string, password: string , supernodeStorageContract : Contract , multicallContract : Contract
    ):Promise<{
        list : {
            address : string , 
            hdNode : HDNode , 
            exist : boolean
        }[], 
        map : {
            [ address : string ] : {
                hdNode : HDNode,
                exist : boolean
            }
        } , 
        selected : string
    }> {

    const addressHDNodeMap: {
        [address: string]: {
            hdNode: HDNode,
            exist: boolean
        }
    } = {};
    const list : {
        address : string , 
        hdNode : HDNode,
        exist : boolean
    }[] = [];
    let selectHDNode: HDNode | undefined;
    let startAddressIndex = 0;
    const size = 1;
    while (!selectHDNode) {
        const HDNodes = generateSupernodeTypeChildWallets(
            mnemonic,
            password,
            startAddressIndex, size
        );
        HDNodes.forEach(hdNode => {
            addressHDNodeMap[hdNode.address] = { hdNode, exist: true };
            list.push({
                address : hdNode.address,
                exist : true,
                hdNode
            });
        });
        const addrExistMNSCalls: CallMulticallAggregateContractCall[] = HDNodes.map(({ address }) => {
            return {
                contract: supernodeStorageContract,
                functionName: "exist",
                params: [address]
            }
        });
        await SyncCallMulticallAggregate(multicallContract, addrExistMNSCalls);
        addrExistMNSCalls.forEach(call => {
            const address = call.params[0];
            addressHDNodeMap[address].exist = call.result;
            list[ addrExistMNSCalls.indexOf( call ) ].exist = call.result;
            
        });
        // 将第一个符合条件的作为默认选择地址
        const notExistAddresses = addrExistMNSCalls.filter(call => call.result).map(call => call.params[0]);
        if (notExistAddresses && notExistAddresses[0]) {
            selectHDNode = addressHDNodeMap[notExistAddresses[0]].hdNode;
        } else {
            startAddressIndex += size;
            if ( startAddressIndex == 10 ){
                selectHDNode = list[0].hdNode;
            }
        }
    }
    const address = selectHDNode.address
    return new Promise( ( resolve , reject ) => {
        resolve({
            map : addressHDNodeMap,
            list : list,
            selected : address
        });
    });

}



export function generateMasternodeTypeChildWallets(mnemonic: string, password: string, addressIndex: number, size: number): HDNode[] {
    const hdNode = HDNode.fromMnemonic(mnemonic, password, undefined)
    const wallets: HDNode[] = [];
    for (let i = addressIndex; i < addressIndex + size; i++) {
        /**
         * account : 1 , Supernode
         * account : 2 , Masternode
         */
        const path = getPath(2, 1, i);
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
        const path = getPath(1, 1, i);
        console.log("path==>", path)
        wallets.push(hdNode.derivePath(path));
    }
    return wallets;
}