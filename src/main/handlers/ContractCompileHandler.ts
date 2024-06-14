


import path, { join } from "path";
import { Channel } from "../ApplicationIpcManager";
import { Context } from "./Context";
import { ListenSignalHandler } from "./ListenSignalHandler";
const fs = require("fs");

export const ContractCompileSignal = "contract:compile";

export enum ContractCompile_Methods {
  compile = "compile",
  save = "save",
  getAll = "getAll",
  getContract = "getContract",
  getSolcVersions = "getSolcVersions"
}

// data/solc_library 目录下下载保存 solc-各版本的编译执行文件
const SOLC_BINS = "solc_library";
const LIST_URI = "https://binaries.soliditylang.org/bin/list.json";


function requireFromString(src: string, filename: string) {
  var Module = module.constructor;
  var m = new Module();
  m._compile(src, filename);
  return m.exports;
}

export class ContractCompileHandler implements ListenSignalHandler {

  private ctx: Context;

  private db: any;

  private solcBinsAbsPath: string;

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
      + "\"compile_option\" TEXT,"
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

    this.solcBinsAbsPath = path.join(ctx.path.data, SOLC_BINS);
    if (!fs.existsSync(this.solcBinsAbsPath)) {
      // 文件夹不存在，创建文件夹
      fs.mkdirSync(this.solcBinsAbsPath);
      console.log('文件夹 "solc-bins" 已创建:', this.solcBinsAbsPath);
    } else {
      console.log('文件夹 "solc-bins" 已存在:', this.solcBinsAbsPath);
    }
    this.syncSolcBins();
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
    } else if (ContractCompile_Methods.getSolcVersions == method) {
      event.reply(Channel, [this.getSingal(), method, [this.getSolcVersions()]])
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
    const { address, creator, chainId, name, bytecode, abi, sourceCode, transactionHash, addedTime, compileOption } = contract;
    console.log("Save Contract:", contract)
    this.db.run("INSERT INTO contracts(address,creator,chain_id,name,bytecode,abi,source_code,transaction_hash,added_time,compile_option) VALUES(?,?,?,?,?,?,?,?,?,?)",
      [address, creator, chainId, name, bytecode, abi, sourceCode, transactionHash, addedTime, compileOption],
      (err: any) => {
        if (err) {
          console.log("Save Contract Error :", err)
        } else {
          console.log("Save Contract Success.")
        }
      });
  }

  private getSolcVersions(): string[] {
    var solc = require("solc");
    try {
      const solcBinFiles = fs.readdirSync(this.solcBinsAbsPath);
      return solcBinFiles.filter((fileName: string) => fileName.indexOf("downloading") < 0);
    } catch (err: any) {
      return [solc.version()];
    }
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
        evmVersion: undefined,
        optimizer: {
          enable: false,
          runs: 200
        }
      },
    };
    if (option.evmVersion) {
      input.settings.evmVersion = option.evmVersion;
    }
    if (option.optimizer) {
      input.settings.optimizer = option.optimizer;
    }

    const binPath = path.join(this.solcBinsAbsPath, `soljson-${option.compileVersion}.js`);
    const currentSolcVersion = "v" + solc.version();
    if (currentSolcVersion.indexOf(option.compileVersion) < 0) {
      // solc = solc.setupMethods(require(`${binPath}`));
      // console.log("Switch Solc Version To >>" , binPath );
      const _js = fs.readFileSync(binPath, "utf8");
      const _require = requireFromString(_js, '');

      const vm = require('vm');
      const sandbox : any = {};
      vm.createContext(sandbox); // 创建沙箱上下文
      // 执行文件内容，将其导出对象存储到沙箱中
      const script = new vm.Script(_js);
      script.runInContext(sandbox);
      // 从沙箱中获取导出的模块
      // const exportedModule = sandbox.module.exports;
      console.log("exported module >>" , sandbox.Module);
      // console.log("_require >>" , _require)
      solc = solc.setupMethods(sandbox.Module);
      console.log("Switch Solc Version To >>", binPath);
    }
    console.log(`Use Solc - ${solc.version()} to compile ,`, option);
    const compileResult = solc.compile(JSON.stringify(input));
    return compileResult;
  }

  private syncSolcBins(): string[] {
    var solc = require("solc");
    const https = require("https");
    try {
      const solcBinFiles = fs.readdirSync(this.solcBinsAbsPath);
      https.get(LIST_URI, (response: any) => {
        let data = '';
        response.on('data', (chunk: any) => {
          data += chunk;
        });
        response.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            console.log(`${LIST_URI} /.release = ${JSON.stringify(jsonData.releases)}`)
            this.download(jsonData.releases, jsonData.builds)
          } catch (error: any) {
            console.error('Error parsing JSON:', error.message);
          }
        });
      }).on('error', (error: any) => {
        console.error('Error making HTTPS request:', error.message);
      });

      return solcBinFiles;
    } catch (err: any) {
      return [solc.version()];
    }
  }

  private download(releases: any, builds: any) {
    const filesSha256: {
      [path: string]: any
    } = {
    }
    for (let i in builds) {
      let path = builds[i].path;
      let fileSha256Val = builds[i].sha256;
      filesSha256[path] = fileSha256Val;
    }
    for (let ver in releases) {
      const fullversionjs = releases[ver];
      const destinationPath = path.join(this.solcBinsAbsPath, fullversionjs);
      fs.access(destinationPath, fs.constants.F_OK, (err: any) => {
        if (err) {
          this.downloadFile(fullversionjs);
        }
      })
    }
  }

  private downloadFile(fullversionjs: string) {
    const https = require("https");
    const url = `https://binaries.soliditylang.org/bin/${fullversionjs}`;
    const destinationPath = path.join(this.solcBinsAbsPath, fullversionjs + ".downloading");
    const finishPath = path.join(this.solcBinsAbsPath, fullversionjs);
    const fileStream = fs.createWriteStream(destinationPath);
    console.log(`Downloading ${fullversionjs} From ${url}`);
    https.get(url, (response: any) => {
      // 检查响应状态码
      if (response.statusCode !== 200) {
        console.error(`Failed to download the file. Status Code: ${response.statusCode}`);
        return;
      }
      // 将响应管道到文件流
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        fs.renameSync(
          destinationPath,
          finishPath
        );
        console.log(`File downloaded - ${fullversionjs} - successfully.`);
      });
    }).on('error', (err: any) => {
      console.error(`Error downloading the file:${fullversionjs} : ${err.message}`);
    });
  }

}
