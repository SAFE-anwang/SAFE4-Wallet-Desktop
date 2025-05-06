import { Channel } from "../ApplicationIpcManager";
import { Context } from "./Context";
import { ListenSignalHandler } from "./ListenSignalHandler";


export const ERC20TokensSignal = "DB:sqlite3/erc20Tokens";

export enum ERC20Tokens_Methods {
  save = "save",
  getAll = "getAll",
  remove = "remove"
}

export class ERC20TokenSignalHandler implements ListenSignalHandler {

  getSingal(): string {
    return ERC20TokensSignal;
  }

  private ctx: Context;

  private db: any;

  constructor(ctx: Context, db: any) {
    this.ctx = ctx;
    this.db = db;
    this.db.run(
      "CREATE TABLE IF NOT EXISTS \"erc20_tokens\" ( "
      + "\"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,"
      + " \"chain_id\" INTEGER,"
      + " \"address\" text,"
      + " \"name\" text,"
      + " \"symbol\" text,"
      + " \"decims\" INTEGER,"
      + " \"props\" text"
      + ");",
      [],
      (err: any) => {
        if (err) {
          console.log("[sqlite3] Create Table erc20_tokens Error:", err);
          return;
        }
        console.log("[sqlite3] Check erc20_tokens Exisits.")
      }
    )
  }

  async handleOn(event: Electron.IpcMainEvent, ...args: any[]): Promise<any> {
    const method: string = args[0][1];
    const params: any[] = args[0][2];
    let data = undefined;
    if (ERC20Tokens_Methods.getAll == method) {
      const chainId = params[0];
      this.getAll(chainId, (rows: any) => {
        event.reply(Channel, [this.getSingal(), method, [rows]])
      })
    } else if (ERC20Tokens_Methods.save == method) {
      const { chainId, address, name, symbol, decimals, props } = params[0];
      this.saveOrUpdate(chainId, address, name, symbol, decimals, props);
    } else if (ERC20Tokens_Methods.remove == method) {
      const { chainId, address } = params[0];
      this.remove(chainId, address)
    }
  }

  private getAll(chainId: number, callback: (rows: any) => void) {
    this.db.all("SELECT * FROM erc20_tokens where chain_id = ?", [chainId],
      (err: any, rows: any) => {
        callback(rows);
      })
  }

  private remove(chainId: number, address: string) {
    this.db.all(
      "SELECT * FROM ERC20_Tokens where address = ? and chain_id = ?",
      [address, chainId],
      (err: any, rows: any) => {
        if (!err) {
          if (rows[0]) {
            const { props } = rows[0];
            let newProps = undefined;
            if (!props) {
              const _props = {
                hide: true
              };
              newProps = JSON.stringify(_props);
            } else {
              const _props = JSON.parse(props);
              _props.hide = true;
              newProps = JSON.stringify(_props);
            }
            this.db.run(
              "UPDATE ERC20_Tokens set props = ? where address = ? and chain_id = ?",
              [newProps, address, chainId],
              (err: any) => {
                if (!err) {
                  console.log(`Update ERC20_Tokens: ${address}/${chainId}-hide = true `);
                }
              }
            )
          }
        }
      }
    )
  }

  private saveOrUpdate(chainId: number, address: string, name: string, symbol: string, decimals: number, props?: any) {
    this.db.all("SELECT * FROM ERC20_Tokens where address = ? and chain_id = ?", [address, chainId],
      (err: any, rows: any) => {
        if (rows.length == 0) {
          this.db.run(
            "INSERT INTO ERC20_Tokens( chain_id , address , name , symbol , decims ) VALUES( ? , ? , ? , ? , ?)",
            [chainId, address, name, symbol, decimals],
            (err: any) => {
              if (!err) {
                console.log(`[sqlite3/ERC20_Tokens] Save New ERC20-Token:${name}[${symbol}]:${decimals}:_${address}_ChainId=${chainId}`)
              }
            }
          )
        } else {
          const dbProps = rows[0].props;
          let newProps = undefined;
          if ( props ){
            if ( dbProps ){
              const _dbProps = JSON.parse(dbProps);
              newProps = JSON.stringify({
                ..._dbProps,
                ...props
              })
            } else {
              newProps = JSON.stringify(props);
            }
          } else {
            newProps = dbProps;
          }
          this.db.run(
            "UPDATE ERC20_Tokens Set name = ?,symbol = ?,decims = ? , props = ? WHERE address = ? and chain_id = ?",
            [name, symbol, decimals, newProps, address, chainId],
            (err: any) => {
              if (!err) {
                console.log(`[sqlite3/ERC20_Tokens] Update ERC20-Token:${name}[${symbol}]:${decimals}:_${address}_ChainId=${chainId}`)
              }
            }
          )
        }
      }
    )
  }

}
