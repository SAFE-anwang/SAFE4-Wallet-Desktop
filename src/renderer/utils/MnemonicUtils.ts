
import * as bip39 from 'bip39';

export function generateMnemonic(){
    const mnemonic = bip39.generateMnemonic();
    return mnemonic;
}