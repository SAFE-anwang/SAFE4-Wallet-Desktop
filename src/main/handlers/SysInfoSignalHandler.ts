import { Channel } from "../ApplicationIpcManager";
import { ListenSignalHandler } from "./ListenSignalHandler";


export const SysInfoSignal = "sys-info";

export class SysInfoSignalHandler implements ListenSignalHandler {

  public data : {

  } = {}

  constructor(){
    const node_serve_path = process.cwd();
    this.data = {
      node_serve_path
    }
  }

  getSingal(): string {
    return SysInfoSignal;
  }

  handleOn(event: Electron.IpcMainEvent, ...args: any[]): void {
    console.log("SysInfoSignalHandler =>" , args[0] )
    event.reply( Channel , [this.getSingal() , this.data] )
  }

}
