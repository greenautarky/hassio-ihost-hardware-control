import type mqtt from "../lib/mqtt";
import type SerialPort from "../lib/serialPort";
import type EventBus from "../lib/event_bus";
import type { SerialPort } from "serialport";
import type { MqttClient, IClientOptions, IPublishPacket, IClientPublishOptions, IClientSubscribeOptions } from 'mqtt';


declare global {
    interface KeyValue {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [s: string]: any;
    }

    type MqttType = mqtt;
    type SerialPortType = SerialPort;
    type EventBusType = EventBus;

    namespace eventData {
        type HardwareData = {
            data: {
                triggerType: number
                buttonNumber: number
            }
        };

        type MqttMessage = {
            topic: string,
            message: any,
            packet?: IPublishPacket
        };
    }

}

export interface ConfigDef {
    readonly platform?: string;
    readonly object_id: string | undefined | null;
    readonly unique_id: string | undefined | null;
    readonly availability_topic?: string | undefined | null;
    readonly config_topic: string | undefined | null;
    readonly state_topic: string | undefined | null;
    readonly command_topic: string | undefined | null;
    readonly availability_template: string;
    readonly name: string | undefined | null;
    readonly device: DeviceMap;
    readonly command_template?: string;
    readonly icon?: string;
    readonly entity_icon?: string;
    payload?: any;
}

export interface DeviceMap {
    /**
     * A link to the webpage that can manage the configuration of this device.
     * Can be either an http://, https:// or an internal homeassistant:// URL.
     */
    configuration_url?: string;

    /**
     * A list of connections of the device to the outside world as a list of tuples [connection_type, connection_identifier].
     * For example the MAC address of a network interface: "connections": [["mac", "02:5b:26:a8:dc:12"]].
     */
    connections?: string[][];

    /**
     * The hardware version of the device.
     */
    hw_version?: string;

    /**
     * A list of IDs that uniquely identify the device. For example a serial number.
     */
    identifiers: string;

    /**
     * The manufacturer of the device.
     */
    manufacturer?: string;

    /**
     * The model of the device.
     */
    model?: string;

    /**
     * The model identifier of the device.
     */
    model_id?: string;

    /**
     * The name of the device.
     */
    name?: string;

    /**
     * The serial number of the device.
     */
    serial_number?: string;

    /**
     * Suggest an area if the device isn’t in one yet.
     */
    suggested_area?: string;

    /**
     * The firmware version of the device.
     */
    sw_version?: string;

    /**
     * Identifier of a device that routes messages between this device and Home Assistant.
     * Examples of such devices are hubs, or parent devices of a sub-device. This is used to show device topology in Home Assistant.
     */
    via_device?: string;

    icon?: string;
}

export interface ConfigOptions {
    identifier: string;
    object_id?: string;
    unique_id?: string;
    config_topic: string;
    index?: number;
    name?: string;
    availability_topic?: string;
    command_topic?: string;
    state_topic?: string;
    model?: string;
    value_template?: string;
    device_class?: string;
    device_name?: string;
    platform?: string;
    command_template?: string;
    sw_version?: string;
    hw_version?: string;
    icon?: string;
    entity_icon?: string;
    payload?: any;
    isFirstInit: boolean;
}

export interface ButtonParsedFrame {
    frameHeader: string;
    length: number;
    commandType: string;
    commandCode: string;
    frameSequence: string;
    buttonNumber: number;
    triggerType: number;
    triggerParam: number;
    checksum: string;
    ihostType: string;
}
