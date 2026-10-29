import { SRC721_ABI, SRC721_Bytecode, SRC721_Sourcecode } from "./SRC721_0.0.5";
import { SRC721_Burnable_ABI, SRC721_Burnable_Bytecode, SRC721_Burnable_Sourcecode } from "./SRC721_Burnable_0.0.5";


export enum NFT_Template_Option {
  SRC721 = "SRC721",
  SRC721_burnable = "SRC721_burnable",
}

export const NFT_Template_CompileOption = { "compileVersion": "v0.8.17+commit.8df45f5f", "evmVersion": "", "optimizer": { "enabled": true, "runs": 200 } };

export const NFT_Template: { [option in NFT_Template_Option]: {
  bytecode: string,
  abi: string,
  sourceCode: string
} } = {
  SRC721: {
    abi: JSON.stringify(SRC721_ABI),
    bytecode: SRC721_Bytecode,
    sourceCode: SRC721_Sourcecode
  },
  SRC721_burnable: {
    abi: JSON.stringify(SRC721_Burnable_ABI),
    bytecode: SRC721_Burnable_Bytecode,
    sourceCode: SRC721_Burnable_Sourcecode
  }
}
