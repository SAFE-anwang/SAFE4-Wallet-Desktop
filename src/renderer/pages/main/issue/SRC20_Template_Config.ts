import { SRC20_ABI, SRC20_Bytecode, SRC20_Sourcecode } from "./SRC20"
import { SRC20_Burnable_Abi, SRC20_Burnable_Bytecode, SRC20_Burnable_SourceCode } from "./SRC20-burnable"
import { SRC20_Mintable_Abi, SRC20_Mintable_Bytecode, SRC20_Mintable_SourceCode } from "./SRC20-mintable"
import { SRC20_Pausable_Abi, SRC20_Pausable_Bytecode, SRC20_Pausable_SourceCode } from "./SRC20-pausable"

export enum SRC20_Template_Option {
    SRC20 = "SRC20",
    SRC20_burnable = "SRC20_burnable",
    SRC20_mintable = "SRC20_mintable",
    SRC20_pausable = "SRC20_pausable"
}

export const SRC20_Template_CompileOption = { "compileVersion": "v0.8.17+commit.8df45f5f", "evmVersion": "", "optimizer": { "enabled": true, "runs": 200 } };

export const SRC20_Template: { [option in SRC20_Template_Option]: {
    bytecode: string,
    abi: string,
    sourceCode: string
} } = {
    SRC20: {
        abi: JSON.stringify(SRC20_ABI),
        bytecode: SRC20_Bytecode,
        sourceCode: SRC20_Sourcecode
    },
    SRC20_burnable: {
        abi: JSON.stringify(SRC20_Burnable_Abi),
        bytecode: SRC20_Burnable_Bytecode,
        sourceCode: SRC20_Burnable_SourceCode
    },
    SRC20_mintable: {
        abi: JSON.stringify(SRC20_Mintable_Abi),
        bytecode: SRC20_Mintable_Bytecode,
        sourceCode: SRC20_Mintable_SourceCode
    },
    SRC20_pausable: {
        abi: JSON.stringify(SRC20_Pausable_Abi),
        bytecode: SRC20_Pausable_Bytecode,
        sourceCode: SRC20_Pausable_SourceCode
    }
}

