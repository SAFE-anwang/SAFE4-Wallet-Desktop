
import path from 'path';
const fs = require("fs");

export class LocalFileReader {

    constructor(ipcMain: any) {
        ipcMain.handle("file-read", (event: any, { filePath }: { filePath: string }) => {
            console.log("Read File ==>" , filePath)
            return fs.readFileSync(filePath, "utf8");
        })
    }


}