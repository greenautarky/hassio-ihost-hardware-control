import { ConfigOptions } from "../../type/types";
import Entity from "./entity";

export interface SelectConfig extends ConfigOptions {
    options: string[];
    lastLedColor: null | undefined | KeyValue;
}

export default class SelectPlatform extends Entity {
    public readonly options: string[];
    public lastLedColor: null | undefined | KeyValue;

    constructor(options: SelectConfig) {
        super(options);
        this.options = options.options;
        this.lastLedColor = options.lastLedColor;
    }

    getDefinition(): KeyValue {
        return {
            availability_topic: this.availability_topic,
            state_topic: this.state_topic,
            device: this.device,
            object_id: this.object_id,
            unique_id: this.unique_id,
            options: this.options,
            platform: this.platform,
            name: this.name,
            value_template: this.value_template,
            availability_template: this.availability_template,
            command_topic: this.command_topic,
            command_template: this.command_template,
            icon: this.icon,
        };
    }
}

