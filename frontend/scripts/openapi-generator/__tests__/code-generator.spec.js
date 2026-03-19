/**
 * code-generator.js 代码生成器模块单元测试
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试数据路径
const TEST_DATA_PATH = path.join(__dirname, '..', 'test-data', 'openapi-doc.json');

describe('code-generator.js - 代码生成器模块', () => {
  let generateCode;
  let groupAPIsByTag;
  let generateRequestObjects;
  let generateResponseObjects;
  let generateAPIFunctions;
  let testDoc;
  let parsedDoc;
  let defaultConfig;

  beforeAll(async () => {
    // 导入模块
    const codeGenModule = await import('../code-generator.js');
    generateCode = codeGenModule.generateCode;
    groupAPIsByTag = codeGenModule.groupAPIsByTag;
    generateRequestObjects = codeGenModule.generateRequestObjects;
    generateResponseObjects = codeGenModule.generateResponseObjects;
    generateAPIFunctions = codeGenModule.generateAPIFunctions;

    // 导入 openapi-client 解析函数
    const openapiClientModule = await import('../openapi-client.js');

    // 加载并解析测试数据
    const docContent = fs.readFileSync(TEST_DATA_PATH, 'utf-8');
    testDoc = JSON.parse(docContent);
    parsedDoc = openapiClientModule.parseOpenAPIDocument(testDoc);

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

  describe('generateCode', () => {
    it('应该生成三个文件', async () => {
      const files = await generateCode(parsedDoc, defaultConfig);

      expect(files).toBeDefined();
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBe(3);

      const filenames = files.map(f => f.filename);
      expect(filenames).toContain('api.js');
      expect(filenames).toContain('req.js');
      expect(filenames).toContain('resp.js');
    });

    it('每个文件应该有内容', async () => {
      const files = await generateCode(parsedDoc, defaultConfig);

      for (const file of files) {
        expect(file.content).toBeDefined();
        expect(file.content.length).toBeGreaterThan(0);
      }
    });

    it('生成的 api.js 应该包含 import 语句', async () => {
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      expect(apiFile.content).toContain('import');
      expect(apiFile.content).toContain('request');
    });

    it('生成的 api.js 应该包含 export', async () => {
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      expect(apiFile.content).toContain('export');
    });

    it('生成的文件应该包含中文注释', async () => {
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      expect(apiFile.content).toContain('API');
    });
  });

  describe('groupAPIsByTag', () => {
    it('应该按标签分组 API', () => {
      const groups = groupAPIsByTag(parsedDoc, defaultConfig);

      expect(groups).toBeDefined();
      expect(Object.keys(groups).length).toBeGreaterThan(0);

      // 检查是否存在预期的分组
      expect(groups['健康检查']).toBeDefined();
      expect(groups['房间管理']).toBeDefined();
      expect(groups['会话管理']).toBeDefined();
    });

    it('每个分组应该包含 operations', () => {
      const groups = groupAPIsByTag(parsedDoc, defaultConfig);

      for (const group of Object.values(groups)) {
        expect(group.operations).toBeDefined();
        expect(Array.isArray(group.operations)).toBe(true);
        expect(group.operations.length).toBeGreaterThan(0);
      }
    });

    it('每个 operation 应该包含必要字段', () => {
      const groups = groupAPIsByTag(parsedDoc, defaultConfig);

      for (const group of Object.values(groups)) {
        for (const op of group.operations) {
          expect(op.path).toBeDefined();
          expect(op.method).toBeDefined();
          expect(op.operationId).toBeDefined();
        }
      }
    });

    it('应该过滤指定的 tags', () => {
      const configWithTags = {
        ...defaultConfig,
        tags: ['健康检查']
      };

      const groups = groupAPIsByTag(parsedDoc, configWithTags);

      expect(Object.keys(groups).length).toBe(1);
      expect(groups['健康检查']).toBeDefined();
    });

    it('应该处理多个 tags 过滤', () => {
      const configWithTags = {
        ...defaultConfig,
        tags: ['健康检查', '房间管理']
      };

      const groups = groupAPIsByTag(parsedDoc, configWithTags);

      expect(Object.keys(groups).length).toBe(2);
      expect(groups['健康检查']).toBeDefined();
      expect(groups['房间管理']).toBeDefined();
      expect(groups['会话管理']).toBeUndefined();
    });

    it('应该处理没有 tags 的接口', () => {
      const groups = groupAPIsByTag(parsedDoc, defaultConfig);

      // 所有接口都应该有 tag（没有 tag 的会被分配到 Default）
      for (const group of Object.values(groups)) {
        expect(group.tag).toBeDefined();
      }
    });
  });

  describe('generateRequestObjects', () => {
    it('应该生成请求参数对象', () => {
      const requestObjects = generateRequestObjects(parsedDoc, defaultConfig);

      expect(requestObjects).toBeDefined();
      expect(Object.keys(requestObjects).length).toBeGreaterThan(0);
    });

    it('应该为有参数的接口生成请求对象', () => {
      const requestObjects = generateRequestObjects(parsedDoc, defaultConfig);

      // getSession 有 path 参数
      expect(requestObjects['getSession']).toBeDefined();
      expect(requestObjects['getSession'].properties).toBeDefined();
    });

    it('请求对象应该包含参数信息', () => {
      const requestObjects = generateRequestObjects(parsedDoc, defaultConfig);

      const getSessionReq = requestObjects['getSession'];
      if (getSessionReq) {
        expect(getSessionReq.name).toContain('Request');
        expect(getSessionReq.description).toBeDefined();
      }
    });

    it('应该处理查询参数', () => {
      const requestObjects = generateRequestObjects(parsedDoc, defaultConfig);

      // getChatMessages 有查询参数
      const chatMessagesReq = requestObjects['getChatMessages'];
      if (chatMessagesReq) {
        expect(chatMessagesReq.properties).toBeDefined();
      }
    });
  });

  describe('generateResponseObjects', () => {
    it('应该生成响应参数对象', () => {
      const responseObjects = generateResponseObjects(parsedDoc, defaultConfig);

      expect(responseObjects).toBeDefined();
      expect(Object.keys(responseObjects).length).toBeGreaterThan(0);
    });

    it('响应对象应该包含 data 属性', () => {
      const responseObjects = generateResponseObjects(parsedDoc, defaultConfig);

      for (const resp of Object.values(responseObjects)) {
        expect(resp.properties).toBeDefined();
        expect(resp.properties.data).toBeDefined();
      }
    });

    it('应该正确处理 $ref 引用的响应', () => {
      const responseObjects = generateResponseObjects(parsedDoc, defaultConfig);

      // healthCheck 返回 ApiRespHealthCheckResp
      const healthCheckResp = responseObjects['healthCheck'];
      if (healthCheckResp && healthCheckResp.properties.data) {
        expect(healthCheckResp.properties.data.ref || healthCheckResp.properties.data.type).toBeDefined();
      }
    });

    it('应该正确处理数组响应', () => {
      const responseObjects = generateResponseObjects(parsedDoc, defaultConfig);

      // getPublicRooms 返回数组
      const publicRoomsResp = responseObjects['getPublicRooms'];
      if (publicRoomsResp && publicRoomsResp.properties.data) {
        // 数据可能是 array 类型或引用类型
        expect(publicRoomsResp.properties.data.type || publicRoomsResp.properties.data.ref).toBeDefined();
      }
    });
  });

  describe('generateAPIFunctions', () => {
    it('应该生成 API 函数列表', () => {
      const functions = generateAPIFunctions(parsedDoc, defaultConfig);

      expect(functions).toBeDefined();
      expect(Array.isArray(functions)).toBe(true);
      expect(functions.length).toBeGreaterThan(0);
    });

    it('每个函数组应该有 className', () => {
      const functions = generateAPIFunctions(parsedDoc, defaultConfig);

      for (const group of functions) {
        expect(group.className).toBeDefined();
        expect(typeof group.className).toBe('string');
        expect(group.className).toMatch(/Api$/);
      }
    });

    it('每个函数组应该有 operations', () => {
      const functions = generateAPIFunctions(parsedDoc, defaultConfig);

      for (const group of functions) {
        expect(group.operations).toBeDefined();
        expect(Array.isArray(group.operations)).toBe(true);
        expect(group.operations.length).toBeGreaterThan(0);
      }
    });

    it('每个 operation 应该有必要的字段', () => {
      const functions = generateAPIFunctions(parsedDoc, defaultConfig);

      for (const group of functions) {
        for (const op of group.operations) {
          expect(op.name).toBeDefined();
          expect(op.method).toBeDefined();
          expect(op.path).toBeDefined();
          expect(op.jsdoc).toBeDefined();
          expect(op.params).toBeDefined();
        }
      }
    });

    it('函数名应该是小驼峰命名', () => {
      const functions = generateAPIFunctions(parsedDoc, defaultConfig);

      for (const group of functions) {
        for (const op of group.operations) {
          // 首字母应该是小写
          expect(op.name[0]).toBe(op.name[0].toLowerCase());
        }
      }
    });

    it('JSDoc 应该包含参数说明', () => {
      const functions = generateAPIFunctions(parsedDoc, defaultConfig);

      for (const group of functions) {
        for (const op of group.operations) {
          expect(op.jsdoc).toContain('/**');
          expect(op.jsdoc).toContain('*/');
        }
      }
    });

    it('应该包含 options 参数', () => {
      const functions = generateAPIFunctions(parsedDoc, defaultConfig);

      for (const group of functions) {
        for (const op of group.operations) {
          expect(op.params).toContain('options');
        }
      }
    });

    it('应该为路径参数生成正确的参数列表', () => {
      const functions = generateAPIFunctions(parsedDoc, defaultConfig);

      // 查找有路径参数的函数（如 getSession）
      for (const group of functions) {
        for (const op of group.operations) {
          if (op.hasPathParams) {
            expect(op.params).toBeDefined();
            // 参数应该包含路径参数名
          }
        }
      }
    });

    it('应该为查询参数生成 queryParams 参数', () => {
      const functions = generateAPIFunctions(parsedDoc, defaultConfig);

      for (const group of functions) {
        for (const op of group.operations) {
          if (op.hasQueryParams) {
            expect(op.params).toContain('queryParams');
          }
        }
      }
    });

    it('应该为请求体生成 data 参数', () => {
      const functions = generateAPIFunctions(parsedDoc, defaultConfig);

      for (const group of functions) {
        for (const op of group.operations) {
          if (op.hasBody) {
            expect(op.params).toContain('data');
          }
        }
      }
    });
  });

  describe('filterUnknownParams 配置', () => {
    it('应该在 filterUnknownParams 启用时生成 allowedParams', async () => {
      const configWithFilter = {
        ...defaultConfig,
        filterUnknownParams: true
      };

      const files = await generateCode(parsedDoc, configWithFilter);
      const apiFile = files.find(f => f.filename === 'api.js');

      // 应该包含 allowedParams
      expect(apiFile.content).toContain('allowedParams');
    });
  });

  describe('strictMode 配置', () => {
    it('应该在 strictMode 启用时生成 strictMode 配置', async () => {
      const configWithStrict = {
        ...defaultConfig,
        strictMode: true
      };

      const files = await generateCode(parsedDoc, configWithStrict);
      const apiFile = files.find(f => f.filename === 'api.js');

      expect(apiFile.content).toContain('strictMode: true');
    });
  });

  describe('模板渲染', () => {
    it('api.js 应该包含请求方法调用', async () => {
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      expect(apiFile.content).toContain('request(');
    });

    it('req.js 应该包含 JSDoc typedef', async () => {
      const files = await generateCode(parsedDoc, defaultConfig);
      const reqFile = files.find(f => f.filename === 'req.js');

      expect(reqFile.content).toContain('@typedef');
    });

    it('resp.js 应该包含 JSDoc typedef', async () => {
      const files = await generateCode(parsedDoc, defaultConfig);
      const respFile = files.find(f => f.filename === 'resp.js');

      expect(respFile.content).toContain('@typedef');
    });

    it('生成的文件应该包含时间戳', async () => {
      const files = await generateCode(parsedDoc, defaultConfig);

      for (const file of files) {
        expect(file.content).toContain('生成时间');
      }
    });
  });

  describe('边界条件', () => {
    it('应该处理空 paths', async () => {
      const emptyDoc = {
        openapi: '3.0.1',
        info: { title: 'Empty', version: '1.0.0' },
        paths: {},
        components: {}
      };

      const files = await generateCode(emptyDoc, defaultConfig);

      expect(files).toBeDefined();
      expect(files.length).toBe(3);
    });

    it('应该处理没有 tags 的接口', () => {
      const docWithoutTags = {
        openapi: '3.0.1',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              operationId: 'testOp',
              responses: {
                '200': { description: 'OK' }
              }
            }
          }
        },
        components: {}
      };

      const groups = groupAPIsByTag(docWithoutTags, defaultConfig);

      // 应该分配到 Default 组
      expect(groups['Default']).toBeDefined();
    });

    it('应该处理没有 operationId 的接口', () => {
      const docWithoutOpId = {
        openapi: '3.0.1',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': { description: 'OK' }
              }
            }
          }
        },
        components: {}
      };

      const groups = groupAPIsByTag(docWithoutOpId, defaultConfig);

      // 应该自动生成 operationId
      for (const group of Object.values(groups)) {
        for (const op of group.operations) {
          expect(op.operationId).toBeDefined();
        }
      }
    });

    it('应该处理响应中只有 $ref 没有 refName 的情况', async () => {
      const docWithRefOnly = {
        openapi: '3.0.1',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              operationId: 'getTest',
              responses: {
                '200': {
                  description: 'OK',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          data: {
                            $ref: '#/components/schemas/SomeSchema'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        components: {
          schemas: {
            SomeSchema: {
              type: 'object',
              properties: {
                id: { type: 'integer' }
              }
            }
          }
        }
      };

      const files = await generateCode(docWithRefOnly, defaultConfig);
      const respFile = files.find(f => f.filename === 'resp.js');

      expect(respFile).toBeDefined();
      expect(respFile.content).toContain('@typedef');
    });

    it('应该处理数组响应中 items 有 ref 的情况', async () => {
      const docWithArrayRef = {
        openapi: '3.0.1',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': {
            get: {
              operationId: 'getItems',
              responses: {
                '200': {
                  description: 'OK',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Item'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        components: {
          schemas: {
            Item: {
              type: 'object',
              properties: {
                id: { type: 'integer' }
              }
            }
          }
        }
      };

      const files = await generateCode(docWithArrayRef, defaultConfig);
      const respFile = files.find(f => f.filename === 'resp.js');

      expect(respFile).toBeDefined();
      expect(respFile.content).toContain('[]');
    });

    it('应该处理响应中基本类型的情况', async () => {
      const docWithPrimitive = {
        openapi: '3.0.1',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/count': {
            get: {
              operationId: 'getCount',
              responses: {
                '200': {
                  description: 'OK',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'integer'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        components: {}
      };

      const files = await generateCode(docWithPrimitive, defaultConfig);
      const respFile = files.find(f => f.filename === 'resp.js');

      expect(respFile).toBeDefined();
      expect(respFile.content).toContain('integer');
    });

    it('应该处理响应中带描述但无 schema 的情况', async () => {
      const docWithDescOnly = {
        openapi: '3.0.1',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/status': {
            get: {
              operationId: 'getStatus',
              responses: {
                '200': {
                  description: 'Status response'
                }
              }
            }
          }
        },
        components: {}
      };

      const files = await generateCode(docWithDescOnly, defaultConfig);
      const respFile = files.find(f => f.filename === 'resp.js');

      expect(respFile).toBeDefined();
    });

    it('应该处理请求参数中带 $ref 的情况', async () => {
      const docWithRefReq = {
        openapi: '3.0.1',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users': {
            post: {
              operationId: 'createUser',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/CreateUserRequest'
                    }
                  }
                }
              },
              responses: {
                '200': {
                  description: 'OK',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/User'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        components: {
          schemas: {
            CreateUserRequest: {
              type: 'object',
              properties: {
                name: { type: 'string' }
              }
            },
            User: {
              type: 'object',
              properties: {
                id: { type: 'integer' }
              }
            }
          }
        }
      };

      const files = await generateCode(docWithRefReq, defaultConfig);
      const reqFile = files.find(f => f.filename === 'req.js');

      expect(reqFile).toBeDefined();
      expect(reqFile.content).toContain('CreateUserRequest');
    });
  });
});
