import { ConfigOptions } from "../../type/types";
import Entity from "./entity";

export interface eventConfig extends ConfigOptions {
    event_types: string[];
}

export default class EventPlatform extends Entity {
    public readonly event_types: string[];

    constructor(options: eventConfig) {
        super(options);
        this.event_types = options.event_types;
    }

    getDefinition(): KeyValue {
        return {
            availability_topic: this.availability_topic,
            state_topic: this.state_topic,
            device: this.device,
            object_id: this.object_id,
            unique_id: this.unique_id,
            event_types: this.event_types,
            platform: this.platform,
            name: this.name,
            value_template: this.value_template,
            availability_template: this.availability_template,
            icon: this.icon,
        };
    }
}

