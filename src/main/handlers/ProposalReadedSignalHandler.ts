import { Context } from "./Context";
import { ListenSignalHandler } from "./ListenSignalHandler";

export const ProposalReadedSignal = "DB:sqlite3/proposalReaded";

export enum ProposalReadedSignal_Methods {
  saveOrUpdate = "saveOrUpdate",
}

export class ProposalReadedSignalHandler implements ListenSignalHandler {

  getSingal(): string {
    return ProposalReadedSignal;
  }

  private db: any;
  private ctx: Context;


  constructor(ctx: Context, db: any) {
    this.ctx = ctx;
    this.db = db;
    this.db.run(
      "CREATE TABLE IF NOT EXISTS \"proposal_readed\" ( "
      + "\"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,"
      + " \"chain_id\" INTEGER,"
      + " \"proposal_ids\" blob"
      + ");",
      [],
      (err: any) => {
        if (err) {
          console.log("[sqlite3] Create Table proposal_readed Error:", err);
          return;
        }
        console.log("[sqlite3] Check proposal_readed Exisits.")
      }
    )
  }

  async handleOn(event: Electron.IpcMainEvent, ...args: any[]): Promise<any> {
    const method: string = args[0][1];
    const params: any[] = args[0][2];
    let data = undefined;
    if (ProposalReadedSignal_Methods.saveOrUpdate == method) {
      const [chainId, proposalIds] = params;
      this.saveOrUpdate(chainId, proposalIds)
    }
  }

  private saveOrUpdate(chainId: number, proposalIds: number[]) {
    this.db.all(
      "SELECT * FROM proposal_readed WHERE chain_id = ?",
      [chainId],
      (err: any, rows: any) => {
        if (rows.length == 0) {
          console.log("save proposal_readed for =", proposalIds)
          // do save
          this.db.run(
            "INSERT INTO proposal_readed(chain_id,proposal_ids) VALUES(?,?)",
            [chainId, JSON.stringify(proposalIds)],
            (err: any) => {
              if (err) {
                console.log("save error:", err)
              }
            }
          )
        } else {
          // do update
          console.log("update proposal_readed for =", proposalIds);
          this.db.run(
            "UPDATE proposal_readed Set proposal_ids = ? WHERE chain_id = ?",
            [JSON.stringify(proposalIds), chainId],
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
