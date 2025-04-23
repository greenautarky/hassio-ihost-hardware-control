
const IHOST_HARDWARE_VERSION = process.env.IHOST_HARDWARE_VERSION;

export default {
    hardwareType: {
        button: "button"
    },
    buttonType: {
        POWER: 0x00,      // Power button
        PAIR: 0x01,       // Pairing button
        SECURITY: 0x02,   // Security button
        RHYTHM: 0x03,     // Rhythm button
        RESET: 0x04       // Reset button
    },
    baseHomeassistantTopic: "homeassistant",
    deviceObjectId: {
        buttonDevice: "100000001_button_device",
        indicatorsDevice: "10000002_select",
        ihostDevice: "1000000003_ihost",

        buttonEventEntity: "10000001_event",
        buttonAutomationEntity: "10000001_device_automation",

    },
    deviceInfo: {
        sw_version: IHOST_HARDWARE_VERSION ?? "1.0.0",
        hw_version: "1.2.0",
        manufacturer: "iHost Open Source Project",
    }
};