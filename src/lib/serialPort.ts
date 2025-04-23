import { SerialPort } from "serialport";
import config from "../config/config";
import type { SerialPort as SerialPortType } from "serialport";
import type { SerialPortOpenOptions } from "serialport";
import logger from "./logger";
import * as utils from "../utils/utils";

const SerialConfig = config.SerialConfig;

export default class SerialPortDef {

    private serialPort: SerialPortType | null = null;
    private eventBus: EventBusType;

    constructor(eventBus: EventBusType) {
        this.eventBus = eventBus;
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.serialPort = new SerialPort(SerialConfig as SerialPortOpenOptions<any>);
            this.serialPort.on('open', () => {
                logger.info(`serial connect success`);
                resolve();
            });

            this.serialPort.on('error', (err) => {
                logger.error(`serial connect fail`, err);
                reject();
            });
            this.serialPort.on('data', this.onMessage.bind(this));
        });
    }

    onMessage(data: Buffer): void {
        logger.info(`serial receive`, data?.toString("hex"));

        // If this message is a version query, directly reply with the current version.
        if (this.checkBinaryFrameIsQueryVersion(data)) {
            this.send(utils.responseVersion());
            return;
        }

        this.eventBus.emitSerialMessage(data);
    }

    async send(data: Buffer): Promise<void> {
        return new Promise((resolve, reject) => {
            logger.info(`serial send`, data?.toString("hex"));
            this.serialPort?.write(data, (error) => {
                if (!error) resolve();
                else reject(error);
            });
        });
    }

    checkBinaryFrameIsQueryVersion(buffer: Buffer): boolean {
        try {
            if (buffer.length < 7) {
                return false;
            }

            const frameHeader = buffer[0];
            if (frameHeader !== 0xFE) return false;

            const commandType = buffer[3];
            if (commandType !== 0x00) return false;

            const commandCode = buffer[4];
            if (commandCode !== 0x02) return false;

            return true;
        } catch (error) {
            logger.error(`checkBinaryFrameIsQueryVersion error`, error);
            return false;
        }

    }
}