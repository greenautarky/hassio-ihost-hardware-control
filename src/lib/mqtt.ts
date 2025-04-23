/* eslint-disable @typescript-eslint/restrict-template-expressions */
import mqtt, { MqttClient, IClientOptions, IPublishPacket, IClientPublishOptions, IClientSubscribeOptions } from 'mqtt';
import config from "../config/config";
import type EventBusType from './event_bus';
import logger from './logger';

const MQTT_CONFIG = config.MQTT_CONFIG;

interface PublishParams {
    topic: string;
    payload: string | object;
    options?: IClientPublishOptions;
    reqSequence?: number | string;
}

function getConnectOption(): IClientOptions {
    return {
        // clientId: MQTT_CONFIG.CLIENT_ID,
        username: MQTT_CONFIG.USERNAME,
        password: MQTT_CONFIG.PASSWORD,
        keepalive: 60,
        clean: true,
        protocolId: 'MQTT',
        protocolVersion: 5,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
        properties: {
            sessionExpiryInterval: 0
        },
        will: {
            topic: `${MQTT_CONFIG.BASIC_TOPIC}/system/availability`,
            retain: true,
            payload: JSON.stringify({ online: false, reason: "KeepAlive timeout" }),
            qos: 2,
            properties: {
                contentType: "application/json",
                payloadFormatIndicator: true,
                userProperties: {
                    // reqClientId: this.client.clientId,
                    reqSequence: Date.now().toString()
                },
            }
        }
    };
}
export default class MQTT {
    private eventBus: EventBusType;
    private connectionTimer: NodeJS.Timeout | null = null;
    private publishedTopics = new Set<string>();
    private client: MqttClient | null = null;
    private lastSeq = -1;
    // private readonly options = CONNECT_OPTION;
    private connectOption: IClientOptions;
    public baseTopic: string;

    constructor(eventBus: EventBusType) {
        this.eventBus = eventBus;
        this.connectOption = getConnectOption();
        this.baseTopic = MQTT_CONFIG.BASIC_TOPIC;
    }

    async connect(): Promise<void> {
        logger.info(`[mqtt] Connecting to MQTT server at ${MQTT_CONFIG.URL}, ${MQTT_CONFIG.USERNAME}`);

        return new Promise((resolve, reject) => {
            this.client = mqtt.connect(MQTT_CONFIG.URL, this.connectOption);
            this.client.stream.setMaxListeners(0);

            const onConnect = this.#onConnect.bind(this);
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            this.client.on('connect', () => {
                onConnect();
                logger.info(`[mqtt] mqtt client id = `, this.client?.options.clientId);
                resolve();
            });

            this.client.on('error', (err) => {
                logger.error(`[mqtt] MQTT error: ${err.message}`);
                reject(err);
            });
            this.client.on('message', this.onMessage.bind(this));
        });
    }

    disconnect(): void {
        this.client?.end(true);
    }

    isConnected(): boolean {
        return !!this.client && !this.client.reconnecting;
    }

    #onConnect(): void {
        // Set timer at interval to check if connected to MQTT server.
        if (this.connectionTimer) clearTimeout(this.connectionTimer);
        this.connectionTimer = setInterval(() => {
            if (!this.client) return;
            if (this.client.reconnecting) {
                logger.error('[mqtt] Not connected to MQTT server!');
            }
        }, 10 * 1000);

        logger.info('[mqtt] Connected to MQTT server');
    }

    private onMessage(topic: string, payload: Buffer, packet: IPublishPacket): void {
        if (this.publishedTopics.has(topic)) return;
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        try {
            logger.info(`topic = ${topic} payload = ${payload} packet = ${JSON.stringify(packet)}`);
        } catch (error) {
            logger.error(`onMessage message parse error`, error);
        }

        const eventData = {
            topic,
            message: payload,
            packet
        } as eventData.MqttMessage;

        this.eventBus.emitMqttMessage(eventData);

    }

    async publishStateOnline(): Promise<void> {
        await this.publish({
            topic: `${MQTT_CONFIG.BASIC_TOPIC}/system/availability`,
            payload: JSON.stringify({ online: true }),
            options: { retain: true, qos: 2 }
        });
    }

    private getSeq(): number {
        const curTs = Date.now();
        this.lastSeq = this.lastSeq === curTs ? curTs + 1 : curTs;
        return this.lastSeq;
    }

    subscribe(topic: string | string[], opt?: IClientSubscribeOptions): void {
        opt = Object.assign({}, { qos: 0, rap: true }, opt);
        this.client?.subscribe(topic, opt);
    }

    unSubscribe(topic: string | string[]): void {
        this.client?.unsubscribe(topic);
    }

    async publish({ topic, payload, options = {}, reqSequence }: PublishParams): Promise<void> {
        options.qos = 0;
        const defaultOptions = {
            qos: 0,
            retain: false,
            properties: {
                userProperties: {
                    reqClientId: this.client?.options.clientId,
                    reqSequence: reqSequence ?? Date.now()
                }
            }
        };
        if (!this.isConnected()) {
            logger.error(`Not connected to MQTT server!`);
            logger.error(`Cannot send message: topic: '${topic}', payload: '${JSON.stringify(payload)}`);
            return;
        }
        this.publishedTopics.add(topic);

        const actualOptions: IClientPublishOptions = { ...defaultOptions, ...options } as IClientPublishOptions;
        if (typeof payload === 'object') payload = JSON.stringify(payload);

        logger.info(`publish ==========> `, topic, payload, actualOptions);

        return new Promise((resolve, reject) => {
            this.client?.publish(
                topic,
                payload,
                actualOptions,
                (error) => {
                    if (error) {
                        // eslint-disable-next-line @typescript-eslint/no-base-to-string
                        logger.error(`publish ${topic} error, message is ${error}, opt is ${JSON.stringify(actualOptions)}`);
                        reject();
                    } else {
                        resolve();
                    }
                });
        });
    }
}