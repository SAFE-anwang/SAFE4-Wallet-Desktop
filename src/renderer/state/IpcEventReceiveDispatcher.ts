import { IPC_CHANNEL } from "../config";
import { AppDispatch } from ".";

export class IpcEventReceiveDispatcher {

  dispatch : AppDispatch;

  constructor( dispatch : AppDispatch ) {
    this.dispatch = dispatch;
    window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
      if ( arg instanceof Array ) {
        const signal = arg[0];
        const method = arg[1];
        const result = arg[2];
      }
    });
  }

  private _dispatch( signal : string , method : string , result : any ) : void {

  }

}


