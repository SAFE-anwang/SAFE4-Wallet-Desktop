


import { Channel } from "../ApplicationIpcManager";
import { Context } from "./Context";
import { ListenSignalHandler } from "./ListenSignalHandler";
const fs = require("fs");

export const ContractCompileSignal = "contract:compile";

export enum ContractCompile_Methods {
  compile = "compile",
}

export class ContractCompileHandler implements ListenSignalHandler {

  private ctx: Context;

  constructor(ctx: Context) {
    this.ctx = ctx;
  }

  getSingal(): string {
    return ContractCompileSignal;
  }


  async handleOn(event: Electron.IpcMainEvent, ...args: any[]): Promise<any> {
    const method: string = args[0][1];
    const params: any[] = args[0][2];
    let data = undefined;
    if (ContractCompile_Methods.compile == method) {
      const [sourceCode, solcVersion, option] = params;
      const result = this.compile(sourceCode, solcVersion, option);
      event.reply(Channel, [this.getSingal(), method, [result]])
    }
  }

  private compile(sourceCode: string, solcVersion: string, option: any) {
    var solc = require("solc");
    var input = {
      language: 'Solidity',
      sources: {
        "contract.sol": {
          content: sourceCode
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['*']
          }
        },
        metadata: {
          useLiteralContent: true,
          // appendCBOR:false,
        }
      },
    };
    const path = `${this.ctx.path.data}/soljson-v0.8.17+commit.8df45f5f.js`;
    solc = solc.setupMethods(require(`${path}`));
    console.log(`Use Solc - ${solc.version()} to compile...`);
    const compileResult = solc.compile( JSON.stringify(input) );
    console.log("compileResult :" , compileResult)
    return compileResult;
  }



}
