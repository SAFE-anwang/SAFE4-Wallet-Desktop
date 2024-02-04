import { AddressActivityVO } from "../../renderer/services";
import { Channel } from "../ApplicationIpcManager";
import { ListenSignalHandler } from "./ListenSignalHandler";


export const DBAddressActivitySignal = "DB:sqlite3/addressActivities";

export enum DB_AddressActivity_Methods {
  saveActivity = "saveActivity",
  updateActivity = "updateActivity",
  loadActivities = "loadActivities",
  saveOrUpdateActivities = "saveOrupdateActivities",
}

export enum DB_AddressActivity_Actions {
  Transfer = "Transfer",
  Call = "Call",

  InternalTransfer = "InternalTransfer",
  erc20Transfer = "erc20Transfer",
  nftTransfer = "nftTransfer",

  AM_Deposit = "AccountManager:SafeDeposit",
  AM_Withdraw = "AccountManager:SafeWithdraw",
  AM_Transfer = "AccountManager:SafeTransfer",

  SystemReward = "SystemReward:"
}

export class DBAddressActivitySingalHandler implements ListenSignalHandler {

  private db: any;

  constructor(db: any) {
    this.db = db;
    this.db.run(
      "CREATE TABLE IF NOT EXISTS \"address_activities\" ( "
      + "\"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,"
      + " \"block_number\" INTEGER,"
      + " \"transaction_hash\" TEXT,"
      + " \"event_log_index\" integer,"
      + " \"timestamp\" integer,"
      + " \"status\" integer,"
      + " \"ref_from\" TEXT,"
      + " \"ref_to\" TEXT,"
      + " \"action\" TEXT,"
      + " \"data\" blob,"
      + " \"added_time\" integer"
      + ");",
      [],
      (err: any) => {
        if (err) {
          console.log("[sqlite3] Create Table Address_Activities Error:", err);
          return;
        }
        console.log("[sqlite3] Check Address_Activities Exisits.")
      })
  }

  getSingal(): string {
    return DBAddressActivitySignal;
  }

  async handleOn(event: Electron.IpcMainEvent, ...args: any[]): Promise<any> {
    const method: string = args[0][1];
    const params: any[] = args[0][2];
    let data = undefined;
    if (DB_AddressActivity_Methods.saveActivity == method) {
      const activity = params[0];
      this.saveActivity(activity);
    } else if (DB_AddressActivity_Methods.updateActivity == method) {
      const receipt = params[0];
      this.updateActivity(receipt);
    } else if (DB_AddressActivity_Methods.loadActivities == method) {
      const address = params[0];
      data = this.loadActivities(address, (rows: any) => {
        event.reply(Channel, [this.getSingal(), method, [rows]])
      });
    } else if (DB_AddressActivity_Methods.saveOrUpdateActivities == method) {
      const addressActivities = params[0];
      this.saveOrUpdateActivities(addressActivities)
    }
  }

  private saveActivity(activity: any) {
    const { hash, refFrom, refTo, action, data, addedTime } = activity;
    this.db.run(
      "INSERT INTO Address_Activities(transaction_hash,ref_from,ref_to,action,data,added_time) VALUES(?,?,?,?,?,?)",
      [hash, refFrom, refTo, action, data, addedTime],
      (err: any) => {
        if (err) {
          console.log("Insert into Address_Activities err:", err, activity);
          return;
        }
        console.log("Insert into Address_Activities successed:", activity)
      });
  }

  private updateActivity(receipt: {
    from: string
    to: string
    contractAddress: string
    transactionIndex: number
    blockHash: string
    transactionHash: string
    blockNumber: number
    status?: number
  }) {
    const { transactionHash, blockNumber, status } = receipt;
    this.db.run(
      "UPDATE Address_Activities SET status = ? , block_number = ? WHERE transaction_hash = ? ",
      [status, blockNumber, transactionHash],
      (err: any) => {
        if (err) {
          console.log("Update Activities Error:", err);
          return;
        }
        console.log("Update Activies successed for tx:", {
          transactionHash, blockNumber, status
        })
      }
    )
  }

  private loadActivities(address: string, callback: (rows: any) => void) {
    this.db.all(
      "SELECT * FROM Address_Activities WHERE ref_from = ? or ref_to = ?",
      [address, address],
      (err: any, rows: any) => {
        if (err) {
          console.log("load activities error:", err, address)
          return;
        }
        console.log(`Load activities for ${address} , size = ${rows.length}`)
        callback(rows);
      }
    )
  }

  private saveOrUpdateActivities(addressActivities: AddressActivityVO[]) {
    console.log("saveorupdate transactions.. >>", addressActivities.length)
    for (let i in addressActivities) {
      const {
        transactionHash, blockNumber, status, eventLogIndex, action, data, refFrom, refTo, timestamp
      } = addressActivities[i];
      this.db.all(
        "SELECT * FROM Address_Activities WHERE action = ? AND event_log_index = ? AND transaction_hash = ?",
        [action,eventLogIndex , transactionHash],
        (err: any, rows: any) => {
          if (err) {
            return;
          }
          if (rows.length == 0) {
            console.log("save activity txhash=", transactionHash)
            // do save
            this.db.run(
              "INSERT INTO Address_Activities(block_number,transaction_hash,event_log_index,timestamp,status,ref_from,ref_to,action,data) VALUES(?,?,?,?,?,?,?,?,?)",
              [blockNumber, transactionHash, eventLogIndex, timestamp, status, refFrom, refTo, action, JSON.stringify(data)],
              (err: any) => {
                if (err) {
                  console.log("save error:", err)
                }
              }
            )
          } else {
            // do update
            console.log("update activity txhash=", transactionHash)
            this.db.run(
              "UPDATE Address_Activities Set timestamp = ? , event_log_index = ? WHERE action = ? AND transaction_hash = ? AND event_log_index = ?",
              [timestamp, eventLogIndex , action, transactionHash],
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

}
