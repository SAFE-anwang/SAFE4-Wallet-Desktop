import { time, timeStamp } from "console";
import { AddressActivityVO } from "../../renderer/services";
import { Channel } from "../ApplicationIpcManager";
import { ListenSignalHandler } from "./ListenSignalHandler";

export const DBSignal = "DB:sqlite3";
export class DBSignalHandler implements ListenSignalHandler {

  private db: any;

  constructor() {
    const sqlite3 = require('sqlite3').verbose()
    this.db = new sqlite3.Database(
      './wallet.db',
      function (err: any) {
        if (err) {
          return;
        }
        console.log('connect database successfully');
      }
    )
  }

  getSingal(): string {
    return DBSignal;
  }

  async handleOn(event: Electron.IpcMainEvent, ...args: any[]): Promise<any> {
    const method: string = args[0][1];
    const params: any[] = args[0][2];
    let data = undefined;
    if ("saveTransaction" == method) {
      const transaction = params[0];
      console.log("saveTransaction :", transaction);
      data = this.saveTransaction(transaction);
    }else if ("updateTransaction" == method){
      const transactionReceipt = params[0];
      console.log("saveTransaction :", transactionReceipt);
      data = this.updateTransaction(transactionReceipt);
    }else if ("loadTransactions" == method){
      const address = params[0];
      console.log("loadTransactions :", address);
      data = this.loadTransactions(address , ( rows: any ) => {
        event.reply(Channel, [this.getSingal(), method, [rows]])
      });
    }else if ("saveOrUpdateTransactions" == method){
      const addressActivities = params[0];
      console.log("saveOrUpdateTransactions :", addressActivities);
      this.saveOrUpdateTransactions(addressActivities)
    }
  }

  private saveTransaction(transaction : any) {
    if (transaction.transfer) {
      const { hash, refFrom, refTo, addedTime } = transaction;
      const action = "Transfer";
      const data = JSON.stringify(transaction.transfer);
      this.db.run(
        "INSERT INTO Address_Activities(transaction_hash,ref_from,ref_to,action,data,added_time) VALUES(?,?,?,?,?,?)",
        [hash , refFrom , refTo , action , data, addedTime],
        (err: any) => {
          if (err) {
            console.log("Insert into transactions error:", err);
            return;
          }
          console.log("Insert into transactions success , txhash => ", transaction.hash)
        });
    }
  }

  private updateTransaction( transactionReceipt :  {
    from: string
    to: string
    contractAddress: string
    transactionIndex: number
    blockHash: string
    transactionHash: string
    blockNumber: number
    status?: number
  } ){
    const { transactionHash , blockNumber , status } = transactionReceipt;
    this.db.run(
      "UPDATE Address_Activities SET status = ? , block_number = ? WHERE transaction_hash = ?",
      [status , blockNumber , transactionHash],
      (err : any) => {
        if (err){
          console.log("Update Activities Error:" , err);
          return;
        }
        console.log("Update Activies successed for tx:" , transactionHash)
      }
    )
  }

  private loadTransactions( address : string , callback : ( rows : any ) => void ){
    this.db.all(
      "SELECT * FROM Address_Activities WHERE ref_from = ? or ref_to = ?",
      [address , address],
      (err:any , rows : any) => {
        if (err){
          console.log("load Activities Error:" , err);
          return;
        }
        callback(rows);
      }
    )
  }

  private saveOrUpdateTransactions( addressActivities : AddressActivityVO[] ){
    console.log("saveorupdate transactions.. >>" , addressActivities.length)
    for(let i in addressActivities){
      const {
        transactionHash , blockNumber , status , eventLogIndex , action , data , refFrom , refTo , timestamp
      } = addressActivities[i];

      if ( action == "Transfer" ){
        this.db.all(
          "SELECT * FROM Address_Activities WHERE action = ? AND transaction_hash = ?" ,
          [ action , transactionHash ] ,
          ( err : any , rows : any ) => {
            if (err){
              return;
            }
            if (rows.length == 0){
              console.log("save activity txhash=" , transactionHash)
              // do save
              this.db.run(
                "INSERT INTO Address_Activities(block_number,transaction_hash,event_log_index,timestamp,status,ref_from,ref_to,action,data) VALUES(?,?,?,?,?,?,?,?,?)",
                [blockNumber,transactionHash,eventLogIndex,timestamp,status,refFrom,refTo,action,JSON.stringify(data)],
                (err : any) => {
                  if (err){
                    console.log("save error:", err)
                  }
                }
              )
            }else{
              // do update
              console.log("update activity txhash=" , transactionHash)
              this.db.run(
                "UPDATE Address_Activities Set timestamp = ? WHERE action = ? AND transaction_hash = ?",
                [timestamp , action , transactionHash ],
                (err : any) => {
                  if (err){
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

}
