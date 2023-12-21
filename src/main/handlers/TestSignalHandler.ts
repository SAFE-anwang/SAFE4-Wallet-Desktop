

import { ListenSignalHandler } from "./ListenSignalHandler";
const fs = require("fs")

export class TestSignalHandler implements ListenSignalHandler {

    public getSingal() : string {
        return "test";
    }

    public async handleOn(event: Electron.IpcMainEvent, ...args: any[] ) {
        console.log("TestSignalHandler.handleON!")
        
        const data = fs.readFileSync( "./package.json" , "utf-8" );
        console.log(data);
        event.reply( "ipc-example" , [data] )
    }

}