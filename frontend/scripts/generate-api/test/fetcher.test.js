import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 由于是CommonJS模块，需要动态导入
const { fetchOpenAPI } = await import('../lib/fetcher.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('OpenAPI获取模块', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchOpenAPI', () => {
    it('应该从本地JSON文件获取OpenAPI文档', async () => {
      const testJsonPath = path.join(__dirname, 'fixtures', 'openapi.json');
      
      // 创建测试fixture
      const testData = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {}
      };
      
      // 确保fixture目录存在
      const fixtureDir = path.dirname(testJsonPath);
      if (!fs.existsSync(fixtureDir)) {
        fs.mkdirSync(fixtureDir, { recursive: true });
      }
      fs.writeFileSync(testJsonPath, JSON.stringify(testData), 'utf8');
      
      try {
        const result = await fetchOpenAPI(testJsonPath);
        expect(result).toEqual(testData);
      } finally {
        // 清理
        fs.unlinkSync(testJsonPath);
      }
    });

    it('应该处理不存在的文件', async () => {
      const nonExistentPath = path.join(__dirname, 'fixtures', 'non-existent.json');
      
      await expect(fetchOpenAPI(nonExistentPath)).rejects.toThrow('文件不存在');
    });

    it('应该处理无效的JSON文件', async () => {
      const invalidJsonPath = path.join(__dirname, 'fixtures', 'invalid.json');
      
      // 创建无效JSON文件
      fs.writeFileSync(invalidJsonPath, 'invalid json', 'utf8');
      
      try {
        await expect(fetchOpenAPI(invalidJsonPath)).rejects.toThrow('解析文件失败');
      } finally {
        fs.unlinkSync(invalidJsonPath);
      }
    });
  });

  describe('缓存功能', () => {
    it('应该使用缓存文件', async () => {
      const cacheFile = path.join(__dirname, 'fixtures', '.openapi-cache.json');
      const testData = {
        timestamp: Date.now() - 1800000, // 30分钟前
        data: { openapi: '3.0.0', info: { title: 'Cached', version: '1.0.0' } },
        source: 'test'
      };
      
      fs.writeFileSync(cacheFile, JSON.stringify(testData), 'utf8');
      
      try {
        const result = await fetchOpenAPI('test', { cache: true, cacheFile });
        expect(result).toEqual(testData.data);
      } finally {
        fs.unlinkSync(cacheFile);
      }
    });

    it('应该跳过过期的缓存', async () => {
      const cacheFile = path.join(__dirname, 'fixtures', '.openapi-cache.json');
      const testData = {
        timestamp: Date.now() - 7200000, // 2小时前
        data: { openapi: '3.0.0', info: { title: 'Expired', version: '1.0.0' } },
        source: 'test'
      };
      
      fs.writeFileSync(cacheFile, JSON.stringify(testData), 'utf8');
      
      // 模拟URL请求会失败，但我们只测试缓存逻辑
      try {
        await expect(fetchOpenAPI('http://invalid-url', { cache: true, cacheFile })).rejects.toThrow();
      } finally {
        fs.unlinkSync(cacheFile);
      }
    });
  });
});