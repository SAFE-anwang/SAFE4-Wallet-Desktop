import { Channel } from "../ApplicationIpcManager";
import { Context } from "./Context";
import { ListenSignalHandler } from "./ListenSignalHandler";

export const CrosschainSignal = "DB:sqlite3/crosschain";

export enum Crosschain_Methods {
  saveOrUpdate = "saveOrUpdate",
  getByAddress = "getByAddress"
}

export class CrosschainSignalHandler implements ListenSignalHandler {

  private ctx: Context;

  private db: any;

  getSingal(): string {
    return CrosschainSignal;
  }

  constructor(ctx: any, db: any) {
    this.ctx = ctx;
    this.db = db;
    this.db.run(
      "CREATE TABLE IF NOT EXISTS \"crosschains\" ( "
      + "\"asset\" text,"
      + "\"src_address\" TEXT,"
      + "\"src_network\" TEXT,"
      + "\"src_tx_hash\" TEXT,"
      + "\"src_tx_block_number\" INTEGER,"
      + "\"src_tx_timestamp\" integer,"
      + "\"src_amount\" TEXT,"
      + "\"dst_address\" TEXT,"
      + "\"dst_network\" TEXT,"
      + "\"dst_tx_hash\" TEXT,"
      + "\"dst_tx_block_number\" INTEGER,"
      + "\"dst_tx_timestamp\" integer,"
      + "\"fee\" TEXT,"
      + "\"status\" integer"
      + ");",
      [],
      (err: any) => {
        if (err) {
          console.log("[sqlite3] Create Table crosschains Error:", err);
          return;
        }
        console.log("[sqlite3] Check crosschains Exisits.")
      }
    )
  }

  async handleOn(event: Electron.IpcMainEvent, ...args: any[]): Promise<any> {
    const method: string = args[0][1];
    const params: any[] = args[0][2];
    let data = undefined;
    if (Crosschain_Methods.saveOrUpdate == method) {
      const walletName = params[0];
      data = this.saveOrUpdate();
    } else if (Crosschain_Methods.getByAddress == method) {
      this.getByAddress((rows: any) => {
        event.reply(Channel, [this.getSingal(), method, [rows]])
      })
    }
  }

  private saveOrUpdate() {

  }

  private getByAddress(callback: (rows: any) => void) {

  }

}
