/**
 * openapi-client.js OpenAPI客户端模块单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试数据路径
const TEST_DATA_PATH = path.join(__dirname, '..', 'test-data', 'openapi-doc.json');

describe('openapi-client.js - OpenAPI客户端模块', () => {
  let parseOpenAPIDocument;
  let parseSchema;
  let getComponentSchema;
  let parseAllSchemas;
  let fetchOpenAPIDocument;
  let testDoc;

  beforeAll(async () => {
    // 导入模块
    const module = await import('../openapi-client.js');
    parseOpenAPIDocument = module.parseOpenAPIDocument;
    parseSchema = module.parseSchema;
    getComponentSchema = module.getComponentSchema;
    parseAllSchemas = module.parseAllSchemas;
    fetchOpenAPIDocument = module.fetchOpenAPIDocument;

    // 加载测试数据
    const docContent = fs.readFileSync(TEST_DATA_PATH, 'utf-8');
    testDoc = JSON.parse(docContent);
  });

  describe('parseOpenAPIDocument', () => {
    it('应该成功解析有效的 OpenAPI 文档', () => {
      const parsed = parseOpenAPIDocument(testDoc);

      expect(parsed).toBeDefined();
      expect(parsed.openapi).toBe('3.0.1');
      expect(parsed.info).toBeDefined();
      expect(parsed.info.title).toBe('watchtogether-backend API 文档');
      expect(parsed.servers).toBeDefined();
      expect(parsed.servers.length).toBeGreaterThan(0);
      expect(parsed.paths).toBeDefined();
      expect(parsed.components).toBeDefined();
    });

    it('应该提取 basePath', () => {
      const parsed = parseOpenAPIDocument(testDoc);

      // 从 server URL 中提取路径
      expect(parsed.basePath).toBeDefined();
    });

    it('应该解析所有 paths', () => {
      const parsed = parseOpenAPIDocument(testDoc);

      expect(Object.keys(parsed.paths).length).toBeGreaterThan(0);
      expect(parsed.paths['/api/health']).toBeDefined();
      expect(parsed.paths['/api/sessions']).toBeDefined();
      expect(parsed.paths['/api/rooms']).toBeDefined();
      expect(parsed.paths['/api/emojis/user']).toBeDefined();
      expect(parsed.paths['/api/files/upload']).toBeDefined();
    });

    it('应该解析 path 中的 operations', () => {
      const parsed = parseOpenAPIDocument(testDoc);

      const healthPath = parsed.paths['/api/health'];
      expect(healthPath.get).toBeDefined();
      expect(healthPath.get.operationId).toBe('healthCheck');
      expect(healthPath.get.summary).toBe('系统健康检查');
    });

    it('应该解析 parameters', () => {
      const parsed = parseOpenAPIDocument(testDoc);

      const sessionPath = parsed.paths['/api/sessions/{sessionId}'];
      expect(sessionPath.get).toBeDefined();
      expect(sessionPath.get.parameters).toBeDefined();
      expect(sessionPath.get.parameters.length).toBeGreaterThan(0);

      const sessionIdParam = sessionPath.get.parameters.find(p => p.name === 'sessionId');
      expect(sessionIdParam).toBeDefined();
      expect(sessionIdParam.in).toBe('path');
      expect(sessionIdParam.required).toBe(true);
    });

    it('应该解析 requestBody', () => {
      const parsed = parseOpenAPIDocument(testDoc);

      const sessionsPath = parsed.paths['/api/sessions'];
      expect(sessionsPath.post).toBeDefined();
      expect(sessionsPath.post.requestBody).toBeDefined();
      expect(sessionsPath.post.requestBody.required).toBe(true);
      expect(sessionsPath.post.requestBody.content).toBeDefined();
    });

    it('应该解析 responses', () => {
      const parsed = parseOpenAPIDocument(testDoc);

      const healthPath = parsed.paths['/api/health'];
      expect(healthPath.get.responses).toBeDefined();
      expect(healthPath.get.responses['200']).toBeDefined();
    });

    it('应该拒绝不支持的 OpenAPI 版本', () => {
      const invalidDoc = {
        openapi: '2.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {}
      };

      expect(() => parseOpenAPIDocument(invalidDoc)).toThrow('不支持的 OpenAPI 版本');
    });

    it('应该拒绝缺少 openapi 字段的文档', () => {
      const invalidDoc = {
        info: { title: 'Test', version: '1.0.0' },
        paths: {}
      };

      expect(() => parseOpenAPIDocument(invalidDoc)).toThrow('缺少 openapi 字段');
    });
  });

  describe('parseSchema', () => {
    it('应该返回 null 对于空 schema', () => {
      expect(parseSchema(null)).toBeNull();
      expect(parseSchema(undefined)).toBeNull();
    });

    it('应该解析基本类型 schema', () => {
      const schema = {
        type: 'string',
        description: 'A string field'
      };

      const parsed = parseSchema(schema);

      expect(parsed.type).toBe('string');
      expect(parsed.description).toBe('A string field');
    });

    it('应该解析带格式的 schema', () => {
      const schema = {
        type: 'string',
        format: 'email'
      };

      const parsed = parseSchema(schema);

      expect(parsed.type).toBe('string');
      expect(parsed.format).toBe('email');
    });

    it('应该解析枚举 schema', () => {
      const schema = {
        type: 'string',
        enum: ['ACTIVE', 'INACTIVE', 'PENDING']
      };

      const parsed = parseSchema(schema);

      expect(parsed.enum).toEqual(['ACTIVE', 'INACTIVE', 'PENDING']);
    });

    it('应该解析数组 schema', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'string'
        }
      };

      const parsed = parseSchema(schema);

      expect(parsed.type).toBe('array');
      expect(parsed.items).toBeDefined();
      expect(parsed.items.type).toBe('string');
    });

    it('应该解析对象 schema', () => {
      const schema = {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' }
        },
        required: ['id']
      };

      const parsed = parseSchema(schema);

      expect(parsed.type).toBe('object');
      expect(parsed.properties).toBeDefined();
      expect(parsed.properties.id.type).toBe('integer');
      expect(parsed.properties.name.type).toBe('string');
      expect(parsed.required).toEqual(['id']);
    });

    it('应该解析 $ref 引用', () => {
      const schema = {
        $ref: '#/components/schemas/User'
      };

      const parsed = parseSchema(schema);

      expect(parsed.$ref).toBe('#/components/schemas/User');
      expect(parsed.refName).toBe('User');
    });

    it('应该解析 allOf 组合', () => {
      const schema = {
        allOf: [
          { $ref: '#/components/schemas/BaseEntity' },
          {
            type: 'object',
            properties: {
              name: { type: 'string' }
            }
          }
        ]
      };

      const parsed = parseSchema(schema);

      expect(parsed.allOf).toBeDefined();
      expect(parsed.allOf.length).toBe(2);
    });

    it('应该解析 oneOf 组合', () => {
      const schema = {
        oneOf: [
          { type: 'string' },
          { type: 'number' }
        ]
      };

      const parsed = parseSchema(schema);

      expect(parsed.oneOf).toBeDefined();
      expect(parsed.oneOf.length).toBe(2);
    });

    it('应该解析字符串约束', () => {
      const schema = {
        type: 'string',
        minLength: 3,
        maxLength: 50,
        pattern: '^[a-zA-Z]+$'
      };

      const parsed = parseSchema(schema);

      expect(parsed.minLength).toBe(3);
      expect(parsed.maxLength).toBe(50);
      expect(parsed.pattern).toBe('^[a-zA-Z]+$');
    });

    it('应该解析数字约束', () => {
      const schema = {
        type: 'integer',
        minimum: 0,
        maximum: 100
      };

      const parsed = parseSchema(schema);

      expect(parsed.minimum).toBe(0);
      expect(parsed.maximum).toBe(100);
    });
  });

  describe('getComponentSchema', () => {
    it('应该获取存在的组件 schema', () => {
      const schema = getComponentSchema(testDoc, 'SessionResp');

      expect(schema).toBeDefined();
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
    });

    it('应该返回 null 对于不存在的组件', () => {
      const schema = getComponentSchema(testDoc, 'NonExistent');

      expect(schema).toBeNull();
    });

    it('应该返回 null 对于没有 components 的文档', () => {
      const docWithoutComponents = {
        openapi: '3.0.1',
        info: { title: 'Test', version: '1.0.0' },
        paths: {}
      };

      const schema = getComponentSchema(docWithoutComponents, 'User');

      expect(schema).toBeNull();
    });
  });

  describe('parseAllSchemas', () => {
    it('应该解析所有组件 schemas', () => {
      const schemas = parseAllSchemas(testDoc);

      expect(schemas).toBeDefined();
      expect(Object.keys(schemas).length).toBeGreaterThan(0);

      // 检查一些关键 schema 是否存在
      expect(schemas['SessionResp']).toBeDefined();
      expect(schemas['RoomResp']).toBeDefined();
      expect(schemas['ApiRespSessionResp']).toBeDefined();
    });

    it('应该返回空对象对于没有 schemas 的文档', () => {
      const docWithoutSchemas = {
        openapi: '3.0.1',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        components: {}
      };

      const schemas = parseAllSchemas(docWithoutSchemas);

      expect(schemas).toEqual({});
    });
  });

  describe('fetchOpenAPIDocument', () => {
    it('应该在获取失败时抛出错误', async () => {
      // 测试无效 URL
      await expect(fetchOpenAPIDocument('http://invalid-url-that-does-not-exist.com/api-docs'))
        .rejects.toThrow();
    });

    it('应该在 HTTP 错误时抛出错误', async () => {
      // 使用不存在的本地地址
      await expect(fetchOpenAPIDocument('http://localhost:99999/api-docs'))
        .rejects.toThrow();
    });
  });

  describe('路径解析', () => {
    it('应该解析带路径参数的路径', () => {
      const parsed = parseOpenAPIDocument(testDoc);

      const userPath = parsed.paths['/api/sessions/{sessionId}'];
      expect(userPath).toBeDefined();
      expect(userPath.get).toBeDefined();
      expect(userPath.get.parameters).toBeDefined();

      const sessionIdParam = userPath.get.parameters.find(p => p.name === 'sessionId');
      expect(sessionIdParam).toBeDefined();
      expect(sessionIdParam.in).toBe('path');
    });

    it('应该解析多个 HTTP 方法', () => {
      const parsed = parseOpenAPIDocument(testDoc);

      const roomPath = parsed.paths['/api/rooms'];
      expect(roomPath.get).toBeDefined();
      expect(roomPath.post).toBeDefined();
    });
  });

  describe('标签解析', () => {
    it('应该解析操作的 tags', () => {
      const parsed = parseOpenAPIDocument(testDoc);

      const healthPath = parsed.paths['/api/health'];
      expect(healthPath.get.tags).toBeDefined();
      expect(healthPath.get.tags).toContain('健康检查');
    });
  });
});
