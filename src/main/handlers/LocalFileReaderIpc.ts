
import path from 'path';
const fs = require("fs");


export class LocalFileReader {

  constructor(ipcMain: any) {
    ipcMain.handle("file-read", (event: any, { filePath }: { filePath: string }) => {
      console.log("Read File ==>", filePath)
      return fs.readFileSync(filePath, "utf8");
    })

    ipcMain.handle("file-select", async (event: any) => {
      const { dialog } = require("electron");
      const result = await dialog.showOpenDialog({
        title: '选择图片',
        properties: ['openFile'],
        filters: [
          { name: 'Images', extensions: ['png'] }
        ]
      });
      if (result.canceled) return null;
      const filePath = result.filePaths[0];
      const buffer = fs.readFileSync(filePath); // Buffer 类型
      const hex = '0x' + buffer.toString('hex'); // 转换为 hex 字符串，便于写入合约
      return [ filePath ,  hex ];
    });

  }


}
