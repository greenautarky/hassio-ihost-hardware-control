import SelectPlatform from "./platform/select";
import type { SelectConfig } from "./platform/select";
import logger from "../lib/logger";
import constant from "../constant";
import config from "../config/config";
import * as utils from '../utils/utils';
import Device from "./device";
import Database from "../db/database";
import Entity from "./platform/entity";

const actionToColor: KeyValue = {
    fastFlash: {
        rgb: [0, 0, 0],
        mode: 0x02
    },
    periodicDoubleFlash: {
        rgb: [0, 0, 0],
        mode: 0x03
    },
    off: {
        rgb: [0, 0, 0],
        mode: 0x00
    },
    on: {
        rgb: [0, 0, 255],
        mode: 0x01
    },
    redSolidLight: {
        rgb: [255, 0, 0],
        mode: 0x01
    },
    blueSolidLight: {
        rgb: [0, 0, 255],
        mode: 0x01
    },
    greenSolidLight: {
        rgb: [0, 255, 0],
        mode: 0x01
    },
    purpleSolidLight: {
        rgb: [128, 0, 128],
        mode: 0x01
    },
    orangeSolidLight: {
        rgb: [255, 50, 0],
        mode: 0x01
    },
    yellowSolidLight: {
        rgb: [255, 255, 0],
        mode: 0x01
    },
    redFastFlash: {
        rgb: [255, 0, 0],
        mode: 0x02
    },
    blueFastFlash: {
        rgb: [0, 0, 255],  // Blue
        mode: 0x02
    },
    yellowFastFlash: {
        rgb: [255, 255, 0],  // Yellow (corrected from blue)
        mode: 0x02
    },
    redPeriodicDoubleFlash: {
        rgb: [255, 0, 0],  // Red (corrected from blue)
        mode: 0x03
    },
    bluePeriodicDoubleFlash: {
        rgb: [0, 0, 255],  // Blue
        mode: 0x03
    },
    greenPeriodicDoubleFlash: {
        rgb: [0, 255, 0],  // Green (corrected from blue)
        mode: 0x03
    },
    redBreathing: {
        rgb: [255, 0, 0],  // Red (corrected from blue)
        mode: 0x04
    },
    blueBreathing: {
        rgb: [0, 0, 255],  // Blue
        mode: 0x04
    },
    yellowBreathing: {
        rgb: [255, 255, 0],  // Yellow (corrected from blue)
        mode: 0x04
    },
    greenBreathing: {
        rgb: [0, 255, 0],  // Green (corrected from blue)
        mode: 0x04
    },
    orangeBreathing: {
        rgb: [255, 50, 0],  // Orange (correct as is)
        mode: 0x04
    },
    purpleBreathing: {
        rgb: [128, 0, 128],  // Purple (corrected from blue)
        mode: 0x04
    },
    redMarquee: {
        rgb: [255, 0, 0],  // Red (corrected from blue)
        mode: 0x05
    },
    blueMarquee: {
        rgb: [0, 0, 255],  // Blue
        mode: 0x05
    },
    greenMarquee: {
        rgb: [0, 255, 0],  // Green (corrected from blue)
        mode: 0x05
    },
    redSingleDoubleFlash: {
        rgb: [255, 0, 0],  // Red (corrected from blue)
        mode: 0x06
    },
    blueSingleDoubleFlash: {
        rgb: [0, 0, 255],  // Blue
        mode: 0x06
    },
    greenSingleDoubleFlash: {
        rgb: [0, 255, 0],  // Green (corrected from blue)
        mode: 0x06
    }
};

const indexToName: KeyValue = {
    1: "Power",
    2: "Pairing",
    3: "Security",
    4: "Mute",
    5: "Side Strip"
};

export default class LedDevice extends Device {

    public entities: SelectPlatform[] = [];

    constructor(entities: Entity[] = [], database: Database) {
        super(constant.deviceObjectId.indicatorsDevice, database);
        if (entities.length > 0) {
            for (const entity of entities) {
                const selectEntity = new SelectPlatform({
                    object_id: entity.object_id,
                    platform: entity.platform,
                    unique_id: entity.unique_id,
                    identifier: entity.device.identifiers,
                    name: entity.name,
                    availability_topic: entity.availability_topic,
                    command_topic: entity.command_topic,
                    state_topic: entity.state_topic,
                    config_topic: entity.config_topic,
                    value_template: entity.value_template,
                    options: (entity as SelectPlatform).options,
                    index: entity.index,
                    device_name: entity.device.name,
                    command_template: entity.command_template,
                    hw_version: entity.device.hw_version,
                    sw_version: entity.device.sw_version,
                    payload: entity.payload,
                    lastLedColor: (entity as SelectPlatform).lastLedColor,
                    isFirstInit: false,
                    icon: entity.icon,
                });

                this.entities.push(selectEntity);
            }
        } else {
            this.init();
        }
        this.save();
    }

    private init() {
        const platform = "select";
        const object_id = this.object_id;
        for (let i = 1; i < 6; i++) {
            const selectEntity = new SelectPlatform({
                object_id,
                platform,
                unique_id: `${object_id}_${i}`,
                identifier: `${object_id}`,
                name: indexToName[i],
                availability_topic: `${config.MQTT_CONFIG.BASIC_TOPIC}/${platform}/${object_id}_${i}/availability`,
                command_topic: `${config.MQTT_CONFIG.BASIC_TOPIC}/${platform}/${object_id}_${i}/set`,
                state_topic: `${config.MQTT_CONFIG.BASIC_TOPIC}/${platform}/${object_id}_${i}/state`,
                config_topic: `${constant.baseHomeassistantTopic}/${platform}/${object_id}_${i}/config`,
                value_template: '{{ value_json.option }}',
                options: i < 5 ? ["On", "Off", "Rapid Flashing", "Double Flashing"] :
                    ["On", "Off",
                        "Solid Blue", "Solid Red", "Solid Green", "Solid Yellow", "Solid Orange", "Solid Purple",
                        "Rapid Flashing Red", "Rapid Flashing Blue", "Rapid Flashing Yellow",
                        "Double Flashing Red", "Double Flashing Blue", "Double Flashing Green",
                        "Double Flashing Red then Revert", "Double Flashing Blue then Revert", "Double Flashing Green then Revert",
                        "Breathing Red", "Breathing Blue", "Breathing Yellow", "Breathing Green", "Breathing Orange", "Breathing Purple",
                        "Marquee Red",
                    ],
                index: i,
                device_name: "iHost Indicators",
                command_template: '{"option": "{{ value }}"}',
                hw_version: constant.deviceInfo.hw_version,
                sw_version: constant.deviceInfo.sw_version,
                icon: i < 5 ? "mdi:wall-sconce-flat-variant" : "mdi:led-strip-variant",
            } as SelectConfig);

            this.entities.push(selectEntity);
        }

    }

    parseMqttPayloadToSerial(data: eventData.MqttMessage): { buffer: Buffer, mqttResponse: { topic: string, payload: KeyValue } } | null | undefined {
        try {
            const topic = data.topic;
            const message = data.message;
            const payload = JSON.parse(message) as KeyValue;
            for (const entity of this.entities) {
                if (topic !== entity.command_topic || !payload) continue;

                if (!entity.options.includes(payload.option)) continue;

                const index = entity.index as number;

                let bufferData = null;
                let colorMap = this.getColorConfig(payload.option as string);
                if (colorMap) {
                    if (index === 5 && entity.lastLedColor && payload.option === "On") {
                        colorMap = entity.lastLedColor;
                    }
                    logger.info(`colorMap = `, colorMap);
                    if (index === 5 && payload.option !== "Off") {
                        entity.lastLedColor = colorMap;
                    }
                    bufferData = utils.buildLedFrame(index - 1, colorMap.mode, colorMap.rgb as [number, number, number]);

                    if (bufferData) {
                        entity.payload = payload;
                        this.save();
                        return {
                            buffer: bufferData,
                            mqttResponse: {
                                topic: entity.state_topic as string,
                                payload
                            }
                        };
                    }
                }
            }
        } catch (error) {
            logger.error(`parseMqttPayloadToSerial error`, error);
        }

        return null;
    }

    parseSerialPayloadToMqtt(payload: Buffer): { topic: string, payload: KeyValue | string, options?: KeyValue }[] | null | undefined {
        return null;
    }

    private getColorConfig(option: string): KeyValue | undefined {
        let color;
        switch (option) {
            case "Solid Red":
                color = actionToColor.redSolidLight;
                break;
            case "Solid Blue":
                color = actionToColor.blueSolidLight;
                break;
            case "Solid Green":
                color = actionToColor.greenSolidLight;
                break;
            case "Solid Purple":
                color = actionToColor.purpleSolidLight;
                break;
            case "Solid Orange":
                color = actionToColor.orangeSolidLight;
                break;
            case "Solid Yellow":
                color = actionToColor.yellowSolidLight;
                break;
            case "Rapid Flashing Red":
                color = actionToColor.redFastFlash;
                break;
            case "Rapid Flashing Blue":
                color = actionToColor.blueFastFlash;
                break;
            case "Rapid Flashing Yellow":
                color = actionToColor.yellowFastFlash;
                break;
            case "Double Flashing Red":
                color = actionToColor.redPeriodicDoubleFlash;
                break;
            case "Double Flashing Blue":
                color = actionToColor.bluePeriodicDoubleFlash;
                break;
            case "Double Flashing Green":
                color = actionToColor.greenPeriodicDoubleFlash;
                break;
            case "Breathing Red":
                color = actionToColor.redBreathing;
                break;
            case "Breathing Blue":
                color = actionToColor.blueBreathing;
                break;
            case "Breathing Yellow":
                color = actionToColor.yellowBreathing;
                break;
            case "Breathing Green":
                color = actionToColor.greenBreathing;
                break;
            case "Breathing Orange":
                color = actionToColor.orangeBreathing;
                break;
            case "Breathing Purple":
                color = actionToColor.purpleBreathing;
                break;
            case "Marquee Red":
                color = actionToColor.redMarquee;
                break;
            case "Blue Marquee":
                color = actionToColor.blueMarquee;
                break;
            case "Green Marquee":
                color = actionToColor.greenMarquee;
                break;
            case "Double Flashing Red then Revert":
                color = actionToColor.redSingleDoubleFlash;
                break;
            case "Double Flashing Blue then Revert":
                color = actionToColor.blueSingleDoubleFlash;
                break;
            case "Double Flashing Green then Revert":
                color = actionToColor.greenSingleDoubleFlash;
                break;
            case "On":
                color = actionToColor.on;
                break;
            case "Off":
                color = actionToColor.off;
                break;
            case "Double Flashing":
                color = actionToColor.periodicDoubleFlash;
                break;
            case "Rapid Flashing":
                color = actionToColor.fastFlash;
                break;
        }

        return color;
    }

    save() {
        this.database.save({ deviceid: constant.deviceObjectId.indicatorsDevice, entities: this.entities });
    }

}
