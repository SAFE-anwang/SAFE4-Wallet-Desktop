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
      keystores: "safe4.wallet.keystores",
      database: "safe4.wallet.sqlite3"
    };

  constructor(resourcePath: string , appIsPackaged : boolean) {
    this.path.resource = resourcePath;
    if ( appIsPackaged ){
      // 将数据目录定位到不同系统下的安装应用的根目录
      // 然后就相当于在与应用同级的目录下创建数据目录,避免重新安装应用时,会覆盖掉数据.
      const _appsDir = path.join(this.path.resource, "../../")
      this.path.data = path.join(_appsDir, "testnet_"+this.path.data);
    }else{
      // 如果实在开发环境下,那就在源码目录内生成data文件
      this.path.data = path.join(this.path.resource,this.path.data);
    }
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
