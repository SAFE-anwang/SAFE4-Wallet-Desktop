import { ListenSignalHandler } from "./ListenSignalHandler";


export const RpcConfigSignal = "DB:sqlite3/rpcConfig";

export enum RpcConfig_Methods {
  saveOrUpdate = "saveOrUpdate",
}

export class RpcConfigSingalHandler implements ListenSignalHandler {

  getSingal(): string {
    return RpcConfigSignal;
  }

  private db: any;

  constructor(db: any) {
    this.db = db;
    this.db.run(
      "CREATE TABLE IF NOT EXISTS \"rpc_config\" ( "
      + "\"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,"
      + " \"chain_id\" INTEGER,"
      + " \"block_number\" INTEGER,"
      + " \"endpoint\" text,"
      + " \"active\" INTEGER"
      + ");",
      [],
      (err: any) => {
        if (err) {
          console.log("[sqlite3] Create Table rpc_config Error:", err);
          return;
        }
        console.log("[sqlite3] Check rpc_config Exisits.")
      }
    )
  }

  async handleOn(event: Electron.IpcMainEvent, ...args: any[]): Promise<any> {
    const method: string = args[0][1];
    const params: any[] = args[0][2];
    let data = undefined;
    if (RpcConfig_Methods.saveOrUpdate == method) {
      const rpcConfig = params[0];
      data = this.saveOrUpdate( rpcConfig );
    }
  }

  private saveOrUpdate( rpcConfig : { endpoint : string , chainId : number , active : number } ) {
    const { endpoint , chainId  , active } = rpcConfig;
    if ( active == 1 ) {
      this.db.run("update rpc_config set active = 0" , [] , (error : any) => {

      })
    }
    this.db.all(
      "SELECT * FROM rpc_config WHERE endpoint = ?",
      [endpoint],
      (err: any, rows: any) => {
        if (err) {
          return;
        }
        if (rows.length == 0) {
          console.log("save rpc-config =", endpoint)
          // do save
          this.db.run(
            "INSERT INTO rpc_config(chain_id,endpoint,active) VALUES(?,?,?)",
            [chainId , endpoint , active],
            (err: any) => {
              if (err) {
                console.log("save error:", err)
              }
            }
          )
        } else {
          // do update
          console.log("update rpc-config:", JSON.stringify(rpcConfig));
          this.db.run(
            "UPDATE rpc_config Set chain_id = ? , active = ? WHERE endpoint = ?",
            [chainId, active, endpoint],
            (err: any) => {
              if (err) {
                console.log("update error!!!")
              }
            }
          )
        }
      }
    )
  }

}
