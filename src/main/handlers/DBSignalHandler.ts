import { ListenSignalHandler } from "./ListenSignalHandler";


export const DBSignal = "DB:sqlite3";

export class DBSignalHandler implements ListenSignalHandler {

    constructor() {
        const sqlite3 = require('sqlite3').verbose()
        var db = new sqlite3.Database(
            './wallet.db',
            function (err: any) {
                if (err) {
                    console.log("err :", err)
                    return console.log(err.message)
                }
                console.log('connect database successfully');

                db.all('SELECT * FROM transactions', [], function (err : any, rows : any) {
                    if (err) {
                        return console.log('find txs error: ', err.message)
                    }
                    console.log('find txs: ', rows)
                })
            }
        )
    }

    getSingal(): string {
        return DBSignal;
    }

    async handleOn(event: Electron.IpcMainEvent, ...args: any[]): Promise<any> {

    }

}