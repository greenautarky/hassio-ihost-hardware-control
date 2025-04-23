import constant from "../../constant";
import { ConfigOptions, DeviceMap } from "../../type/types";

export default abstract class Entity {
    public readonly object_id?: string;
    public readonly unique_id?: string;
    public readonly availability_topic?: string;
    public readonly config_topic: string;
    public readonly state_topic?: string;
    public readonly command_topic?: string;
    public readonly availability_template: string;
    public readonly name?: string;
    public readonly device: DeviceMap;
    public readonly origin:
        | { name?: string; sw?: string; url?: string }
        | undefined;
    public readonly value_template?: string;
    public readonly device_class?: string;
    public readonly platform?: string;
    public readonly index?: number;
    public readonly command_template?: string;
    public readonly icon?: string;
    public payload?: any;
    public isFirstInit: boolean;

    constructor(options: ConfigOptions) {
        this.platform = options.platform;
        this.object_id = options.object_id;
        this.unique_id = options.unique_id;
        this.availability_topic = options.availability_topic;
        this.config_topic = options.config_topic;
        this.state_topic = options.state_topic;
        this.command_topic = options.command_topic;
        this.availability_template = "{{ value_json.availability }}";
        this.name = options.name;
        this.value_template = options.value_template;
        this.device_class = options.device_class;
        this.index = options.index;
        this.command_template = options.command_template;
        this.payload = options.payload;
        this.isFirstInit = options.isFirstInit;
        this.icon = options.icon;
        this.device = {
            identifiers: options.identifier,
            manufacturer: constant.deviceInfo.manufacturer,
            name: options.device_name,
            hw_version: options.hw_version,
            sw_version: options.sw_version,
        };
    }

    abstract getDefinition(): KeyValue;
}
