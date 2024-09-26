

export class CryptoIpc {

  constructor(ipcMain: any) {
    ipcMain.handle("crypto-scrypt", async (event: any, params: any) => {
      const crypto = require('crypto');
      const password = 'your_password';
      const salt = 'your_salt';
      const scryptPromise = new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, 32, (err: any, derivedKey: any) => {
          if ( err ){
            reject(err);
            return;
          }
          resolve(  derivedKey.toString('hex') );
        });
      });
      return await scryptPromise;
    })
  }


}
