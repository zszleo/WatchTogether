/**
 * edge-cases.spec.js 边界条件测试
 * 测试空文档、复杂嵌套、无 tag 接口等特殊情况
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('边界条件测试', () => {
  let parseOpenAPIDocument;
  let generateCode;
  let defaultConfig;

  beforeAll(async () => {
    const openapiClientModule = await import('../openapi-client.js');
    const codeGenModule = await import('../code-generator.js');

    parseOpenAPIDocument = openapiClientModule.parseOpenAPIDocument;
    generateCode = codeGenModule.generateCode;

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

  describe('空文档处理', () => {
    it('应该处理完全没有 paths 的文档', async () => {
      const emptyDoc = {
        openapi: '3.0.1',
        info: { title: 'Empty API', version: '1.0.0' },
        paths: {},
        components: {}
      };

      const parsedDoc = parseOpenAPIDocument(emptyDoc);
      const files = await generateCode(parsedDoc, defaultConfig);

      expect(files).toBeDefined();
      expect(files.length).toBe(3);
      expect(files.every(f => f.content.length > 0)).toBe(true);
    });

    it('应该处理没有 components 的文档', async () => {
      const noComponentsDoc = {
        openapi: '3.0.1',
        info: { title: 'No Components', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              operationId: 'testGet',
              responses: {
                '200': { description: 'OK' }
              }
            }
          }
        }
      };

      const parsedDoc = parseOpenAPIDocument(noComponentsDoc);
      const files = await generateCode(parsedDoc, defaultConfig);

      expect(files).toBeDefined();
      expect(files.length).toBe(3);
    });

    it('应该处理空的 info 对象', async () => {
      const emptyInfoDoc = {
        openapi: '3.0.1',
        info: {},
        paths: {
          '/test': {
            get: {
              operationId: 'testGet',
              responses: { '200': { description: 'OK' } }
            }
          }
        },
        components: {}
      };

      const parsedDoc = parseOpenAPIDocument(emptyInfoDoc);
      const files = await generateCode(parsedDoc, defaultConfig);

      expect(files).toBeDefined();
    });
  });

  describe('无 tag 接口处理', () => {
    it('应该为没有 tag 的接口创建分组', async () => {
      const noTagDoc = {
        openapi: '3.0.1',
        info: { title: 'No Tags', version: '1.0.0' },
        paths: {
          '/api1': {
            get: {
              operationId: 'api1',
              responses: { '200': { description: 'OK' } }
            }
          },
          '/api2': {
            post: {
              operationId: 'api2',
              responses: { '200': { description: 'OK' } }
            }
          }
        },
        components: {}
      };

      const parsedDoc = parseOpenAPIDocument(noTagDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      // 无 tag 的接口会被分组，类名根据路径生成
      expect(apiFile.content).toContain('Api');
      expect(apiFile.content).toContain('api1');
      expect(apiFile.content).toContain('api2');
    });

    it('应该处理空 tags 数组的接口', async () => {
      const emptyTagsDoc = {
        openapi: '3.0.1',
        info: { title: 'Empty Tags', version: '1.0.0' },
        paths: {
          '/api': {
            get: {
              operationId: 'getApi',
              tags: [],
              responses: { '200': { description: 'OK' } }
            }
          }
        },
        components: {}
      };

      const parsedDoc = parseOpenAPIDocument(emptyTagsDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      // 空 tags 的接口会被分组
      expect(apiFile.content).toContain('Api');
      expect(apiFile.content).toContain('getApi');
    });
  });

  describe('复杂嵌套 Schema 处理', () => {
    it('应该处理深层嵌套的对象', async () => {
      const nestedDoc = {
        openapi: '3.0.1',
        info: { title: 'Nested', version: '1.0.0' },
        paths: {
          '/nested': {
            get: {
              operationId: 'getNested',
              responses: {
                '200': {
                  description: 'OK',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          level1: {
                            type: 'object',
                            properties: {
                              level2: {
                                type: 'object',
                                properties: {
                                  level3: {
                                    type: 'string'
                                  }
                                }
                              }
                            }
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
        components: {}
      };

      const parsedDoc = parseOpenAPIDocument(nestedDoc);
      const files = await generateCode(parsedDoc, defaultConfig);

      expect(files).toBeDefined();
      expect(files.length).toBe(3);
    });

    it('应该处理数组中嵌套对象', async () => {
      const arrayNestedDoc = {
        openapi: '3.0.1',
        info: { title: 'Array Nested', version: '1.0.0' },
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
                          type: 'object',
                          properties: {
                            id: { type: 'integer' },
                            nested: {
                              type: 'object',
                              properties: {
                                name: { type: 'string' }
                              }
                            }
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
        components: {}
      };

      const parsedDoc = parseOpenAPIDocument(arrayNestedDoc);
      const files = await generateCode(parsedDoc, defaultConfig);

      expect(files).toBeDefined();
    });

    it('应该处理 allOf 组合 Schema', async () => {
      const allOfDoc = {
        openapi: '3.0.1',
        info: { title: 'AllOf', version: '1.0.0' },
        paths: {
          '/allof': {
            get: {
              operationId: 'getAllof',
              responses: {
                '200': {
                  description: 'OK',
                  content: {
                    'application/json': {
                      schema: {
                        allOf: [
                          { $ref: '#/components/schemas/Base' },
                          {
                            type: 'object',
                            properties: {
                              extra: { type: 'string' }
                            }
                          }
                        ]
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
            Base: {
              type: 'object',
              properties: {
                id: { type: 'integer' }
              }
            }
          }
        }
      };

      const parsedDoc = parseOpenAPIDocument(allOfDoc);
      const files = await generateCode(parsedDoc, defaultConfig);

      expect(files).toBeDefined();
    });

    it('应该处理 oneOf 组合 Schema', async () => {
      const oneOfDoc = {
        openapi: '3.0.1',
        info: { title: 'OneOf', version: '1.0.0' },
        paths: {
          '/oneof': {
            get: {
              operationId: 'getOneof',
              responses: {
                '200': {
                  description: 'OK',
                  content: {
                    'application/json': {
                      schema: {
                        oneOf: [
                          { type: 'string' },
                          { type: 'number' },
                          { type: 'boolean' }
                        ]
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

      const parsedDoc = parseOpenAPIDocument(oneOfDoc);
      const files = await generateCode(parsedDoc, defaultConfig);

      expect(files).toBeDefined();
    });
  });

  describe('特殊参数处理', () => {
    it('应该处理可选参数', async () => {
      const optionalParamsDoc = {
        openapi: '3.0.1',
        info: { title: 'Optional Params', version: '1.0.0' },
        paths: {
          '/search': {
            get: {
              operationId: 'search',
              parameters: [
                {
                  name: 'query',
                  in: 'query',
                  required: true,
                  schema: { type: 'string' }
                },
                {
                  name: 'page',
                  in: 'query',
                  required: false,
                  schema: { type: 'integer', default: 1 }
                },
                {
                  name: 'size',
                  in: 'query',
                  required: false,
                  schema: { type: 'integer', default: 10 }
                }
              ],
              responses: {
                '200': { description: 'OK' }
              }
            }
          }
        },
        components: {}
      };

      const parsedDoc = parseOpenAPIDocument(optionalParamsDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      expect(apiFile.content).toContain('queryParams');
    });

    it('应该处理路径中的多个参数', async () => {
      const multiPathParamsDoc = {
        openapi: '3.0.1',
        info: { title: 'Multi Path Params', version: '1.0.0' },
        paths: {
          '/users/{userId}/posts/{postId}': {
            get: {
              operationId: 'getUserPost',
              parameters: [
                {
                  name: 'userId',
                  in: 'path',
                  required: true,
                  schema: { type: 'integer' }
                },
                {
                  name: 'postId',
                  in: 'path',
                  required: true,
                  schema: { type: 'integer' }
                }
              ],
              responses: {
                '200': { description: 'OK' }
              }
            }
          }
        },
        components: {}
      };

      const parsedDoc = parseOpenAPIDocument(multiPathParamsDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      expect(apiFile.content).toContain('${userId}');
      expect(apiFile.content).toContain('${postId}');
    });

    it('应该处理混合参数类型', async () => {
      const mixedParamsDoc = {
        openapi: '3.0.1',
        info: { title: 'Mixed Params', version: '1.0.0' },
        paths: {
          '/items/{itemId}': {
            put: {
              operationId: 'updateItem',
              parameters: [
                {
                  name: 'itemId',
                  in: 'path',
                  required: true,
                  schema: { type: 'integer' }
                }
              ],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' }
                      }
                    }
                  }
                }
              },
              responses: {
                '200': { description: 'OK' }
              }
            }
          }
        },
        components: {}
      };

      const parsedDoc = parseOpenAPIDocument(mixedParamsDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      expect(apiFile.content).toContain('${itemId}');
      expect(apiFile.content).toContain('data');
    });
  });

  describe('不同响应类型处理', () => {
    it('应该处理无响应内容的接口', async () => {
      const noContentDoc = {
        openapi: '3.0.1',
        info: { title: 'No Content', version: '1.0.0' },
        paths: {
          '/delete/{id}': {
            delete: {
              operationId: 'deleteItem',
              parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
              ],
              responses: {
                '204': { description: 'No Content' }
              }
            }
          }
        },
        components: {}
      };

      const parsedDoc = parseOpenAPIDocument(noContentDoc);
      const files = await generateCode(parsedDoc, defaultConfig);

      expect(files).toBeDefined();
      expect(files.length).toBe(3);
    });

    it('应该处理只有描述的响应', async () => {
      const descOnlyDoc = {
        openapi: '3.0.1',
        info: { title: 'Desc Only', version: '1.0.0' },
        paths: {
          '/status': {
            get: {
              operationId: 'getStatus',
              responses: {
                '200': {
                  description: 'Returns the current status'
                }
              }
            }
          }
        },
        components: {}
      };

      const parsedDoc = parseOpenAPIDocument(descOnlyDoc);
      const files = await generateCode(parsedDoc, defaultConfig);

      expect(files).toBeDefined();
    });

    it('应该处理多种内容类型的响应', async () => {
      const multiContentDoc = {
        openapi: '3.0.1',
        info: { title: 'Multi Content', version: '1.0.0' },
        paths: {
          '/export': {
            get: {
              operationId: 'exportData',
              responses: {
                '200': {
                  description: 'OK',
                  content: {
                    'application/json': {
                      schema: { type: 'object' }
                    },
                    'text/csv': {
                      schema: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        components: {}
      };

      const parsedDoc = parseOpenAPIDocument(multiContentDoc);
      const files = await generateCode(parsedDoc, defaultConfig);

      expect(files).toBeDefined();
    });
  });

  describe('重复 operationId 处理', () => {
    it('应该处理重复的 operationId', async () => {
      const duplicateOpIdDoc = {
        openapi: '3.0.1',
        info: { title: 'Duplicate', version: '1.0.0' },
        paths: {
          '/api1': {
            get: {
              operationId: 'getData',
              tags: ['Group1'],
              responses: { '200': { description: 'OK' } }
            }
          },
          '/api2': {
            get: {
              operationId: 'getData',
              tags: ['Group2'],
              responses: { '200': { description: 'OK' } }
            }
          }
        },
        components: {}
      };

      const parsedDoc = parseOpenAPIDocument(duplicateOpIdDoc);
      const files = await generateCode(parsedDoc, defaultConfig);

      expect(files).toBeDefined();
    });
  });

  describe('缺少 operationId 处理', () => {
    it('应该自动生成 operationId', async () => {
      const noOpIdDoc = {
        openapi: '3.0.1',
        info: { title: 'No OpId', version: '1.0.0' },
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              responses: { '200': { description: 'OK' } }
            },
            post: {
              summary: 'Create user',
              responses: { '201': { description: 'Created' } }
            }
          }
        },
        components: {}
      };

      const parsedDoc = parseOpenAPIDocument(noOpIdDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      // 应该自动生成 operationId
      expect(apiFile.content).toContain('getUsers');
      expect(apiFile.content).toContain('postUsers');
    });
  });

  describe('特殊字符处理', () => {
    it('应该处理路径中的特殊字符', async () => {
      const specialPathDoc = {
        openapi: '3.0.1',
        info: { title: 'Special Path', version: '1.0.0' },
        paths: {
          '/api/v1/users/{user-id}': {
            get: {
              operationId: 'getUserById',
              parameters: [
                { name: 'user-id', in: 'path', required: true, schema: { type: 'string' } }
              ],
              responses: { '200': { description: 'OK' } }
            }
          }
        },
        components: {}
      };

      const parsedDoc = parseOpenAPIDocument(specialPathDoc);
      const files = await generateCode(parsedDoc, defaultConfig);

      expect(files).toBeDefined();
    });
  });
});
