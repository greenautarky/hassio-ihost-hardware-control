import fs from "fs";

const optionsPath = "/data/options.json";
const options = fs.readFileSync(optionsPath, { encoding: "utf8" });
// console.log(`options = `, options);
const optionsConfig = JSON.parse(options);

// console.log(`process.env = `, process.env);

const mqtt = optionsConfig.mqtt ?? {};

let mqttServer = mqtt.server;
let mqttUsername = mqtt.username;
let mqttPassword = mqtt.password;
const MQTT_SERVER = process.env.MQTT_SERVER;
const MQTT_USER = process.env.MQTT_USER;
const MQTT_PASS = process.env.MQTT_PASS;
const dataPath = optionsConfig.data_path;

console.log(`MQTT_SERVER = ${MQTT_SERVER} MQTT_USER = ${MQTT_USER}`);
if (!mqttServer || !mqttUsername || !mqttPassword) {
    mqttServer = MQTT_SERVER;
    mqttUsername = MQTT_USER;
    mqttPassword = MQTT_PASS;
}

export default {
    MQTT_CONFIG: {
        URL: mqttServer ?? "",
        USERNAME: mqttUsername ?? "",
        PASSWORD: mqttPassword ?? "",
        BASIC_TOPIC: "ihost-ha"
    },
    // MQTT_CONFIG: {
    //     URL: "mqtt://localhost",
    //     USERNAME: "test",
    //     PASSWORD: "12345678",
    //     BASIC_TOPIC: "ihost-ha",
    //     CLIENT_ID: "ihost-ha"
    // },
    SerialConfig: {
        path: '/dev/ttyS3',
        baudRate: 115200,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        autoOpen: true,
    },
    LOGGER_CONFIG: {
        path: `${dataPath}/logs`
        // path: `/data/ihost-test/logs`
    },
    DatabasePath: {
        dirPath: `${dataPath}/data`,
        filePath: `db.json`
    }
};