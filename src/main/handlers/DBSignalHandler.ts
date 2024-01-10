import { SerializableTransactionReceipt, TransactionDetails } from "../../renderer/state/transactions/reducer";
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
          console.log("err :", err)
          return console.log(err.message)
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
    }
  }

  private saveTransaction(transaction: TransactionDetails) {
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

  private updateTransaction( transactionReceipt : SerializableTransactionReceipt ){
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
        console.log("load transactions ::" , rows)
        callback(rows);
      }
    )

  }

}
