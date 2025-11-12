import { ChainId } from '@uniswap/sdk';
import { AddressActivityVO } from "../../renderer/services";
import { Channel } from "../ApplicationIpcManager";
import { ListenSignalHandler } from "./ListenSignalHandler";


export const DBAddressActivitySignal = "DB:sqlite3/addressActivities";

export enum DB_AddressActivity_Methods {
  saveActivity = "saveActivity",
  updateActivity = "updateActivity",
  loadActivities = "loadActivities",
  saveOrUpdateActivities = "saveOrupdateActivities",
  deleteAddressActivities = "DeleteAddressActivieis",
  getActivitiesFromToAction = "getActivitiesFromToAction"
}

export enum DB_AddressActivity_Actions {

  Transfer = "Transfer",  // 转账
  Call = "Call",          // 调用合约
  Create = "Create",      // 创建合约

  InternalTransfer = "InternalTransfer",
  TokenTransfer = "TokenTransfer",
  nftTransfer = "NftTransfer",

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
      + " \"added_time\" integer,"
      + " \"chain_id\" integer"
      + ");",
      [],
      (err: any) => {
        if (err) {
          console.log("[sqlite3] Create Table Address_Activities Error:", err);
          return;
        }
        console.log("[sqlite3] Check Address_Activities Exisits.");
        this.updateChainId();
      })
  }

  private updateChainId() {
    this.db.all("PRAGMA table_info(address_activities)", [], (err: any, rows: any) => {
      let chainIdExists = false;
      rows.forEach((row: any) => {
        if (row.name == "chain_id") {
          chainIdExists = true;
        }
      });
      if (!chainIdExists) {
        console.log("[sqlite3] address_activities.chain_id not exists.")
        this.db.run("ALTER TABLE address_activities ADD chain_id INTEGER", (err: any) => {
          if (!err) {
            // 更新chain_id字段为 测试链数据.
            this.db.run("UPDATE address_activities SET chain_id = ?", [6666666], (err: any) => {
              if (!err) {
                console.log("[sqlite3] address_activities.chain_id update success..");
              } else {
                console.log("[sqlite3] address_activities.chain_id update testchain_id error:", err)
              }
            })
          } else {
            console.log("[sqlite3] address_activities.chain_id update error:", err)
          }
        });
      } else {
        console.log("[sqlite3] address_activities.chain_id exists,not need to update.")
      }
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
      const chainId = params[1];
      const blockNumber = params[2];
      const limit = params[3];
      data = this.loadActivities(address, chainId, blockNumber, limit, (rows: any) => {
        event.reply(Channel, [this.getSingal(), method, [rows, blockNumber]])
      });
    } else if (DB_AddressActivity_Methods.saveOrUpdateActivities == method) {
      const [addressActivities, chainId] = params;
      this.saveOrUpdateActivities(addressActivities, chainId)
    } else if (DB_AddressActivity_Methods.deleteAddressActivities == method) {
      const [address, chainId] = params;
      this.deleteAddressActivities(address, chainId);
    } else if (DB_AddressActivity_Methods.getActivitiesFromToAction == method) {
      const [from, to, action, chainId] = params;
      this.getActivitiesFromToAction(from, to, action, chainId, (rows: any) => {
        event.reply(Channel, [this.getSingal(), method, [rows]])
      });
    }
  }

  private saveActivity(activity: any) {
    const { hash, refFrom, refTo, action, data, addedTime, chainId } = activity;
    this.db.run(
      "INSERT INTO Address_Activities(transaction_hash,ref_from,ref_to,action,data,added_time,chain_id) VALUES(?,?,?,?,?,?,?)",
      [hash, refFrom, refTo, action, data, addedTime, chainId],
      (err: any) => {
        if (err) {
          console.log("Insert into Address_Activities err:", err, activity);
          return;
        }
        console.log("Insert into Address_Activities successed");
      });
  }

  private getActivitiesFromToAction(from: string, to: string, action: string, chainId: number, callback: (rows: any) => void) {
    this.db.all(
      "SELECT * FROM Address_Activities where ref_from = ? and ref_to = ? and action = ? and chain_id = ? order by timestamp desc,added_time desc limit 500",
      [from, to, action, chainId],
      (err: any, rows: any) => {
        if (!err) {
          callback(rows)
        }
      })
  }

  private updateActivity(receipt: {
    chainId: number,
    from: string
    to: string
    contractAddress: string
    transactionIndex: number
    blockHash: string
    transactionHash: string
    blockNumber: number
    status?: number
  }) {
    const { transactionHash, blockNumber, status, chainId } = receipt;
    this.db.run(
      "UPDATE Address_Activities SET status = ? , block_number = ? WHERE chain_id = ? AND transaction_hash = ? ",
      [status, blockNumber, chainId, transactionHash],
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

  private loadActivities(address: string, chainId: number, blockNumber: number, limit: number, callback: (rows: any) => void) {
    const _limit = limit && limit > 500 ? limit : 500;
    const querySQL = blockNumber ?
      "SELECT * FROM Address_Activities WHERE block_number <= ? and (ref_from = ? or ref_to = ?) and chain_id = ? order by block_number desc limit ?"
      : "SELECT * FROM Address_Activities WHERE (ref_from = ? or ref_to = ?) and chain_id = ? order by (block_number IS NOT NULL) , block_number desc limit ?";
    const params = blockNumber ?
      [blockNumber, address, address, chainId, _limit]
      : [address, address, chainId, _limit];
    console.log("Execute SQL ==", querySQL)
    this.db.all(
      querySQL,
      params,
      (err: any, rows: any) => {
        if (err) {
          console.log("load activities error:", err, address)
          return;
        }
        console.log(`Load activities for ${address} - ${chainId} , size = ${rows.length}`)
        callback(rows);
      }
    )
  }

  private deleteAddressActivities(address: string, chainId: number) {
    this.db.run(
      "DELETE FROM address_activities WHERE (ref_from = ? or ref_to = ?) AND chain_id = ?",
      [address, address, chainId],
      (err: any, rows: any) => {
        if (err) {
          console.log(`Delete ${address}.activities Error:`, err);
        } else {
          console.log(`Delete ${address}.activities Success.`, rows);
        }
      });

    this.db.run(
      "DELETE FROM time_noderewards WHERE address = ? AND chain_id = ?",
      [address, chainId],
      (err: any, rows: any) => {
        if (err) {
          console.log(`Delete ${address}.time_noderewards Error:`, err);
        } else {
          console.log(`Delete ${address}.time_noderewards Success.`, rows);
        }
      });
  }

  private saveOrUpdateActivities(addressActivities: AddressActivityVO[], chainId: number) {
    console.log("saveorupdate transactions.. >>", addressActivities.length);

    const orderedAddressActivities = addressActivities.sort((a0, a1) => {
      return a0.blockNumber - a1.blockNumber;
    })

    for (let i in orderedAddressActivities) {
      const {
        transactionHash, blockNumber, status, eventLogIndex, action, data, refFrom, refTo, timestamp
      } = orderedAddressActivities[i];
      this.db.all(
        "SELECT * FROM Address_Activities WHERE action = ? AND event_log_index = ? AND transaction_hash = ?",
        [action, eventLogIndex, transactionHash],
        (err: any, rows: any) => {
          if (err) {
            return;
          }
          if (rows.length == 0) {
            console.log("save activity txhash=", transactionHash)
            // do save
            this.db.run(
              "INSERT INTO Address_Activities(block_number,transaction_hash,event_log_index,timestamp,status,ref_from,ref_to,action,data,chain_id) VALUES(?,?,?,?,?,?,?,?,?,?)",
              [blockNumber, transactionHash, eventLogIndex, timestamp, status, refFrom, refTo, action, JSON.stringify(data), chainId],
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
              [timestamp, eventLogIndex, action, transactionHash],
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
