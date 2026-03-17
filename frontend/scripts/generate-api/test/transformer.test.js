import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let OpenAPIParser;
let DataTransformer;

beforeAll(async () => {
  const parserModule = await import('../lib/parser.js');
  const transformerModule = await import('../lib/transformer.js');
  
  OpenAPIParser = parserModule.default;
  DataTransformer = transformerModule.default;
});

describe('数据转换模块', () => {
  let testSpec;
  let parser;
  let transformer;
  
  beforeAll(() => {
    const fixturePath = path.join(__dirname, 'fixtures', 'openapi.json');
    testSpec = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    parser = new OpenAPIParser(testSpec);
    transformer = new DataTransformer(parser, {});
  });
  
  it('应该正确初始化转换器', () => {
    expect(transformer).toBeDefined();
    expect(transformer.parser).toBe(parser);
    expect(transformer.config).toEqual({});
  });
  
  it('应该转换所有接口数据', () => {
    const templateData = transformer.transformForTemplate();
    
    expect(templateData).toBeDefined();
    expect(templateData.info).toBeDefined();
    expect(templateData.info.title).toBe('Test API');
    expect(templateData.endpoints).toHaveLength(3);
    expect(templateData.tags).toHaveLength(2); // rooms和sessions
    expect(templateData.models).toHaveLength(2);
  });
  
  it('应该转换单个接口', () => {
    const endpoints = parser.getAllEndpoints();
    const roomEndpoint = endpoints.find(e => e.operationId === 'getRoomById');
    const transformed = transformer.transformEndpoint(roomEndpoint);
    
    expect(transformed.functionName).toBe('getRoomById');
    expect(transformed.pathWithParams).toBe('/api/rooms/${id}');
    expect(transformed.pathParams).toEqual(['id']);
    expect(transformed.types).toBeDefined();
  });
  
  it('应该格式化函数名', () => {
    const functionName = transformer.formatFunctionName('getRoomById');
    expect(functionName).toBe('getRoomById');
    
    const functionName2 = transformer.formatFunctionName('Create_Room');
    expect(functionName2).toBe('createRoom');
  });
  
  it('应该格式化类型', () => {
    const stringType = transformer.formatType({ type: 'string' });
    expect(stringType).toBe('string');
    
    const numberType = transformer.formatType({ type: 'integer' });
    expect(numberType).toBe('number');
    
    const booleanType = transformer.formatType({ type: 'boolean' });
    expect(booleanType).toBe('boolean');
    
    const arrayType = transformer.formatType({ type: 'array', items: { type: 'string' } });
    expect(arrayType).toBe('Array<string>');
    
    const refType = transformer.formatType({ $ref: '#/components/schemas/Room' });
    expect(refType).toBe('Room');
  });
  
  it('应该转换参数', () => {
    const parameters = [
      {
        name: 'id',
        in: 'path',
        schema: { type: 'string' },
        required: true
      },
      {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer' },
        required: false
      }
    ];
    
    const transformed = transformer.transformParameters(parameters);
    
    expect(transformed).toHaveLength(2);
    expect(transformed[0].isPathParam).toBe(true);
    expect(transformed[0].type).toBe('string');
    expect(transformed[1].isQueryParam).toBe(true);
    expect(transformed[1].type).toBe('number');
  });
  
  it('应该转换请求体', () => {
    const requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/CreateRoomRequest'
          }
        }
      }
    };
    
    const transformed = transformer.transformRequestBody(requestBody);
    
    expect(transformed).toBeDefined();
    expect(transformed.required).toBe(true);
    expect(transformed.primaryContentType).toBe('application/json');
    expect(transformed.type).toBe('CreateRoomRequest');
    expect(transformed.isJson).toBe(true);
  });
  
  it('应该转换标签分组', () => {
    const tags = {
      rooms: parser.getAllEndpoints().filter(e => e.tags.includes('rooms'))
    };
    
    const transformed = transformer.transformTags(tags);
    
    expect(transformed).toHaveLength(1);
    expect(transformed[0].name).toBe('rooms');
    expect(transformed[0].endpoints).toHaveLength(3);
  });
  
  it('应该转换模型', () => {
    const models = parser.getModels();
    const transformed = transformer.transformModels(models);
    
    expect(transformed).toHaveLength(2);
    
    const roomModel = transformed.find(m => m.name === 'Room');
    expect(roomModel).toBeDefined();
    expect(roomModel.properties).toHaveLength(3);
    expect(roomModel.required).toEqual(['id', 'name']);
  });
  
  it('应该获取参数示例值', () => {
    const schemaWithExample = { type: 'string', example: 'test' };
    const example = transformer.getParamExample(schemaWithExample);
    expect(example).toBe('test');
    
    const schemaWithDefault = { type: 'number', default: 10 };
    const defaultVal = transformer.getParamExample(schemaWithDefault);
    expect(defaultVal).toBe(10);
    
    const schemaEnum = { type: 'string', enum: ['a', 'b'] };
    const enumVal = transformer.getParamExample(schemaEnum);
    expect(enumVal).toBe('a');
    
    const stringSchema = { type: 'string' };
    const stringVal = transformer.getParamExample(stringSchema);
    expect(stringVal).toBe('string');
  });
  
  it('应该生成接口类型信息', () => {
    const endpoints = parser.getAllEndpoints();
    const roomEndpoint = endpoints.find(e => e.operationId === 'getRoomById');
    const types = transformer.getEndpointTypes(roomEndpoint);
    
    expect(types).toBeDefined();
    expect(types.params).toBeDefined();
    expect(types.requestBody).toBe('void');
    expect(types.response).toBe('Room');
    expect(types.functionSignature).toContain('getRoomById');
  });
  
  it('应该生成示例代码', () => {
    const endpoints = parser.getAllEndpoints();
    const roomEndpoint = endpoints.find(e => e.operationId === 'getRoomById');
    const examples = transformer.getEndpointExamples(roomEndpoint, 'getRoomById');
    
    expect(examples).toBeDefined();
    expect(examples[0].title).toBe('基础调用');
    expect(examples[0].code).toContain('getRoomById');
  });
});