/**
 * 日志工具模块
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

class Logger {
  constructor() {
    this.level = LOG_LEVELS.info;
    this.enableDebug = false;
  }

  setLevel(level) {
    if (level in LOG_LEVELS) {
      this.level = LOG_LEVELS[level];
    }
  }

  enableDebugMode() {
    this.enableDebug = true;
    this.level = LOG_LEVELS.debug;
  }

  debug(message, ...args) {
    if (this.enableDebug || this.level <= LOG_LEVELS.debug) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message, ...args) {
    if (this.level <= LOG_LEVELS.info) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  warn(message, ...args) {
    if (this.level <= LOG_LEVELS.warn) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message, ...args) {
    if (this.level <= LOG_LEVELS.error) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();
