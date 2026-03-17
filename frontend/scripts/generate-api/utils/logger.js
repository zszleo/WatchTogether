/**
 * 日志工具模块
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * 日志级别
 */
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4
};

/**
 * 日志工具类
 */
class Logger {
  constructor(options = {}) {
    this.level = options.level || (process.env.DEBUG ? LogLevel.DEBUG : LogLevel.INFO);
    this.prefix = options.prefix || '[OpenAPI-Generator]';
    this.useColors = options.useColors !== false;
  }

  /**
   * 格式化消息
   */
  formatMessage(level, message) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let levelStr = level.toUpperCase();
    let prefix = this.prefix;

    if (this.useColors) {
      const colorMap = {
        debug: colors.cyan,
        info: colors.green,
        warn: colors.yellow,
        error: colors.red
      };
      const color = colorMap[level] || colors.reset;
      levelStr = `${color}${levelStr}${colors.reset}`;
      prefix = `${colors.dim}${prefix}${colors.reset}`;
    }

    return `${timestamp} ${prefix} ${levelStr}: ${message}`;
  }

  /**
   * 记录调试信息
   */
  debug(...args) {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(this.formatMessage('debug', args.join(' ')));
    }
  }

  /**
   * 记录一般信息
   */
  info(...args) {
    if (this.level <= LogLevel.INFO) {
      console.log(this.formatMessage('info', args.join(' ')));
    }
  }

  /**
   * 记录警告信息
   */
  warn(...args) {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.formatMessage('warn', args.join(' ')));
    }
  }

  /**
   * 记录错误信息
   */
  error(...args) {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.formatMessage('error', args.join(' ')));
    }
  }

  /**
   * 记录成功信息
   */
  success(...args) {
    if (this.level <= LogLevel.INFO) {
      const message = args.join(' ');
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      let prefix = this.prefix;
      
      if (this.useColors) {
        prefix = `${colors.dim}${prefix}${colors.reset}`;
        console.log(`${timestamp} ${prefix} ${colors.green}✓${colors.reset} ${message}`);
      } else {
        console.log(`${timestamp} ${prefix} ✓ ${message}`);
      }
    }
  }

  /**
   * 记录进度信息
   */
  progress(current, total, message = '') {
    if (this.level <= LogLevel.INFO) {
      const percent = Math.round((current / total) * 100);
      const barLength = 20;
      const filledLength = Math.round(barLength * current / total);
      const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
      
      if (this.useColors) {
        process.stdout.write(
          `\r${colors.cyan}[${bar}]${colors.reset} ${percent}% ${message}`
        );
      } else {
        process.stdout.write(`\r[${bar}] ${percent}% ${message}`);
      }
      
      if (current === total) {
        process.stdout.write('\n');
      }
    }
  }

  /**
   * 创建子日志器
   */
  child(prefix) {
    return new Logger({
      level: this.level,
      prefix: `${this.prefix} ${prefix}`,
      useColors: this.useColors
    });
  }
}

// 创建默认日志器
const defaultLogger = new Logger();

module.exports = {
  Logger,
  LogLevel,
  logger: defaultLogger
};