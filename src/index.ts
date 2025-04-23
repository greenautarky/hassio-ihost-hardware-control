import Mqtt from "./lib/mqtt";
import EventBus from "./lib/event_bus";
import logger from "./lib/logger";
import SerialPort from "./lib/serialPort";
import devices from "./devices/index";
import ExtensionPublish from "./extension/publish";
import ExtensionReveive from "./extension/reveive";
import type Extension from "./extension/extension";
import Device from "./devices/device";
import type DeviceTriggerPlatform from "./devices/platform/device_trigger";
import axios from 'axios';
import * as utils from "./utils/utils";
import constant from "./constant";

const SUPERVISOR_TOKEN = process.env.SUPERVISOR_TOKEN;
const SUPERVISOR_URL = "http://supervisor";
const headers = {
    Authorization: `Bearer ${SUPERVISOR_TOKEN}`,
    "Content-Type": "application/json",
};

const ADDON_START_METHOD = process.env.ADDON_START_METHOD;
logger.info(`ADDON_START_METHOD = `, ADDON_START_METHOD);

function callExtensions(extensions: Extension[]) {
    for (const extension of extensions) {
        try {
            extension.start();
        }
        catch (error) {
            logger.error(`Failed to call '${extension.constructor?.name}'`, error);
        }
    }
}

const eventBus = new EventBus((error) => {
    logger.error(`event error`, error);
});
const mqtt = new Mqtt(eventBus);
logger.info(`mqtt connect success`);
const serialPort = new SerialPort(eventBus);
logger.info(`serial port connect success`);

(async () => {
    await mqtt.connect();
    await serialPort.connect();

    const extensionArgs: [MqttType, SerialPortType, EventBusType, Device[]] = [
        mqtt,
        serialPort,
        eventBus,
        devices
    ];

    const extensions = [
        new ExtensionPublish(...extensionArgs),
        new ExtensionReveive(...extensionArgs),
    ].filter((n) => n);

    callExtensions(extensions);

    const startIndicatorMsg: any[] = [];
    for (const device of devices) {
        for (const entity of device.entities) {
            try {
                if (entity.getDefinition()) {
                    await mqtt.publish({
                        topic: entity.config_topic,
                        payload: entity.getDefinition(),
                        options: { retain: true, qos: 1 }
                    });

                    await mqtt.publish({
                        topic: entity.availability_topic as string,
                        payload: { availability: "online" },
                        options: { retain: true }
                    });

                    if (entity.command_topic) mqtt.subscribe(entity.command_topic);

                    // logger.info(`entity = `, entity);
                    if (device.object_id === constant.deviceObjectId.indicatorsDevice && entity.payload) {
                        startIndicatorMsg.push({
                            topic: entity.command_topic,
                            message: entity.payload,
                            index: entity.index
                        });
                    } else if (device.object_id === constant.deviceObjectId.buttonDevice && entity.payload && entity.isFirstInit === true) {
                        mqtt.publish({
                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                            topic: entity.state_topic ?? (entity as DeviceTriggerPlatform).topic as string,
                            payload: (entity as DeviceTriggerPlatform).payload,
                            options: { retain: false }
                        });
                    } else if (device.object_id === constant.deviceObjectId.ihostDevice && (entity.isFirstInit === true || ADDON_START_METHOD === "boot")) {
                        mqtt.publish({
                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                            topic: entity.state_topic ?? (entity as DeviceTriggerPlatform).topic as string,
                            payload: (entity as DeviceTriggerPlatform).payload,
                            options: { retain: false }
                        });
                    }
                }
            } catch (error) {
                logger.error(`publish device error`, error);
            }
        }
    }

    setTimeout(() => {
        const indicatorsDevice = devices.find(f => f.object_id === constant.deviceObjectId.indicatorsDevice);
        if (indicatorsDevice) {
            for (const msg of startIndicatorMsg) {
                try {
                    const entity = indicatorsDevice?.entities?.find(f => f.index === msg.index);
                    if (entity?.payload?.option === msg?.message?.option) {
                        logger.info(`setTimeout`, msg.message);
                        const serialPayload = indicatorsDevice.parseMqttPayloadToSerial({ topic: msg.topic as string, message: JSON.stringify(msg.message) })?.buffer;
                        if (serialPayload) {
                            serialPort.send(serialPayload);

                            mqtt.publish({
                                topic: entity?.state_topic as string,
                                payload: msg.message,
                                options: { retain: false }
                            });
                        }
                    }
                } catch (error) {
                    logger.error(`indicatorsDevice init error`, error);
                }
            }
        }
    }, 3000);

})();

async function gracefulStop(code = 0) {
    logger.info(`graceful stop...`);
    const data = await getSuperviorInfo();

    // Turn off all indicator lights.
    if (data?.data?.state !== "running") {
        for (let i = 0; i < 5; i++) {
            const bufferData = utils.buildLedFrame(i, 0x00, [0, 0, 0]);
            await serialPort.send(bufferData);
        }
    }

    for (const device of devices) {
        device.save();
        // logger.info(`device = `, JSON.stringify(device));
        for (const entity of device.entities) {
            try {
                if (entity.availability_topic) {
                    await mqtt.publish({
                        topic: entity.availability_topic,
                        payload: '',
                        options: { retain: true }
                    });
                }

                if (entity.state_topic) {
                    await mqtt.publish({
                        topic: entity.state_topic,
                        payload: '',
                        options: { retain: true }
                    });
                }

                if ((entity as DeviceTriggerPlatform).topic) {
                    await mqtt.publish({
                        topic: (entity as DeviceTriggerPlatform).topic,
                        payload: '',
                        options: { retain: true }
                    });
                }

                await mqtt.publish({
                    topic: entity.config_topic,
                    payload: '',
                    options: { retain: true }
                });
            } catch (error) {
                logger.error(`publish device error`, error);
            }
        }
    }
    mqtt.disconnect();
    process.exit(code);
}

async function getSuperviorInfo() {
    try {
        const response = await axios.get(`${SUPERVISOR_URL}/info`, { headers });
        logger.info(`getSuperviorInfo response = `, JSON.stringify(response.data));
        return response.data;
    } catch (e) {
        logger.error(e);
        return null;
    }
}

process.on("SIGINT", async (singals) => {
    await gracefulStop(0);
});
process.on("SIGTERM", async (singals) => {
    await gracefulStop(0);
});