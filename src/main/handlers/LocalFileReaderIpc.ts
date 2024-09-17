
import path from 'path';
const fs = require("fs");

export class LocalFileReader {

    constructor(ipcMain: any) {
        ipcMain.handle("file-read", async (event: any, { filePath }: { filePath: string }) => {
            console.log("Read File ==>" , filePath)
            let fileContent
            try {
                fileContent = await fs.readFileSync(
                    filePath, "utf8");
            } catch (err) {
                console.error(`No ${filePath} found`)
            }
            return fileContent;
        })
    }


}