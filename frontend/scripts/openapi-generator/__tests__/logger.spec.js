/**
 * logger.js 日志工具模块单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger.js - 日志工具模块', () => {
  let logger;
  let consoleSpy;

  beforeEach(async () => {
    // 动态导入以获得新的实例
    const module = await import('../utils/logger.js');
    logger = module.logger;

    // 重置logger状态
    logger.enableDebug = false;
    logger.level = 1; // LOG_LEVELS.info

    // 监听 console 方法
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setLevel', () => {
    it('应该设置日志级别', () => {
      logger.setLevel('debug');
      logger.debug('test message');
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('应该忽略无效的日志级别', () => {
      const originalLevel = logger.level;
      logger.setLevel('invalid');
      expect(logger.level).toBe(originalLevel);
    });
  });

  describe('enableDebugMode', () => {
    it('应该启用调试模式', () => {
      logger.enableDebugMode();
      expect(logger.enableDebug).toBe(true);
      expect(logger.level).toBe(0); // LOG_LEVELS.debug
    });
  });

  describe('debug', () => {
    it('调试模式下应该输出日志', () => {
      logger.enableDebugMode();
      logger.debug('debug message', { data: 'test' });
      expect(consoleSpy.log).toHaveBeenCalledWith('[DEBUG] debug message', { data: 'test' });
    });

    it('非调试模式下不应该输出日志', () => {
      logger.setLevel('info');
      logger.debug('debug message');
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('应该输出 info 日志', () => {
      logger.setLevel('info');
      logger.info('info message');
      expect(consoleSpy.log).toHaveBeenCalledWith('[INFO] info message');
    });

    it('warn 级别下不应该输出 info 日志', () => {
      logger.setLevel('warn');
      logger.info('info message');
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('应该输出 warn 日志', () => {
      logger.setLevel('warn');
      logger.warn('warn message');
      expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN] warn message');
    });

    it('error 级别下不应该输出 warn 日志', () => {
      logger.setLevel('error');
      logger.warn('warn message');
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('应该输出 error 日志', () => {
      logger.error('error message', new Error('test error'));
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] error message', expect.any(Error));
    });

    it('任何级别都应该输出 error 日志', () => {
      logger.setLevel('error');
      logger.error('error message');
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });
});
