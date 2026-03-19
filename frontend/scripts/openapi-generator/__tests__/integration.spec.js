/**
 * integration.spec.js 集成测试
 * 测试完整的代码生成流程
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试数据路径
const TEST_DATA_PATH = path.join(__dirname, '..', 'test-data', 'openapi-doc.json');

describe('集成测试 - 完整生成流程', () => {
  let parseOpenAPIDocument;
  let generateCode;
  let testDoc;
  let defaultConfig;

  beforeAll(async () => {
    // 导入模块
    const openapiClientModule = await import('../openapi-client.js');
    const codeGenModule = await import('../code-generator.js');

    parseOpenAPIDocument = openapiClientModule.parseOpenAPIDocument;
    generateCode = codeGenModule.generateCode;

    // 加载测试数据
    const docContent = fs.readFileSync(TEST_DATA_PATH, 'utf-8');
    testDoc = JSON.parse(docContent);

    // 默认配置
    defaultConfig = {
      openapiUrl: 'http://localhost:18080/api-docs',
      outputDir: '../../src/services',
      utilsDir: '../../src/utils',
      apiFileName: 'api.js',
      reqFileName: 'req.js',
      respFileName: 'resp.js',
      requestFileName: 'request.js',
      basePath: '',
      tags: [],
      filterUnknownParams: false,
      strictMode: false,
      initRequestFile: true
    };
  });

  describe('端到端生成流程', () => {
    it('应该完成从 OpenAPI 文档到代码文件的完整流程', async () => {
      // 1. 解析文档
      const parsedDoc = parseOpenAPIDocument(testDoc);
      expect(parsedDoc).toBeDefined();
      expect(parsedDoc.openapi).toBe('3.0.1');

      // 2. 生成代码
      const files = await generateCode(parsedDoc, defaultConfig);
      expect(files).toBeDefined();
      expect(files.length).toBe(3);

      // 3. 验证生成的文件
      const apiFile = files.find(f => f.filename === 'api.js');
      const reqFile = files.find(f => f.filename === 'req.js');
      const respFile = files.find(f => f.filename === 'resp.js');

      expect(apiFile).toBeDefined();
      expect(reqFile).toBeDefined();
      expect(respFile).toBeDefined();

      // 4. 验证文件内容
      expect(apiFile.content.length).toBeGreaterThan(0);
      expect(reqFile.content.length).toBeGreaterThan(0);
      expect(respFile.content.length).toBeGreaterThan(0);
    });

    it('生成的 api.js 应该包含所有 API 分组', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      // 验证包含各个 API 分组（类名根据路径资源名生成）
      expect(apiFile.content).toContain('SessionsApi');
      expect(apiFile.content).toContain('RoomsApi');
      expect(apiFile.content).toContain('HealthsApi');
      expect(apiFile.content).toContain('EmojisApi');
      expect(apiFile.content).toContain('FilesApi');
    });

    it('生成的 api.js 应该包含主要的 API 函数', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      // 验证包含关键 API 函数
      expect(apiFile.content).toContain('healthCheck');
      expect(apiFile.content).toContain('createSession');
      expect(apiFile.content).toContain('getSession');
      expect(apiFile.content).toContain('createRoom');
      expect(apiFile.content).toContain('getPublicRooms');
    });

    it('生成的 req.js 应该包含请求参数定义', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const reqFile = files.find(f => f.filename === 'req.js');

      // 验证包含请求参数 typedef
      expect(reqFile.content).toContain('@typedef');
      expect(reqFile.content).toContain('Request');
    });

    it('生成的 resp.js 应该包含响应参数定义', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const respFile = files.find(f => f.filename === 'resp.js');

      // 验证包含响应参数 typedef
      expect(respFile.content).toContain('@typedef');
      expect(respFile.content).toContain('Response');
    });
  });

  describe('配置选项集成测试', () => {
    it('tags 过滤应该只生成指定分组的 API', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const configWithTags = {
        ...defaultConfig,
        tags: ['健康检查']
      };

      const files = await generateCode(parsedDoc, configWithTags);
      const apiFile = files.find(f => f.filename === 'api.js');

      // 健康检查 tag 对应的类名是 HealthsApi
      expect(apiFile.content).toContain('HealthsApi');
      expect(apiFile.content).toContain('healthCheck');
      expect(apiFile.content).not.toContain('createSession');
    });

    it('filterUnknownParams 应该在生成的代码中添加 allowedParams', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const configWithFilter = {
        ...defaultConfig,
        filterUnknownParams: true
      };

      const files = await generateCode(parsedDoc, configWithFilter);
      const apiFile = files.find(f => f.filename === 'api.js');

      expect(apiFile.content).toContain('allowedParams');
    });

    it('strictMode 应该在生成的代码中添加 strictMode 配置', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const configWithStrict = {
        ...defaultConfig,
        strictMode: true
      };

      const files = await generateCode(parsedDoc, configWithStrict);
      const apiFile = files.find(f => f.filename === 'api.js');

      expect(apiFile.content).toContain('strictMode: true');
    });

    it('应该同时启用 filterUnknownParams 和 strictMode', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const configWithBoth = {
        ...defaultConfig,
        filterUnknownParams: true,
        strictMode: true
      };

      const files = await generateCode(parsedDoc, configWithBoth);
      const apiFile = files.find(f => f.filename === 'api.js');

      expect(apiFile.content).toContain('allowedParams');
      expect(apiFile.content).toContain('strictMode: true');
    });
  });

  describe('多标签接口处理', () => {
    it('应该正确处理有多个标签的接口', async () => {
      // 创建一个有多个标签的测试文档
      const multiTagDoc = {
        openapi: '3.0.1',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/multi': {
            get: {
              operationId: 'multiTagOp',
              tags: ['Tag1', 'Tag2'],
              responses: {
                '200': { description: 'OK' }
              }
            }
          }
        },
        components: {}
      };

      const parsedDoc = parseOpenAPIDocument(multiTagDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      // 应该在两个标签组中都出现
      expect(apiFile.content).toContain('multiTagOp');
    });

    it('过滤标签时应该从所有分组中筛选', async () => {
      const multiTagDoc = {
        openapi: '3.0.1',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/api1': {
            get: {
              operationId: 'api1',
              tags: ['Common'],
              responses: { '200': { description: 'OK' } }
            }
          },
          '/api2': {
            get: {
              operationId: 'api2',
              tags: ['Other'],
              responses: { '200': { description: 'OK' } }
            }
          }
        },
        components: {}
      };

      const parsedDoc = parseOpenAPIDocument(multiTagDoc);
      const configWithTags = {
        ...defaultConfig,
        tags: ['Common']
      };

      const files = await generateCode(parsedDoc, configWithTags);
      const apiFile = files.find(f => f.filename === 'api.js');

      expect(apiFile.content).toContain('api1');
      expect(apiFile.content).not.toContain('api2');
    });
  });

  describe('请求方法生成', () => {
    it('应该为不同 HTTP 方法生成正确的请求', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      // 验证包含各种 HTTP 方法
      expect(apiFile.content).toContain("method: 'GET'");
      expect(apiFile.content).toContain("method: 'POST'");
      expect(apiFile.content).toContain("method: 'DELETE'");
    });

    it('应该正确处理路径参数', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      // 验证路径参数替换
      expect(apiFile.content).toContain('${sessionId}');
      expect(apiFile.content).toContain('${roomId}');
    });

    it('应该正确处理查询参数', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      // 验证查询参数
      expect(apiFile.content).toContain('queryParams');
      expect(apiFile.content).toContain('params: queryParams');
    });

    it('应该正确处理请求体', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      // 验证请求体
      expect(apiFile.content).toContain('data');
    });
  });

  describe('导入和导出', () => {
    it('api.js 应该导入 request 方法', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      expect(apiFile.content).toContain("import { request }");
      expect(apiFile.content).toContain('utils/request');
    });

    it('api.js 应该导出 API 对象', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      expect(apiFile.content).toContain('export const');
    });
  });
});
