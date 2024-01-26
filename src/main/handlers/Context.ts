import path from 'path';
const fs = require("fs");

export class Context {

  path: {
    resource: string,
    data: string,
    keystores: string,
    database: string
  } = {
      resource: "",
      data: "data",
      keystores: "safe4.wallet.keystores.json",
      database: "safe4.wallet.sqlite3"
    };

  constructor(resourcePath: string) {
    this.path.resource = resourcePath;
    this.path.resource = path.join(this.path.resource, "../");
    this.path.data = path.join(this.path.resource, this.path.data);
    // 使用 fs.existsSync() 同步地检查文件夹是否存在
    if (!fs.existsSync(this.path.data)) {
      // 如果文件夹不存在，则创建它
      fs.mkdirSync(this.path.data);
      console.log(`[Init] ${this.path.data}:Folder created successfully.`);
    } else {
      console.log(`[Init] ${this.path.data}:Folder already exists.`);
    }
    this.path.database = path.join(this.path.data, this.path.database);
    this.path.keystores = path.join(this.path.data, this.path.keystores);
  }

}
