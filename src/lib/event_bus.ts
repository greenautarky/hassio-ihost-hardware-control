import events from 'events';
events.captureRejections = true;

interface ControllerEventBusMap {
    HardwareButton: [data: eventData.HardwareData];
    SerialMessage: [data: Buffer];
    MqttMessage: [data: eventData.MqttMessage];
}

type EventBusListener<K, R> = K extends keyof ControllerEventBusMap
    ? ControllerEventBusMap[K] extends unknown[]
    ? (...args: ControllerEventBusMap[K]) => R
    : never
    : never;

interface EventEmitterMethods {
    emit: (eventName: keyof ControllerEventBusMap, ...args: any[]) => void;
    on: (eventName: keyof ControllerEventBusMap, callback: EventBusListener<keyof ControllerEventBusMap, void>) => events.EventEmitter;
    once: (eventName: keyof ControllerEventBusMap, callback: EventBusListener<keyof ControllerEventBusMap, void>) => events.EventEmitter;
    removeListener: (eventName: keyof ControllerEventBusMap, callback: EventBusListener<keyof ControllerEventBusMap, void>) => events.EventEmitter;
    addListener: (eventName: keyof ControllerEventBusMap, callback: EventBusListener<keyof ControllerEventBusMap, void>) => events.EventEmitter;
    removeAllListeners: (eventName?: keyof ControllerEventBusMap) => events.EventEmitter;
}

export default class EventBus {
    private callbacksByExtension: { [s: string]: { eventName: keyof ControllerEventBusMap; callback: EventBusListener<keyof ControllerEventBusMap, void> }[] } = {};
    private emitter: EventEmitterMethods;

    constructor(onError: (err: Error) => void) {
        const event = new events.EventEmitter();
        (event as any).captureRejections = true;

        event.setMaxListeners(100);
        event.on('error', onError);

        this.emitter = {
            emit: (...args: [string, ...any[]]) => {
                setImmediate(() => {
                    event.emit(...args);
                });
            },
            on: (eventName: keyof ControllerEventBusMap, callback: EventBusListener<keyof ControllerEventBusMap, void>) => {
                return event.on(eventName, callback);
            },
            once: (eventName: keyof ControllerEventBusMap, callback: EventBusListener<keyof ControllerEventBusMap, void>) => {
                return event.once(eventName, callback);
            },
            removeListener: (eventName: keyof ControllerEventBusMap, callback: EventBusListener<keyof ControllerEventBusMap, void>) => {
                return event.removeListener(eventName, callback);
            },
            addListener: (eventName: keyof ControllerEventBusMap, callback: EventBusListener<keyof ControllerEventBusMap, void>) => {
                return event.addListener(eventName, callback);
            },
            removeAllListeners: (eventName?: keyof ControllerEventBusMap) => {
                return event.removeAllListeners(eventName);
            }
        } as EventEmitterMethods;
    }

    private on(eventName: keyof ControllerEventBusMap, callback: EventBusListener<keyof ControllerEventBusMap, void>, key: object) {
        const extensionName = key.constructor.name;
        if (!this.callbacksByExtension[extensionName]) {
            this.callbacksByExtension[extensionName] = [];
        }
        this.callbacksByExtension[extensionName].push({ eventName, callback });
        this.emitter.on(eventName, callback);
    }

    removeListeners(key: object): void {
        const extensionName = key.constructor.name;
        this.callbacksByExtension[extensionName]?.forEach(
            ({ eventName, callback }) => {
                this.emitter.removeListener(eventName, callback);
            }
        );
        delete this.callbacksByExtension[extensionName];
    }

    emitHardwareButton(data: eventData.HardwareData) {
        this.emitter.emit('HardwareButton', data);
    }
    onHardwareButton(key: object, callback: EventBusListener<keyof ControllerEventBusMap, void>) {
        this.on('HardwareButton', callback, key);
    }

    emitSerialMessage(data: Buffer) {
        this.emitter.emit('SerialMessage', data);
    }
    onSerialMessage(key: object, callback: EventBusListener<keyof ControllerEventBusMap, void>) {
        this.on('SerialMessage', callback, key);
    }

    emitMqttMessage(data: eventData.MqttMessage) {
        this.emitter.emit('MqttMessage', data);
    }
    onMqttMessage(key: object, callback: EventBusListener<keyof ControllerEventBusMap, void>) {
        this.on('MqttMessage', callback, key);
    }

}
