import Device from "../devices/device";

export default abstract class Extension {

    protected serialPort: SerialPortType;
    protected mqtt: MqttType;
    protected eventBus: EventBusType;
    protected devices: Device[];

    constructor(mqtt: MqttType, serialPort: SerialPortType, eventBus: EventBusType, devices: Device[]) {
        this.mqtt = mqtt;
        this.serialPort = serialPort;
        this.eventBus = eventBus;
        this.devices = devices;
    }

    /**
     * Is called once the extension has to start
     */
    abstract start(): void;

    /**
     * Is called once the extension has to stop
     */
    // eslint-disable-next-line @typescript-eslint/require-await
    async stop(): Promise<void> {
        this.eventBus.removeListeners(this);
        // this.otaEventBus.removeListeners(this);
    }
}
