


import { Channel } from "../ApplicationIpcManager";
import { Context } from "./Context";
import { ListenSignalHandler } from "./ListenSignalHandler";
const fs = require("fs");

export const ContractCompileSignal = "contract:compile";

export enum ContractCompile_Methods {
  compile = "compile",
  save = "save",
  getAll = "getAll",
  getContract = "getContract"
}

export class ContractCompileHandler implements ListenSignalHandler {

  private ctx: Context;

  private db: any;

  constructor(ctx: Context, db: any) {
    this.ctx = ctx;
    this.db = db;

    this.db.run("CREATE TABLE IF NOT EXISTS \"contracts\" ( "
      + "\"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,"
      + "\"address\" text,"
      + "\"creator\" TEXT,"
      + "\"transaction_hash\" TEXT,"
      + "\"chain_id\" INTEGER,"
      + "\"name\" TEXT,"
      + "\"source_code\" blob,"
      + "\"abi\" blob,"
      + "\"bytecode\" blob,"
      + "\"compile_config\" TEXT,"
      + "\"added_time\" integer"
      + ");",
      [],
      (err: any) => {
        if (err) {
          console.log("[sqlite3] Create Table Contracts Error :", err);
          return;
        }
        console.log("[sqlite3] Check Contracts Exisits.");
      })

  }

  getSingal(): string {
    return ContractCompileSignal;
  }


  async handleOn(event: Electron.IpcMainEvent, ...args: any[]): Promise<any> {
    const method: string = args[0][1];
    const params: any[] = args[0][2];
    let data = undefined;
    if (ContractCompile_Methods.compile == method) {
      const [sourceCode, option] = params;
      const result = this.compile(sourceCode, option);
      event.reply(Channel, [this.getSingal(), method, [result]])
    } else if (ContractCompile_Methods.save == method) {
      const contract = params[0];
      this.save(contract);
    } else if (ContractCompile_Methods.getAll == method) {
      const chainId = params[0];
      this.getAll(chainId, (rows: any) => {
        event.reply(Channel, [this.getSingal(), method, [rows]])
      })
    } else if (ContractCompile_Methods.getContract == method) {
      const [chainId, address] = params;
      this.getContract(chainId, address, (row: any) => {
        event.reply(Channel, [this.getSingal(), method, [row]])
      })
    }
  }

  private getContract(chainId: number, address: string, callback: ((row: any) => void)) {
    this.db.all("SELECT * FROM Contracts WHERE chain_id = ? AND address = ?", [chainId, address],
      (err: any, rows: any) => {
        if (!err) {
          console.log("Load Contract :", rows);
          if (rows.length > 0) {
            callback(rows[0]);
          }
        }
      });
  }

  private getAll(chainId: number, callback: (rows: any) => void) {
    this.db.all("SELECT * FROM Contracts WHERE chain_id = ?", [chainId],
      (err: any, rows: any) => {
        if (!err) {
          console.log("Load All Contracts ...", rows.length)
          callback(rows);
        }
      });
  }

  private save(contract: any) {
    const { address, creator, chainId, name, bytecode, abi, sourceCode, transactionHash, addedTime } = contract;
    console.log("Save Contract:", contract)
    this.db.run("INSERT INTO contracts(address,creator,chain_id,name,bytecode,abi,source_code,transaction_hash,added_time) VALUES(?,?,?,?,?,?,?,?,?)",
      [address, creator, chainId, name, bytecode, abi, sourceCode, transactionHash, addedTime],
      (err: any) => {
        if (err) {
          console.log("Save Contract Error :", err)
        } else {
          console.log("Save Contract Success.")
        }
      });
  }

  private compile(sourceCode: string, option: any) {
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
        },
        evmVersion : undefined,
        optimizer : {
          enable : false,
          runs : 200
        }
      },
    };
    if (option.evmVersion) {
      input.settings.evmVersion = option.evmVersion;
    }
    if (option.optimizer) {
      input.settings.optimizer = option.optimizer;
    }
    const path = `${this.ctx.path.data}/soljson-v0.8.17+commit.8df45f5f.js`;
    solc = solc.setupMethods(require(`${path}`));
    console.log(`Use Solc - ${solc.version()} to compile ,` , option);
    const compileResult = solc.compile(JSON.stringify(input));
    // console.log("compileResult :" , compileResult)
    return compileResult;
  }



}
