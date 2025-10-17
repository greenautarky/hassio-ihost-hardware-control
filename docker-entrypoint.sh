#!/usr/bin/env bashio
# Check whether it is launched in an iHost environment
bashio::log.info "os info: "
OS=$(bashio::os)
bashio::log.info "$OS"

BOARD=$(echo "$OS" | jq -r '.board')
bashio::log.info "Board: $BOARD"

if [ "$BOARD" != "ihost" ]; then
    bashio::log.error "Failed to start the add-on. Home Assistant must be running on iHost."
    bashio::exit.nok
fi

NOW=$(date +%s.%N)

HOST_INFO=$(bashio::host)
bashio::log.info "$HOST_INFO"
BOOT_TIMESTAMP=$(echo "$HOST_INFO" | jq -r '.boot_timestamp') 
STARTUP_TIME=$(echo "$HOST_INFO" | jq -r '.startup_time')

# Check if boot_timestamp is 0 or empty
if [[ -z "$BOOT_TIMESTAMP" || "$BOOT_TIMESTAMP" == "0" ]]; then
    bashio::log.info "boot_timestamp is 0 or empty, assuming boot start"
    export ADDON_START_METHOD="boot"
else
    BOOT_SECONDS=$(echo "$BOOT_TIMESTAMP / 1000000" | bc -l)
    FULLY_READY_TIME=$(echo "$BOOT_SECONDS + $STARTUP_TIME" | bc -l)

    TIME_DIFF=$(echo "$NOW - $FULLY_READY_TIME" | bc -l)
    # ABS_DIFF=$(echo "if ($TIME_DIFF < 0) -($TIME_DIFF) else $TIME_DIFF" | bc)

    bashio::log.info "${NOW}"
    bashio::log.info "${BOOT_SECONDS}"
    bashio::log.info "${FULLY_READY_TIME}"
    bashio::log.info "${TIME_DIFF}"

    if (( $(echo "$TIME_DIFF <= 240" | bc -l) )); then
        export ADDON_START_METHOD="boot"
        bashio::log.info "addon start by boot"
    fi
fi

bashio::log.info "Node.js version: $(node --version)"
bashio::log.info "npm version: $(npm --version)"

if ! bashio::services.available "mqtt"; then
    bashio::log.warning "MQTT service not found!"
    #bashio::log.info "Installing Mosquitto Addon..." #TODO add proper failure handling
    #if ! bashio::addon.install "core_mosquitto"; then 
    #    bashio::log.fatal "Mosquitto Addon fail"
    #fi
    #bashio::log.info "Mosquitto Addon install success"
    # sleep 20
    #bashio::addons.reload
    #bashio::log.info "Mosquitto Addon start..."
fi

#STATE=$(bashio::addon.state "core_mosquitto")
STATE=$(bashio::addon.state "addon_009f61ec_ga_mosquitto")

if [[ $STATE != "started" ]]; then
    bashio::log.warning "Mosquitto not running, current state: $(bashio::addon.state "core_mosquiaddon_009f61ec_ga_mosquittotto")"
    ##bashio::addon.start "addon_009f61ec_ga_mosquitto" //TODO Handle via VOS Manager ?
    bashio::addons.reload
    sleep 20
fi

MQTT_HOST=$(bashio::services mqtt "host")
MQTT_PORT=$(bashio::services mqtt "port")
MQTT_USER=$(bashio::services mqtt "username")
MQTT_PASS=$(bashio::services mqtt "password")

bashio::log.info "Host: ${MQTT_HOST}"
bashio::log.info "Port: ${MQTT_PORT}"
bashio::log.info "Username: ${MQTT_USER}"
# bashio::log.info "Password: ${MQTT_PASS}"
bashio::log.info "SSL: $(bashio::services 'mqtt' 'ssl')"

bashio::log.info "$(bashio::addon.version)"

export IHOST_HARDWARE_VERSION=$(bashio::addon.version)

if bashio::var.true "$(bashio::services 'mqtt' 'ssl')"; then
    export MQTT_SERVER="mqtts://$MQTT_HOST:$MQTT_PORT"
else
    export MQTT_SERVER="mqtt://$MQTT_HOST:$MQTT_PORT"
fi

export MQTT_USER MQTT_PASS

bashio::log.info "Starting application..."
exec "$@"