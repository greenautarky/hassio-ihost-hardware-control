import LedDevice from "./led_device";
import ButtonDevice from "./button_device";
import Device from "./device";
import IhostDevice from "./ihost_device";
import Database from "../db/database";
import config from "../config/config";
import constant from "../constant";

const database = new Database(config.DatabasePath.dirPath, config.DatabasePath.filePath);

const deviceLookup: Device[] = [];

deviceLookup.push(
    new LedDevice(database.devices?.[constant.deviceObjectId.indicatorsDevice]?.entities, database),
    new ButtonDevice(database.devices?.[constant.deviceObjectId.buttonDevice]?.entities, database),
    new IhostDevice(database.devices?.[constant.deviceObjectId.ihostDevice]?.entities, database),
);

export default deviceLookup;