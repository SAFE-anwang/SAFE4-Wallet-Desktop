import { ApplicationIpcManager } from "../ApplicationIpcManager";


export interface ListenSignalHandler {

    getSingal() : string;

    handleOn(
        event: Electron.IpcMainEvent, ...args: any[]
    ) : void;

}
