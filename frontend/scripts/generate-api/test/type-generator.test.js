/**
 * TypeGenerator单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import OpenAPIParser from '../lib/parser.js';
import TypeGenerator from '../lib/type-generator.js';

// 模拟OpenAPI规范数据
const mockOpenAPI = {
  openapi: '3.0.0',
  info: {
    title: 'Test API',
    version: '1.0.0'
  },
  paths: {
    '/api/test': {
      get: {
        operationId: 'getTest',
        summary: 'Get test data',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1 }
          }
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        operationId: 'createTest',
        summary: 'Create test data',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  value: { type: 'number' }
                },
                required: ['name']
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' }
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
      TestModel: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          count: { type: 'integer' },
          active: { type: 'boolean' },
          tags: {
            type: 'array',
            items: { type: 'string' }
          },
          metadata: {
            type: 'object',
            properties: {
              key: { type: 'string' }
            }
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          code: { type: 'integer' },
          message: { type: 'string' }
        }
      }
    }
  },
  tags: [
    { name: 'test', description: 'Test operations' }
  ]
};

describe('TypeGenerator', () => {
  let parser;
  let typeGenerator;

  beforeEach(() => {
    parser = new OpenAPIParser(mockOpenAPI);
    typeGenerator = new TypeGenerator(parser, {
      generate: {
        typescript: true,
        jsdocLevel: 'detailed'
      }
    });
  });

  it('应该正确初始化', () => {
    expect(typeGenerator).toBeDefined();
    expect(typeGenerator.parser).toBe(parser);
    expect(typeGenerator.config.generate.typescript).toBe(true);
  });

  it('应该生成模型类型定义', () => {
    const types = typeGenerator.generateTypes();
    expect(types.models).toBeDefined();
    expect(types.models.length).toBe(2);
    
    const testModel = types.models.find(m => m.name === 'TestModel');
    expect(testModel).toBeDefined();
    expect(testModel.interface).toContain('interface TestModel');
    expect(testModel.interface).toContain('id?: string');
    expect(testModel.interface).toContain('tags?: Array<string>');
  });

  it('应该生成请求参数类型', () => {
    const types = typeGenerator.generateTypes();
    expect(types.requestTypes).toBeDefined();
    expect(types.requestTypes.length).toBe(2);
    
    const getRequest = types.requestTypes.find(t => t.name === 'GettestRequest');
    expect(getRequest).toBeDefined();
    expect(getRequest.type).toContain('type GettestRequest');
    expect(getRequest.type).toContain('pathParams');
    expect(getRequest.type).toContain('queryParams');
    
    const postRequest = types.requestTypes.find(t => t.name === 'CreatetestRequest');
    expect(postRequest).toBeDefined();
    expect(postRequest.type).toContain('type CreatetestRequest');
    expect(postRequest.type).toContain('name: string');
  });

  it('应该生成响应类型', () => {
    const types = typeGenerator.generateTypes();
    expect(types.responseTypes).toBeDefined();
    expect(types.responseTypes.length).toBe(2);
    
    const getResponse = types.responseTypes.find(t => t.name === 'GettestResponse');
    expect(getResponse).toBeDefined();
    expect(getResponse.type).toContain('type GettestResponse');
    
    const postResponse = types.responseTypes.find(t => t.name === 'CreatetestResponse');
    expect(postResponse).toBeDefined();
    expect(postResponse.type).toContain('type CreatetestResponse');
  });

  it('应该生成API函数类型', () => {
    const types = typeGenerator.generateTypes();
    expect(types.apiFunctionTypes).toBeDefined();
    expect(types.apiFunctionTypes.length).toBe(1);
    
    const apiModule = types.apiFunctionTypes[0];
    expect(apiModule.module).toBe('Test');
    expect(apiModule.interface).toContain('interface TestApi');
    expect(apiModule.interface).toContain('getTest');
    expect(apiModule.interface).toContain('createTest');
  });

  it('应该生成完整的类型定义文件', () => {
    const types = typeGenerator.generateTypes();
    expect(types.typeDefinitionFile).toBeDefined();
    expect(typeof types.typeDefinitionFile).toBe('string');
    expect(types.typeDefinitionFile.length).toBeGreaterThan(0);
    
    const content = types.typeDefinitionFile;
    expect(content).toContain('// ============================================');
    expect(content).toContain('interface TestModel');
    expect(content).toContain('type GettestRequest');
    expect(content).toContain('interface TestApi');
  });

  it('应该处理枚举类型', () => {
    // 测试枚举类型生成
    const enumSchema = {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'inactive', 'pending']
        }
      }
    };
    
    const mockParser = {
      getModels: () => ({
        ModelWithEnum: {
          name: 'ModelWithEnum',
          schema: enumSchema,
          properties: {
            status: {
              type: 'string',
              description: 'Status',
              required: true,
              example: 'active',
              enum: ['active', 'inactive', 'pending']
            }
          },
          required: ['status']
        }
      }),
      getAllEndpoints: () => [],
      getEndpointsByTag: () => ({}),
      info: { title: 'Test', version: '1.0.0' },
      tags: []
    };
    
    const tg = new TypeGenerator(mockParser);
    const types = tg.generateTypes();
    
    expect(types.enumTypes).toBeDefined();
    // 应该生成枚举类型定义
    expect(types.enumTypes.length).toBe(1);
    expect(types.enumTypes[0].definition).toContain('enum');
    expect(types.enumTypes[0].definition).toContain('ACTIVE');
  });

  it('应该正确处理嵌套对象类型', () => {
    const nestedSchema = {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                city: { type: 'string' }
              }
            }
          }
        }
      }
    };
    
    const type = typeGenerator.formatTypeForTypeScript(nestedSchema);
    expect(type).toContain('{ user: { name: string; address: { city: string } } }');
  });

  it('应该正确处理数组类型', () => {
    const arraySchema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      }
    };
    
    const type = typeGenerator.formatTypeForTypeScript(arraySchema);
    expect(type).toBe('Array<{ id?: string }>');
  });

  it('应该正确处理联合类型', () => {
    const unionSchema = {
      oneOf: [
        { type: 'string' },
        { type: 'number' }
      ]
    };
    
    const type = typeGenerator.formatTypeForTypeScript(unionSchema);
    expect(type).toBe('string | number');
  });
});