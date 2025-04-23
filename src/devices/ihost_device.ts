import EventPlatform from "./platform/event";
import constant from "../constant";
import Device from "./device";
import DeviceTriggerPlatform from "./platform/device_trigger";
import Database from "../db/database";
import Entity from "./platform/entity";

const TYPE = "is started";
export default class IhostDevice extends Device {
    public entities: (EventPlatform | DeviceTriggerPlatform)[] = [];

    constructor(entities: Entity[] = [], database: Database) {
        super(constant.deviceObjectId.ihostDevice, database);
        if (entities.length > 0) {
            for (const entity of entities) {
                this.entities.push(new DeviceTriggerPlatform({
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
                }));
            }
        } else {
            this.init();
        }
    }

    parseMqttPayloadToSerial(payload: eventData.MqttMessage) {
        return null;
    }

    parseSerialPayloadToMqtt(payload: Buffer): { topic: string, payload: KeyValue | string, options?: KeyValue }[] | null | undefined {
        return null;
    }

    save(): void {
        this.database.save({ deviceid: constant.deviceObjectId.ihostDevice, entities: this.entities });
    }

    private init() {
        const object_id = this.object_id;
        const platform = "device_automation";
        this.entities.push(new DeviceTriggerPlatform({
            platform,
            identifier: `${object_id}`,
            availability_topic: `${constant.baseHomeassistantTopic}/${platform}/${object_id}/system/availability`,
            topic: `${constant.baseHomeassistantTopic}/${platform}/${object_id}/system/state`,
            config_topic: `${constant.baseHomeassistantTopic}/${platform}/${object_id}/system/config`,
            device_name: "iHost Hardware Control Automations",
            index: 0,
            hw_version: constant.deviceInfo.hw_version,
            sw_version: constant.deviceInfo.sw_version,
            type: TYPE,
            subtype: "Home Assistant",
            automation_type: "trigger",
            payload: "start",
            isFirstInit: true,
        }));

        this.save();
    }

}
