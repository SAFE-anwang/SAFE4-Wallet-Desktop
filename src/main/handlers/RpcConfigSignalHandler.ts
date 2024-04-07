import { ListenSignalHandler } from "./ListenSignalHandler";


export const RpcConfigSignal = "DB:sqlite3/rpcConfig";

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
  }

}
