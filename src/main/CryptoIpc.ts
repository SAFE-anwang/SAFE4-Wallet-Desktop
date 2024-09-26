

export class CryptoIpc {

  constructor(ipcMain: any) {
    ipcMain.handle("crypto-scrypt", async (event: any, params: any) => {
      const crypto = require('crypto');
      // 随机生成盐
      const salt = crypto.randomBytes(16).toString('hex');
      console.log("salt:" , salt);
      const password = 'test_password';

      // 设置 scrypt 参数
      // [ 1024 , 2048 , 4096 , 8192 , 16384 , 32768 , 65536 , 131072 , 262144 ]
      const N = 16384;                // 每次迭代次数（必须为2的幂）
      const r = 8;                    // 块大小因子
      const p = 1;                    // 并行化因子
      const dkLen = 32;               // 生成32字节（256位）的密钥
      const TargetN = 262144;          // 迭代目标次数
      const iterations = TargetN / N; // 计算循环迭代的次数

      // 从初始密码开始;
      let derivedKey = Buffer.from(password);
      for (let i = 0; i < iterations; i++) {
        derivedKey = await new Promise((resolve, reject) => {
          crypto.scrypt(derivedKey, salt, dkLen, { N, r, p }, (err: any, _derivedKey: any) => {
            if (err) reject(err);
            else resolve(_derivedKey);
          });
        });
        console.log(`完成第${i}次迭代计算:${derivedKey.toString("hex")}`)
      }
      return derivedKey.toString("hex");
    })
  }


}
