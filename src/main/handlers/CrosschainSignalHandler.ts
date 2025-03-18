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
      + "\"src_amount\" TEXT,"
      + "\"src_tx_hash\" TEXT,"
      + "\"src_tx_block_number\" INTEGER,"
      + "\"src_tx_timestamp\" integer,"
      + "\"dst_address\" TEXT,"
      + "\"dst_network\" TEXT,"
      + "\"dst_amount\" TEXT,"
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
      const crosschainDataVOs = params[0];
      data = this.saveOrUpdate(crosschainDataVOs);
    } else if (Crosschain_Methods.getByAddress == method) {
      this.getByAddress(params[0], (rows: any) => {
        event.reply(Channel, [this.getSingal(), method, [rows]])
      })
    }
  }

  private saveOrUpdate(crosschainDataVOs: {
    asset: string,
    srcNetwork: string,
    srcAddress: string,
    srcAmount: string,
    srcTxBlockNumber: number,
    srcTxHash: string,
    srcTxTimestamp: number,
    dstNetwork: string,
    dstAddress: string,
    dstAmount: string,
    dstTxBlockNumber: number,
    dstTxHash: string,
    dstTxTimestamp: number,
    fee: string,
    status: number
  }[]) {
    crosschainDataVOs.forEach(crosschainVO => {
      const { asset,
        srcNetwork, srcAddress, srcAmount, srcTxBlockNumber, srcTxHash, srcTxTimestamp,
        dstNetwork, dstAddress, dstAmount, dstTxBlockNumber, dstTxHash, dstTxTimestamp,
        fee, status
      } = crosschainVO;
      this.db.all(
        "SELECT * FROM crosschains where src_tx_hash = ?",
        [srcTxHash],
        (err: any, rows: any) => {
          if (!err) {
            if (rows.length == 0) {
              this.db.run(
                "INSERT INTO crosschains(asset,src_network,src_address,src_amount,src_tx_block_number,src_tx_hash,src_tx_timestamp,dst_network,dst_address,dst_amount,dst_tx_block_number,dst_tx_hash,dst_tx_timestamp,fee,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                [asset, srcNetwork, srcAddress, srcAmount, srcTxBlockNumber, srcTxHash, srcTxTimestamp, dstNetwork, dstAddress, dstAmount, dstTxBlockNumber, dstTxHash, dstTxTimestamp, fee, status],
                (err: any, rows: any) => {
                  if (err) {
                    console.log("Insert INTO crosschains ERROR!", err)
                  }
                })
            } else {
              this.db.run(
                "UPDATE crosschains SET asset = ?,src_network = ?,src_address= ?,src_amount= ?,src_tx_block_number= ?,src_tx_timestamp= ?,dst_network= ?,dst_address= ?,dst_amount= ?,dst_tx_block_number= ?,dst_tx_hash= ?,dst_tx_timestamp= ?,fee= ?,status= ? where src_tx_hash = ?",
                [asset, srcNetwork, srcAddress, srcAmount, srcTxBlockNumber, srcTxTimestamp, dstNetwork, dstAddress, dstAmount, dstTxBlockNumber, dstTxHash, dstTxTimestamp, fee, status, srcTxHash],
                (err: any, rows: any) => {
                  if (err) {
                    console.log("Update crosschains ERROR!", err)
                  }
                }
              )
            }
          } else {
            console.log("Error :", err)
          }
        })
    })

  }

  private getByAddress(address: string, callback: (rows: any) => void) {
    this.db.all(
      "SELECT * FROM crosschains where src_address = ? or dst_address = ?",
      [address.toLowerCase()],
      (err: any, rows: any) => {
        callback(rows);
      }
    )
  }

}
