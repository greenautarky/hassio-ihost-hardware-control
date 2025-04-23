import type SelectPlatform from "./platform/select";
import type EventPlatform from "./platform/event";
import type DeviceTriggerPlatform from "./platform/device_trigger";
import Database from "../db/database";

export default abstract class Device {
    public object_id: string;
    public database: Database;

    constructor(object_id: string, database: Database) {
        this.object_id = object_id;
        this.database = database;
    }

    public abstract entities: (EventPlatform | SelectPlatform | DeviceTriggerPlatform)[];
    abstract parseMqttPayloadToSerial(data: eventData.MqttMessage): { buffer: Buffer, mqttResponse: { topic: string, payload: KeyValue } } | null | undefined;
    abstract parseSerialPayloadToMqtt(payload: Buffer): { topic: string, payload: KeyValue | string, options?: KeyValue }[] | null | undefined;
    abstract save(): void;
}