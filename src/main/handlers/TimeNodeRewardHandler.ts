import { DateTimeFormat, TimestampTheEndOf, TimestampTheStartOf } from "../../renderer/utils/DateUtils";
import { Channel } from "../ApplicationIpcManager";
import { Context } from "./Context";
import { ListenSignalHandler } from "./ListenSignalHandler";

export const TimeNodeRewardSignal = "DB:sqlite3/timeNodeReward";

export enum TimeNodeReward_Methods {
  saveOrUpdate = "saveOrUpdate",
  getAll = "getAll",
}

export class TimeNodeRewardHandler implements ListenSignalHandler {

  private ctx: Context;

  private db: any;

  getSingal(): string {
    return TimeNodeRewardSignal;
  }

  constructor(ctx: Context, db: any) {
    this.ctx = ctx;
    this.db = db;
    this.db.run("CREATE TABLE IF NOT EXISTS \"time_noderewards\" ( "
      + "\"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,"
      + "\"chain_id\" INTEGER,"
      + "\"time_key\" TEXT,"
      + "\"address\" text,"
      + "\"count\" integer,"
      + "\"amount\" TEXT"
      + ");",
      [],
      (err: any) => {
        if (err) {
          console.log("[sqlite3] Create Table Time_NodeRewards Error :", err);
          return;
        }
        console.log("[sqlite3] Check Time_NodeRewards Exisits.");
      })

  }

  async handleOn(event: Electron.IpcMainEvent, ...args: any[]): Promise<any> {
    const method: string = args[0][1];
    const params: any[] = args[0][2];
    if (TimeNodeReward_Methods.saveOrUpdate == method) {
      const [ timeNodeRewards, chainId ] = params;
      this.saveOrUpdate(timeNodeRewards, chainId);
    } else if (TimeNodeReward_Methods.getAll == method) {
      const [ address, chainId ] = params;
      this.getAll(address, chainId, (rows) => {
        event.reply(Channel, [this.getSingal(), method, [rows]])
      })
    }
  }

  private saveOrUpdate(timeNodeRewards: any[], chainId: number) {
    timeNodeRewards.forEach(timeNodeReward => {
      const { address, time, count, amount } = timeNodeReward;
      this.db.all("SELECT * FROM time_noderewards WHERE chain_id = ? AND address = ? AND time_key = ?", [chainId, address, time],
        (err: any, rows: any) => {
          if (rows.length == 0) {
            this.db.run("INSERT INTO time_noderewards(chain_id,address,count,amount,time_key) VALUES(?,?,?,?,?)",
              [chainId, address, count, amount, time],
              (err: any, rows: any) => {
                if (!err) {
                  console.log(`Save Time_NodeReward For ${address} @ ${time} || Count:${count} , Amount:${amount}`)
                }
              })
          } else {
            this.db.run("UPDATE time_noderewards SET amount = ?,count = ? where time_key = ? and address = ? and chain_id = ?",
              [amount, count, time, address, chainId],
              (err: any, rows: any) => {
                if (!err) {
                  console.log(`Update Time_NodeReward For ${address} @ ${time} || Count:${count} , Amount:${amount}`)
                }else {
                  console.log(`Update Time_NodeReward For ${address} @ ${time} || Error:` , err)
                }
              });
          }
          // 同时删除 Address_Activities 中的 该地址对应的 SystemReward:
          const timestampStart = TimestampTheStartOf( time );
          const timestampEnd = TimestampTheEndOf( time );
          // this.db.run( "DELETE FROM address_activities where timestamp >= ? and timestamp <= ? and ref_to = ? and action = ? and chain_id = ?" ,
          // [ timestampStart , timestampEnd , address , "SystemReward:" , chainId ] ,
          // ( err: any , rows : any ) => {
          //   if ( !err ){
          //     console.log(`Delete ${ address }||${chainId}@[${ DateTimeFormat(timestampStart) }~${DateTimeFormat(timestampEnd)}] : SystemRewards...`)
          //   }
          // })
        });
    });
  }

  private getAll(address: string, chainId: number, callback: (rows: any) => void) {
    this.db.all("SELECT * FROM time_noderewards WHERE chain_id = ? AND address = ?", [chainId, address],
      (err: any, rows: any) => {
        if (!err) {
          console.log(`Get Time_NodeRewards for ${address} / chainId=${chainId} :` , rows.length);
          callback(rows);
        }else {
          console.log(`Get Time_NodeRewards for ${address} / chainId=${chainId} Error:` , err);
        }
      });
  }


}
