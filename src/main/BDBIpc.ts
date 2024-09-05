import path from "path";
import { Context } from "./handlers/Context";


export class BDBIpc {

    constructor(ipcMain: any, ctx: Context) {

        const bdb = require('bdb');
        const datPath = path.join(ctx.path.data, "wallet.dat");

        const db = bdb.create(datPath);

        console.log(db)

        db.open().then(() => {
            console.log("open dat.... >>" , db);
            const myPrefix = bdb.key('r');
            const myKey = bdb.key('t', ['hash160', 'uint32']);
            const bucket = db.bucket(myPrefix.encode());
            const iter = bucket.iterator({
                gte: myKey.min(),
                lte: myKey.max(),
                values: true
            });

            iter.each().then((key : any, value : any) => {
                // Parse each key.
                const [hash, index] = myKey.decode(key);
                console.log('Hash: %s', hash);
                console.log('Index: %d', index);
                console.log('Value: %s', value.toString());
            });

        }).catch( (err : any) => {
            console.log("open failed!211!" , err)
        } )


    }

}