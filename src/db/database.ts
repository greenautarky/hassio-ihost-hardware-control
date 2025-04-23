import fs from "fs";
import logger from "../lib/logger";

export default class Database {

    private filePath: string;
    public devices: KeyValue = {};

    constructor(dirPath: string, filePath: string) {
        logger.info(`[Database] dirPath = `, dirPath);
        logger.info(`[Database] filePath = `, filePath);

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        this.filePath = `${dirPath}/${filePath}`;

        if (fs.existsSync(this.filePath)) {
            const db = JSON.parse(fs.readFileSync(this.filePath, { encoding: "utf8" }));
            this.devices = db;
        }

    }

    private write() {
        const dbValue = JSON.stringify(this.devices);
        fs.writeFileSync(this.filePath, dbValue);
    }

    public save(device: KeyValue) {
        const deviceid = device.deviceid;
        if (!deviceid) return;

        this.devices[deviceid] = device;
        this.write();
    }
}