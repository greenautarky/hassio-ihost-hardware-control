import { ConfigOptions } from "../../type/types";
import Entity from "./entity";

export interface DeviceTriggerConfig extends ConfigOptions {
    automation_type: string;
    subtype: string;
    type: string;
    topic: string;
    // payload: string;
}

export default class DeviceTriggerPlatform extends Entity {
    public readonly automation_type: string;
    public readonly subtype: string;
    public readonly type: string;
    public readonly topic: string;

    constructor(options: DeviceTriggerConfig) {
        super(options);
        this.automation_type = options.automation_type;
        this.subtype = options.subtype;
        this.type = options.type;
        this.topic = options.topic;
    }

    getDefinition(): KeyValue {
        return {
            availability_topic: this.availability_topic,
            state_topic: this.state_topic,
            device: this.device,
            object_id: this.object_id,
            unique_id: this.unique_id,
            platform: this.platform,
            name: this.name,
            availability_template: this.availability_template,
            automation_type: this.automation_type,
            subtype: this.subtype,
            type: this.type,
            payload: this.payload,
            topic: this.topic
        };
    }
}

