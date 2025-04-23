# Use official HA armv7 base image (Alpine Linux based)
ARG BUILD_FROM=ghcr.io/home-assistant/armv7-base:3.18
FROM $BUILD_FROM

# Set working directory
WORKDIR /app

# Install Node.js and base dependencies (Node.js not included in HA base image by default)
RUN apk add --no-cache nodejs npm tini

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install && npm cache clean --force

# Copy source code and build
COPY . .
RUN npm run build

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set metadata
LABEL org.opencontainers.image.source="https://github.com/iHost-Open-Source-Project/hassio-ihost-hardware-control"
LABEL org.opencontainers.image.description="In the HA over iHost project, the iHost Hardware Control Add-on is used to manage physical buttons and indicator lights on the device. It registers these components as entities in Home Assistant, allowing users to configure automation rules directly in HA for more flexible hardware interaction control."
LABEL org.opencontainers.image.licenses="MIT"
LABEL io.hass.version="1.1.3"
LABEL io.hass.type="addon"
LABEL io.hass.arch="armv7"

# Use Tini as init process with entrypoint script
ENTRYPOINT ["/sbin/tini", "-s", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]