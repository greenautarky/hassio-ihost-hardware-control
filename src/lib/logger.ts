import log4js from 'log4js';
import path from 'path';
import config from '../config/config';
import fs from "fs";

interface LogConfig {
  logLevel: string; // ALL、DEBUG、INFO、WARN、ERROR、OFF。
  logDirPath?: string;
  logMaxSize?: number;
}

// Map common values ("warning" -> "WARN") and normalize (minimal + safe)
function normalizeLevel(input?: string): string {
  const v = (input || '').trim().toUpperCase();
  if (!v) return 'WARN';

  const mapped = (v === 'WARNING') ? 'WARN' : v;

  // Guard against invalid levels (prevents misconfig from breaking logs)
  const allowed = new Set(['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'OFF']);
  return allowed.has(mapped) ? mapped : 'WARN';
}

// Read from env (set this from your add-on run script)
const envLogLevel = normalizeLevel(process.env.LOG_LEVEL);

const defaultSystemLogConfig: LogConfig = {
  logLevel: envLogLevel || 'WARN', // default + env override
  logDirPath: config.LOGGER_CONFIG.path,
  logMaxSize: 1024 * 5,
};

if (!fs.existsSync(config.LOGGER_CONFIG.path)) {
  fs.mkdirSync(config.LOGGER_CONFIG.path, { recursive: true });
}

const runtimeLoggerInformation: LogConfig = { ...defaultSystemLogConfig };

const createLoggerOptions = (config: LogConfig) => {
  return {
    appenders: {
      console: {
        type: 'console',
        layout: {
          type: 'pattern',
          pattern: '%[[%x{myTime}] [%p] %c -%] %m',
          tokens: {
            myTime: (logEvent: log4js.LoggingEvent) => logEvent.startTime.toISOString(),
          },
        },
      },
      ihostHa: {
        type: 'file',
        filename: path.join(config.logDirPath ?? "", 'ihost_ha.log'),
        maxLogSize: `${config.logMaxSize}K`,
        backups: 1,
        compress: true,
        layout: {
          type: 'pattern',
          pattern: '%[[%x{myTime}] [%p] %c -%] %m',
          tokens: {
            myTime: (logEvent: log4js.LoggingEvent) => logEvent.startTime.toISOString(),
          },
        },
      },
    },
    categories: {
      default: {
        appenders: ['console', "ihostHa"],
        level: config.logLevel,
      },
    },
    pm2: true,
  };
};

// init logger config
log4js.configure(createLoggerOptions(defaultSystemLogConfig));
const _logger: log4js.Logger = log4js.getLogger();

// update logger configs
function updateLogConfig(level: string, logDirPath?: string, logMaxSize?: number) {
  const newConfig: LogConfig = {
    logLevel: normalizeLevel(level), // minimal: keep consistent with env normalization
    logDirPath,
    logMaxSize,
  };

  if (runtimeLoggerInformation.logLevel != null) {
    runtimeLoggerInformation.logLevel = newConfig.logLevel;
  }
  if (runtimeLoggerInformation.logDirPath != null) {
    runtimeLoggerInformation.logDirPath = logDirPath;
  }
  if (runtimeLoggerInformation.logMaxSize != null) {
    runtimeLoggerInformation.logMaxSize = logMaxSize;
  }

  // shutdown logger
  log4js.shutdown();

  log4js.configure(createLoggerOptions(newConfig));
  return runtimeLoggerInformation;
}

function getSystemLogConfig() {
  return defaultSystemLogConfig;
}

export default {
  debug: (...args: Parameters<typeof _logger.debug>) => _logger.debug(...args),
  info: (...args: Parameters<typeof _logger.info>) => _logger.info(...args),
  warn: (...args: Parameters<typeof _logger.warn>) => _logger.warn(...args),
  error: (...args: Parameters<typeof _logger.error>) => _logger.error(...args),
  updateLogConfig,
  getSystemLogConfig,
  defaultSystemLogConfig,
  getRuntimeLoggerInformation: () => {
    return runtimeLoggerInformation;
  },
};
