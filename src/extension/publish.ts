import logger from "../lib/logger";
import Extension from "./extension";

export default class Publish extends Extension {

    start(): void {
        this.eventBus.onSerialMessage(this, this.handleSerialMessage.bind(this));
    }

    async handleSerialMessage(eventData: Buffer): Promise<void> {
        try {
            for (const device of this.devices) {
                const data = device.parseSerialPayloadToMqtt(eventData);
                if (Array.isArray(data)) {
                    for (const item of data) {
                        await this.mqtt.publish({
                            topic: item.topic,
                            payload: item.payload,
                            options: item.options ?? { retain: true }
                        });
                    }
                    break;
                }
            }
        } catch (error) {
            logger.error(`handleSerialMessage error`, error);
        }
    }

}