import logger from "../lib/logger";
import Extension from "./extension";

export default class Reveive extends Extension {

    start(): void {
        this.eventBus.onMqttMessage(this, this.handleMqttMessage.bind(this));
    }

    async handleMqttMessage(eventData: eventData.MqttMessage) {
        try {
            for (const device of this.devices) {
                const { buffer, mqttResponse } = device.parseMqttPayloadToSerial(eventData) ?? {};
                if (buffer && mqttResponse) {
                    await this.serialPort.send(buffer);
                    await this.mqtt.publish({
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                        topic: mqttResponse?.topic as string,
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                        payload: mqttResponse?.payload as KeyValue,
                        options: { retain: true, properties: eventData?.packet?.properties }
                    });
                }
            }
        } catch (error) {
            logger.error(`handleMqttMessage error`, error);
        }
    }

}

