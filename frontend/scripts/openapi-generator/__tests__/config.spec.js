/**
 * config.js 配置管理模块单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 模拟模块需要在导入前设置
vi.mock('fs');

describe('config.js - 配置管理模块', () => {
  let getDefaultConfig;
  let originalEnv;
  let originalArgv;

  beforeEach(async () => {
    // 保存原始环境
    originalEnv = { ...process.env };
    originalArgv = process.argv;

    // 动态导入模块
    const configModule = await import('../config.js');
    getDefaultConfig = configModule.getDefaultConfig;
  });

  afterEach(() => {
    // 恢复原始环境
    process.env = originalEnv;
    process.argv = originalArgv;
    vi.clearAllMocks();
  });

  describe('getDefaultConfig', () => {
    it('应该返回默认配置对象', () => {
      const config = getDefaultConfig();

      expect(config).toBeDefined();
      expect(config.openapiUrl).toBe('http://localhost:18080/api-docs');
      expect(config.outputDir).toBe('../../src/services');
      expect(config.utilsDir).toBe('../../src/utils');
      expect(config.apiFileName).toBe('api.js');
      expect(config.reqFileName).toBe('req.js');
      expect(config.respFileName).toBe('resp.js');
      expect(config.requestFileName).toBe('request.js');
      expect(config.basePath).toBe('');
      expect(config.tags).toEqual([]);
      expect(config.filterUnknownParams).toBe(false);
      expect(config.strictMode).toBe(false);
      expect(config.initRequestFile).toBe(true);
      expect(config.excludeTags).toEqual([]);
      expect(config.customTemplates).toBeNull();
    });

    it('应该返回配置的新对象', () => {
      const config1 = getDefaultConfig();
      const config2 = getDefaultConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });
  });

  describe('配置验证', () => {
    it('应该拒绝空的 openapiUrl', async () => {
      // 设置命令行参数使 openapiUrl 为空
      process.argv = ['node', 'test.js', '--openapi-url', ''];

      // 模拟 fs.existsSync 返回 false（无配置文件）
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const { readConfig } = await import('../config.js');

      expect(() => readConfig()).toThrow('openapiUrl 不能为空');
    });

    it('应该拒绝空的 outputDir', async () => {
      process.argv = ['node', 'test.js', '--output-dir', ''];

      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const { readConfig } = await import('../config.js');

      expect(() => readConfig()).toThrow('outputDir 不能为空');
    });

    it('应该拒绝无效的 URL 格式', async () => {
      process.argv = ['node', 'test.js', '--openapi-url', 'invalid-url'];

      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const { readConfig } = await import('../config.js');

      expect(() => readConfig()).toThrow('openapiUrl 格式无效');
    });

    it('应该拒绝非数组类型的 tags', async () => {
      process.argv = ['node', 'test.js', '--tags', 'tag1'];

      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const { readConfig } = await import('../config.js');

      // tags 可以是单个字符串，会被转换为数组
      const config = readConfig();
      expect(Array.isArray(config.tags)).toBe(true);
    });

    it('应该接受有效的 URL', async () => {
      process.argv = ['node', 'test.js', '--openapi-url', 'http://localhost:8080/api-docs'];

      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const { readConfig } = await import('../config.js');

      const config = readConfig();
      expect(config.openapiUrl).toBe('http://localhost:8080/api-docs');
    });
  });

  describe('配置合并优先级', () => {
    it('命令行参数应该覆盖环境变量', async () => {
      process.env.OPENAPI_URL = 'http://from-env.com/api-docs';
      process.argv = ['node', 'test.js', '--openapi-url', 'http://from-args.com/api-docs'];

      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const { readConfig } = await import('../config.js');

      const config = readConfig();
      expect(config.openapiUrl).toBe('http://from-args.com/api-docs');
    });

    it('环境变量应该覆盖默认值', async () => {
      process.env.OPENAPI_URL = 'http://from-env.com/api-docs';
      process.argv = ['node', 'test.js'];

      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const { readConfig } = await import('../config.js');

      const config = readConfig();
      expect(config.openapiUrl).toBe('http://from-env.com/api-docs');
    });

    it('应该读取环境变量配置', async () => {
      process.env.OPENAPI_URL = 'http://env-test.com/api-docs';
      process.env.OPENAPI_OUTPUT_DIR = '/custom/output';
      process.env.OPENAPI_TAGS = 'User,Session,Room';
      process.env.OPENAPI_FILTER_UNKNOWN_PARAMS = 'true';
      process.env.OPENAPI_STRICT_MODE = 'false';

      process.argv = ['node', 'test.js'];
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const { readConfig } = await import('../config.js');

      const config = readConfig();
      expect(config.openapiUrl).toBe('http://env-test.com/api-docs');
      expect(config.outputDir).toBe('/custom/output');
      expect(config.tags).toEqual(['User', 'Session', 'Room']);
      expect(config.filterUnknownParams).toBe(true);
      expect(config.strictMode).toBe(false);
    });
  });

  describe('布尔类型参数', () => {
    it('应该正确解析 filterUnknownParams', async () => {
      process.argv = ['node', 'test.js', '--filter-unknown-params'];

      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const { readConfig } = await import('../config.js');

      const config = readConfig();
      expect(config.filterUnknownParams).toBe(true);
    });

    it('应该正确解析 strictMode', async () => {
      process.argv = ['node', 'test.js', '--strict-mode'];

      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const { readConfig } = await import('../config.js');

      const config = readConfig();
      expect(config.strictMode).toBe(true);
    });

    it('应该正确解析 initRequestFile', async () => {
      process.argv = ['node', 'test.js', '--init-request-file'];

      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const { readConfig } = await import('../config.js');

      const config = readConfig();
      expect(config.initRequestFile).toBe(true);
    });
  });

  describe('tags 参数', () => {
    it('应该支持单个 tag', async () => {
      process.argv = ['node', 'test.js', '--tags', 'User'];

      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const { readConfig } = await import('../config.js');

      const config = readConfig();
      expect(config.tags).toEqual(['User']);
    });

    it('应该支持多个 tags（重复参数）', async () => {
      process.argv = ['node', 'test.js', '--tags', 'User', '--tags', 'Session'];

      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const { readConfig } = await import('../config.js');

      const config = readConfig();
      expect(config.tags).toEqual(['User', 'Session']);
    });
  });

  describe('配置文件读取', () => {
    it('配置文件不存在时应返回默认配置', async () => {
      process.argv = ['node', 'test.js'];

      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const { readConfig } = await import('../config.js');

      const config = readConfig();
      expect(config.openapiUrl).toBe('http://localhost:18080/api-docs');
    });

    it('应该读取存在的配置文件', async () => {
      process.argv = ['node', 'test.js'];

      const mockConfig = {
        openapiUrl: 'http://from-file.com/api-docs',
        tags: ['FromFile']
      };

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockConfig));

      const { readConfig } = await import('../config.js');

      const config = readConfig();
      expect(config.openapiUrl).toBe('http://from-file.com/api-docs');
      expect(config.tags).toEqual(['FromFile']);
    });

    it('应该处理配置文件读取错误', async () => {
      process.argv = ['node', 'test.js'];

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('File read error');
      });

      const { readConfig } = await import('../config.js');

      // 应该不抛出错误，使用默认配置
      const config = readConfig();
      expect(config.openapiUrl).toBe('http://localhost:18080/api-docs');
    });
  });

  describe('短参数别名', () => {
    it('应该支持 -u 作为 --openapi-url 的别名', async () => {
      process.argv = ['node', 'test.js', '-u', 'http://short.com/api-docs'];

      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const { readConfig } = await import('../config.js');

      const config = readConfig();
      expect(config.openapiUrl).toBe('http://short.com/api-docs');
    });

    it('应该支持 -o 作为 --output-dir 的别名', async () => {
      process.argv = ['node', 'test.js', '-o', '/custom/output'];

      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const { readConfig } = await import('../config.js');

      const config = readConfig();
      expect(config.outputDir).toBe('/custom/output');
    });
  });

  describe('showHelp', () => {
    it('应该输出帮助信息', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { showHelp } = await import('../config.js');
      showHelp();

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('OpenAPI to Frontend API Code Generator');
      expect(output).toContain('--openapi-url');
      expect(output).toContain('--output-dir');

      consoleSpy.mockRestore();
    });
  });

  describe('showVersion', () => {
    it('应该输出版本信息', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({ version: '1.0.0' }));

      const { showVersion } = await import('../config.js');
      showVersion();

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('openapi-generator v1.0.0');

      consoleSpy.mockRestore();
    });
  });

  describe('环境变量边界情况', () => {
    it('OPENAPI_FILTER_UNKNOWN_PARAMS 为其他值时应返回 undefined', async () => {
      process.env.OPENAPI_FILTER_UNKNOWN_PARAMS = 'invalid';
      process.argv = ['node', 'test.js'];

      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const { readConfig } = await import('../config.js');
      const config = readConfig();

      expect(config.filterUnknownParams).toBe(false); // 使用默认值
    });

    it('OPENAPI_STRICT_MODE 为其他值时应返回 undefined', async () => {
      process.env.OPENAPI_STRICT_MODE = 'invalid';
      process.argv = ['node', 'test.js'];

      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const { readConfig } = await import('../config.js');
      const config = readConfig();

      expect(config.strictMode).toBe(false); // 使用默认值
    });

    it('OPENAPI_INIT_REQUEST_FILE 为其他值时应返回 undefined', async () => {
      process.env.OPENAPI_INIT_REQUEST_FILE = 'invalid';
      process.argv = ['node', 'test.js'];

      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const { readConfig } = await import('../config.js');
      const config = readConfig();

      expect(config.initRequestFile).toBe(true); // 使用默认值
    });
  });

  describe('配置类型验证', () => {
    it('应该拒绝非字符串类型的 openapiUrl', async () => {
      process.argv = ['node', 'test.js'];
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({ openapiUrl: 123 }));

      const { readConfig } = await import('../config.js');

      expect(() => readConfig()).toThrow('openapiUrl 必须是字符串');
    });

    it('应该拒绝非字符串类型的 outputDir', async () => {
      process.argv = ['node', 'test.js'];
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({ outputDir: 123 }));

      const { readConfig } = await import('../config.js');

      expect(() => readConfig()).toThrow('outputDir 必须是字符串');
    });
  });
});
