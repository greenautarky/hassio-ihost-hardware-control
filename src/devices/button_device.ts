import EventPlatform from "./platform/event";
import constant from "../constant";
import config from "../config/config";
import logger from "../lib/logger";
import * as utils from "../utils/utils";
import Device from "./device";
import DeviceTriggerPlatform from "./platform/device_trigger";
import Database from "../db/database";
import Entity from "./platform/entity";

const indexToName: KeyValue = {
    1: "Power",
    2: "Pairing",
    3: "Security",
    4: "Mute",
    5: "Reset"
};

const indexToIcon: KeyValue = {
    1: "mdi:power",
    2: "mdi:link-variant",
    3: "mdi:security",
    4: "mdi:music",
    5: "mdi:cog-sync"
};

const deviceTriggerIndexToName: KeyValue = {
    1: "Power",
    2: "Pairing",
    3: "Security",
    4: "Mute",
    5: "Reset"
};
export default class ButtonDevice extends Device {

    public entities: (EventPlatform | DeviceTriggerPlatform)[] = [];

    constructor(entities: Entity[] = [], database: Database) {
        super(constant.deviceObjectId.buttonDevice, database);
        if (entities.length > 0) {
            for (const entity of entities) {
                if (entity.platform === "event") {
                    const eventEntity = new EventPlatform({
                        object_id: entity.object_id,
                        platform: entity.platform,
                        unique_id: entity.unique_id,
                        identifier: entity.device.identifiers,
                        name: entity.name,
                        availability_topic: entity.availability_topic,
                        state_topic: entity.state_topic,
                        config_topic: entity.config_topic,
                        device_name: entity.device.name,
                        value_template: entity.value_template,
                        event_types: (entity as EventPlatform).event_types,
                        index: entity.index,
                        hw_version: entity.device.hw_version,
                        sw_version: entity.device.sw_version,
                        isFirstInit: false,
                        icon: entity.icon
                    });
                    this.entities.push(eventEntity);
                } else if (entity.platform === "device_automation") {
                    const deviceTriggerEntity = new DeviceTriggerPlatform({
                        platform: entity.platform,
                        identifier: entity.device.identifiers,
                        availability_topic: entity.availability_topic,
                        topic: (entity as DeviceTriggerPlatform).topic,
                        config_topic: entity.config_topic,
                        device_name: entity.device.name,
                        index: entity.index,
                        hw_version: entity.device.hw_version,
                        sw_version: entity.device.sw_version,
                        type: (entity as DeviceTriggerPlatform).type,
                        subtype: (entity as DeviceTriggerPlatform).subtype,
                        automation_type: (entity as DeviceTriggerPlatform).automation_type,
                        payload: entity.payload,
                        isFirstInit: false,
                    });
                    this.entities.push(deviceTriggerEntity);
                }
            }
        } else {
            this.init();
        }

        this.save();
    }

    private init() {
        const object_id = this.object_id;
        const eventObjectId = constant.deviceObjectId.buttonEventEntity;
        const deviceTriggerObjectId = constant.deviceObjectId.buttonAutomationEntity;
        const platform = "event";
        const deviceTriggerPlatform = "device_automation";

        for (let i = 1; i < 6; i++) {
            const eventEntity = new EventPlatform({
                object_id: eventObjectId,
                platform,
                unique_id: `${eventObjectId}_${i}`,
                identifier: `${object_id}`,
                name: indexToName[i] as string,
                availability_topic: `${config.MQTT_CONFIG.BASIC_TOPIC}/${platform}/${eventObjectId}_${i}/availability`,
                state_topic: `${config.MQTT_CONFIG.BASIC_TOPIC}/${platform}/${eventObjectId}_${i}/state`,
                config_topic: `${constant.baseHomeassistantTopic}/${platform}/${eventObjectId}_${i}/config`,
                device_name: "iHost Button",
                value_template: "{\"event_type\": \"{{ value_json.press }}\"}",
                event_types: i < 5 ? ["Single Click"] : ["Double Click", "Long Click"],
                index: i,
                hw_version: constant.deviceInfo.hw_version,
                sw_version: constant.deviceInfo.sw_version,
                icon: indexToIcon[i],
                isFirstInit: true,
            });
            this.entities.push(eventEntity);

            const deviceTriggerEntity = new DeviceTriggerPlatform({
                platform: deviceTriggerPlatform,
                identifier: `${object_id}`,
                availability_topic: `${constant.baseHomeassistantTopic}/${deviceTriggerPlatform}/${deviceTriggerObjectId}/${deviceTriggerIndexToName[i].toLowerCase()}_${i < 5 ? "single" : "double"}/availability`,
                topic: `${constant.baseHomeassistantTopic}/${deviceTriggerPlatform}/${deviceTriggerObjectId}/${deviceTriggerIndexToName[i].toLowerCase()}_${i < 5 ? "single" : "double"}/state`,
                config_topic: `${constant.baseHomeassistantTopic}/${deviceTriggerPlatform}/${deviceTriggerObjectId}/${deviceTriggerIndexToName[i].toLowerCase()}_${i < 5 ? "single" : "double"}/config`,
                device_name: "iHost Button",
                index: i,
                hw_version: constant.deviceInfo.hw_version,
                sw_version: constant.deviceInfo.sw_version,
                type: deviceTriggerIndexToName[i],
                subtype: i < 5 ? "Single Click" : "Double Click",
                automation_type: "trigger",
                payload: i < 5 ? "Single Click" : "Double Click",
                isFirstInit: true,
            });
            this.entities.push(deviceTriggerEntity);
            if (i === 5) {
                this.entities.push(new DeviceTriggerPlatform({
                    platform: deviceTriggerPlatform,
                    identifier: `${object_id}`,
                    availability_topic: `${constant.baseHomeassistantTopic}/${deviceTriggerPlatform}/${deviceTriggerObjectId}/${deviceTriggerIndexToName[i].toLowerCase()}_long/availability`,
                    topic: `${constant.baseHomeassistantTopic}/${deviceTriggerPlatform}/${deviceTriggerObjectId}/${deviceTriggerIndexToName[i].toLowerCase()}_long/state`,
                    config_topic: `${constant.baseHomeassistantTopic}/${deviceTriggerPlatform}/${deviceTriggerObjectId}/${deviceTriggerIndexToName[i].toLowerCase()}_long/config`,
                    device_name: "iHost Buttons",
                    index: i,
                    hw_version: constant.deviceInfo.hw_version,
                    sw_version: constant.deviceInfo.sw_version,
                    type: deviceTriggerIndexToName[i],
                    subtype: "Long Click",
                    automation_type: "trigger",
                    payload: "Long Click",
                    isFirstInit: true,
                }));
            }
        }
    }

    parseMqttPayloadToSerial(payload: eventData.MqttMessage) {
        return null;
    }

    parseSerialPayloadToMqtt(payload: Buffer): { topic: string, payload: KeyValue | string, options?: KeyValue }[] | null | undefined {
        const { buttonNumber, triggerType } = utils.parseBinaryFrameForButton(payload) ?? {};
        logger.info(`buttonNumber ${buttonNumber}, triggerType ${triggerType}`);
        // Disable the single-click action for the reset button
        if (buttonNumber == null || triggerType == null || (buttonNumber === 4 && triggerType === 0)) {
            return null;
        }

        const eventEntity = this.entities.find(f => f.index === (buttonNumber + 1) && f.platform === "event");
        const option = triggerType === 0 ? "Single Click" : triggerType === 1 ? "Double Click" : "Long Click";
        const deviceTriggerEntity = this.entities.find((f) => f.index === (buttonNumber + 1) && f.platform === "device_automation" && (f as DeviceTriggerPlatform).subtype === option);

        if (eventEntity && deviceTriggerEntity) {
            return [{
                topic: eventEntity.state_topic as string,
                payload: {
                    press: option
                },
                options: {
                    retain: false
                }
            }, {
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                topic: (deviceTriggerEntity as DeviceTriggerPlatform).topic as string,
                payload: option,
                options: {
                    retain: false
                }
            }];
        }
    }

    save() {
        this.database.save({ deviceid: constant.deviceObjectId.buttonDevice, entities: this.entities });
    }

}
