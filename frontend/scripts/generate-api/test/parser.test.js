import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 动态导入CommonJS模块
let OpenAPIParser;
beforeAll(async () => {
  const module = await import('../lib/parser.js');
  OpenAPIParser = module.default;
});

describe('OpenAPI解析模块', () => {
  let testSpec;
  
  beforeAll(() => {
    const fixturePath = path.join(__dirname, 'fixtures', 'openapi.json');
    testSpec = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  });
  
  it('应该正确初始化解析器', () => {
    const parser = new OpenAPIParser(testSpec);
    
    expect(parser).toBeDefined();
    expect(parser.spec).toEqual(testSpec);
    expect(parser.paths).toBeDefined();
    expect(parser.components).toBeDefined();
    expect(parser.tags).toHaveLength(2);
  });
  
  it('应该获取所有接口', () => {
    const parser = new OpenAPIParser(testSpec);
    const endpoints = parser.getAllEndpoints();
    
    expect(endpoints).toHaveLength(3);
    expect(endpoints[0].path).toBe('/api/rooms');
    expect(endpoints[0].method).toBe('get');
    expect(endpoints[0].operationId).toBe('getRooms');
  });
  
  it('应该解析接口详情', () => {
    const parser = new OpenAPIParser(testSpec);
    const endpoints = parser.getAllEndpoints();
    const roomEndpoint = endpoints.find(e => e.operationId === 'getRoomById');
    
    expect(roomEndpoint).toBeDefined();
    expect(roomEndpoint.pathParams).toEqual(['id']);
    expect(roomEndpoint.parameters).toHaveLength(1);
    expect(roomEndpoint.parameters[0].name).toBe('id');
    expect(roomEndpoint.parameters[0].in).toBe('path');
    expect(roomEndpoint.parameters[0].required).toBe(true);
  });
  
  it('应该按标签分组接口', () => {
    const parser = new OpenAPIParser(testSpec);
    const grouped = parser.getEndpointsByTag();
    
    expect(Object.keys(grouped)).toContain('rooms');
    expect(grouped.rooms).toHaveLength(3);
    expect(grouped.sessions).toHaveLength(0); // 没有接口使用sessions标签
  });
  
  it('应该获取模型定义', () => {
    const parser = new OpenAPIParser(testSpec);
    const models = parser.getModels();
    
    expect(Object.keys(models)).toEqual(['Room', 'CreateRoomRequest']);
    expect(models.Room.properties).toBeDefined();
    expect(models.Room.required).toEqual(['id', 'name']);
  });
  
  it('应该验证OpenAPI规范', () => {
    const parser = new OpenAPIParser(testSpec);
    const validation = parser.validate();
    
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    expect(validation.stats.endpoints).toBe(3);
    expect(validation.stats.tags).toBe(2);
    expect(validation.stats.models).toBe(2);
  });
  
  it('应该处理缺少操作ID的情况', () => {
    const specWithoutOperationId = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/api/test': {
          get: {
            summary: 'Test endpoint'
          }
        }
      }
    };
    
    const parser = new OpenAPIParser(specWithoutOperationId);
    const endpoints = parser.getAllEndpoints();
    
    expect(endpoints[0].operationId).toBeDefined();
    expect(endpoints[0].operationId).toMatch(/^get/);
  });
  
  it('应该解析参数类型', () => {
    const parser = new OpenAPIParser(testSpec);
    const endpoints = parser.getAllEndpoints();
    const roomsEndpoint = endpoints.find(e => e.operationId === 'getRooms');
    
    expect(roomsEndpoint.parameters[0].schema.type).toBe('integer');
    expect(roomsEndpoint.queryParams).toEqual(['limit']);
  });
  
  it('应该解析请求体', () => {
    const parser = new OpenAPIParser(testSpec);
    const endpoints = parser.getAllEndpoints();
    const createRoomEndpoint = endpoints.find(e => e.operationId === 'createRoom');
    
    expect(createRoomEndpoint.requestBody).toBeDefined();
    expect(createRoomEndpoint.requestBody.required).toBe(true);
    expect(createRoomEndpoint.requestBody.content['application/json']).toBeDefined();
  });
  
  it('应该解析响应', () => {
    const parser = new OpenAPIParser(testSpec);
    const endpoints = parser.getAllEndpoints();
    const roomsEndpoint = endpoints.find(e => e.operationId === 'getRooms');
    
    expect(roomsEndpoint.responses['200']).toBeDefined();
    expect(roomsEndpoint.responses['200'].content['application/json']).toBeDefined();
  });
});