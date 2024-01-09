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

                // db.all('SELECT * FROM transactions', [], function (err : any, rows : any) {
                //     if (err) {
                //         return console.log('find txs error: ', err.message)
                //     }
                //     console.log('find txs: ', rows)
                // })
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
        if ( "saveTransaction" == method ) {
            const transaction = params[0];
            console.log("saveTransaction :" , transaction)
            data = this.saveTransaction(transaction);
        } 
        event.reply(Channel, [this.getSingal(), method, [data]])
    }

    private saveTransaction( transaction : any ){
        this.db.run( "INSERT INTO Transactions(hash) VALUES(?)" , [transaction.hash] , (err:any) => {
            if (err){
                console.log("Insert into transactions error:" , err);
                return;
            }
            console.log("Insert into transactions success , txhash => " , transaction.hash)
        });
    }

}
