/**
 * OpenAPI解析模块
 * 解析OpenAPI规范，提取接口信息
 */

const { logger } = require('../utils/logger');

/**
 * OpenAPI解析器类
 */
class OpenAPIParser {
  constructor(openapiSpec) {
    this.spec = openapiSpec;
    this.paths = openapiSpec.paths || {};
    this.components = openapiSpec.components || {};
    this.tags = openapiSpec.tags || [];
    this.info = openapiSpec.info || {};
  }

  /**
   * 获取所有接口信息
   */
  getAllEndpoints() {
    const endpoints = [];
    
    for (const [path, methods] of Object.entries(this.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        if (['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method.toLowerCase())) {
          endpoints.push(this.parseEndpoint(path, method, operation));
        }
      }
    }
    
    return endpoints;
  }

  /**
   * 解析单个接口
   */
  parseEndpoint(path, method, operation) {
    const endpoint = {
      path,
      method: method.toLowerCase(),
      operationId: operation.operationId || this.generateOperationId(path, method),
      summary: operation.summary || '',
      description: operation.description || '',
      tags: operation.tags || [],
      parameters: this.parseParameters(operation.parameters || []),
      requestBody: this.parseRequestBody(operation.requestBody),
      responses: this.parseResponses(operation.responses || {}),
      security: operation.security || [],
      deprecated: operation.deprecated || false,
      servers: operation.servers || this.spec.servers || []
    };

    // 提取路径参数
    endpoint.pathParams = endpoint.parameters
      .filter(p => p.in === 'path')
      .map(p => p.name);

    // 提取查询参数
    endpoint.queryParams = endpoint.parameters
      .filter(p => p.in === 'query')
      .map(p => p.name);

    // 提取请求头参数
    endpoint.headerParams = endpoint.parameters
      .filter(p => p.in === 'header')
      .map(p => p.name);

    return endpoint;
  }

  /**
   * 生成操作ID
   */
  generateOperationId(path, method) {
    // 将路径转换为驼峰命名
    const pathParts = path
      .replace(/[{}]/g, '')
      .split('/')
      .filter(part => part.length > 0)
      .map(part => part.replace(/[^a-zA-Z0-9]/g, ' '))
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
    
    return `${method.toLowerCase()}${pathParts}`;
  }

  /**
   * 解析参数
   */
  parseParameters(parameters) {
    return parameters.map(param => {
      const parsed = {
        name: param.name,
        in: param.in,
        description: param.description || '',
        required: param.required || false,
        deprecated: param.deprecated || false,
        schema: this.resolveSchema(param.schema || {}),
        example: param.example
      };

      // 处理参数类型
      if (param.schema) {
        parsed.type = this.getTypeFromSchema(param.schema);
      } else if (param.content) {
        // 处理content类型参数
        parsed.contentType = Object.keys(param.content)[0];
        parsed.schema = this.resolveSchema(param.content[parsed.contentType].schema || {});
        parsed.type = this.getTypeFromSchema(parsed.schema);
      }

      return parsed;
    });
  }

  /**
   * 解析请求体
   */
  parseRequestBody(requestBody) {
    if (!requestBody) return null;

    const result = {
      description: requestBody.description || '',
      required: requestBody.required || false,
      content: {}
    };

    for (const [contentType, mediaType] of Object.entries(requestBody.content || {})) {
      result.content[contentType] = {
        schema: this.resolveSchema(mediaType.schema || {}),
        example: mediaType.example,
        examples: mediaType.examples
      };
    }

    return result;
  }

  /**
   * 解析响应
   */
  parseResponses(responses) {
    const result = {};

    for (const [statusCode, response] of Object.entries(responses)) {
      result[statusCode] = {
        description: response.description || '',
        content: {}
      };

      for (const [contentType, mediaType] of Object.entries(response.content || {})) {
        result[statusCode].content[contentType] = {
          schema: this.resolveSchema(mediaType.schema || {}),
          example: mediaType.example,
          examples: mediaType.examples
        };
      }

      // 提取响应头
      if (response.headers) {
        result[statusCode].headers = {};
        for (const [headerName, header] of Object.entries(response.headers)) {
          result[statusCode].headers[headerName] = {
            description: header.description || '',
            schema: this.resolveSchema(header.schema || {}),
            required: header.required || false
          };
        }
      }
    }

    return result;
  }

  /**
   * 解析Schema引用
   */
  resolveSchema(schema) {
    if (schema.$ref) {
      const refPath = schema.$ref.replace('#/', '').split('/');
      let current = this.spec;
      
      for (const part of refPath) {
        current = current[part];
        if (!current) break;
      }
      
      return current || schema;
    }
    
    return schema;
  }

  /**
   * 从Schema获取类型
   */
  getTypeFromSchema(schema) {
    if (!schema) return 'any';
    
    // 解析引用
    if (schema.$ref) {
      const refPath = schema.$ref.split('/').pop();
      return refPath;
    }
    
    // 处理联合类型
    if (schema.oneOf || schema.anyOf || schema.allOf) {
      const types = [];
      if (schema.oneOf) types.push(...schema.oneOf);
      if (schema.anyOf) types.push(...schema.anyOf);
      if (schema.allOf) types.push(...schema.allOf);
      
      const resolvedTypes = types.map(s => this.getTypeFromSchema(s)).filter(t => t !== 'any');
      if (resolvedTypes.length > 0) {
        return resolvedTypes.join(' | ');
      }
      return 'any';
    }
    
    if (schema.type) {
      switch (schema.type) {
        case 'string':
          if (schema.enum && schema.enum.length > 0) {
            return schema.enum.map(val => `'${val}'`).join(' | ');
          }
          if (schema.format === 'date-time') return 'string'; // ISO date string
          if (schema.format === 'date') return 'string';
          if (schema.format === 'email') return 'string';
          if (schema.format === 'uuid') return 'string';
          if (schema.format === 'uri') return 'string';
          if (schema.format === 'binary') return 'File | Blob';
          return 'string';
          
        case 'number':
        case 'integer':
          if (schema.format === 'int32' || schema.format === 'int64') return 'number';
          if (schema.format === 'float' || schema.format === 'double') return 'number';
          return 'number';
          
        case 'boolean':
          return 'boolean';
          
        case 'array':
          const itemsType = this.getTypeFromSchema(schema.items || {});
          return `Array<${itemsType}>`;
          
        case 'object':
          if (schema.properties) {
            const properties = this.getObjectPropertiesType(schema);
            return `{ ${properties} }`;
          }
          if (schema.additionalProperties) {
            const valueType = this.getTypeFromSchema(schema.additionalProperties);
            return `Record<string, ${valueType}>`;
          }
          return 'object';
          
        default:
          return schema.type;
      }
    }
    
    // 处理空对象
    if (schema.properties === undefined && schema.additionalProperties === undefined) {
      return 'any';
    }
    
    return 'any';
  }

  /**
   * 按标签分组接口
   */
  getEndpointsByTag() {
    const endpoints = this.getAllEndpoints();
    const grouped = {};
    
    // 初始化分组
    this.tags.forEach(tag => {
      grouped[tag.name] = [];
    });
    
    // 添加未分组的接口
    grouped['default'] = [];
    
    // 分组接口
    endpoints.forEach(endpoint => {
      if (endpoint.tags && endpoint.tags.length > 0) {
        endpoint.tags.forEach(tag => {
          if (!grouped[tag]) {
            grouped[tag] = [];
          }
          grouped[tag].push(endpoint);
        });
      } else {
        grouped['default'].push(endpoint);
      }
    });
    
    // 移除空分组
    Object.keys(grouped).forEach(tag => {
      if (grouped[tag].length === 0 && tag !== 'default') {
        delete grouped[tag];
      }
    });
    
    return grouped;
  }

  /**
   * 获取所有模型定义
   */
  getModels() {
    const schemas = this.components?.schemas || {};
    const models = {};
    
    for (const [modelName, schema] of Object.entries(schemas)) {
      models[modelName] = {
        name: modelName,
        schema: this.resolveSchema(schema),
        type: this.getTypeFromSchema(schema),
        properties: this.getModelProperties(schema),
        required: schema.required || []
      };
    }
    
    return models;
  }

  /**
   * 获取对象属性类型定义
   */
  getObjectPropertiesType(schema) {
    const resolved = this.resolveSchema(schema);
    const properties = resolved.properties || {};
    const required = resolved.required || [];
    const props = [];
    
    for (const [propName, propSchema] of Object.entries(properties)) {
      const type = this.getTypeFromSchema(propSchema);
      const isRequired = required.includes(propName);
      const propDef = `${propName}${isRequired ? '' : '?'}: ${type}`;
      props.push(propDef);
    }
    
    return props.join('; ');
  }

  /**
   * 获取模型属性
   */
  getModelProperties(schema) {
    const resolved = this.resolveSchema(schema);
    const properties = resolved.properties || {};
    const required = resolved.required || [];
    const result = {};
    
    for (const [propName, propSchema] of Object.entries(properties)) {
      const resolvedProp = this.resolveSchema(propSchema);
      result[propName] = {
        type: this.getTypeFromSchema(propSchema),
        description: resolvedProp.description || '',
        required: required.includes(propName),
        example: resolvedProp.example,
        enum: resolvedProp.enum,
        format: resolvedProp.format,
        schema: resolvedProp,
        nestedProperties: resolvedProp.properties ? this.getModelProperties(resolvedProp) : null,
        isArray: resolvedProp.type === 'array',
        arrayItemsType: resolvedProp.type === 'array' ? this.getTypeFromSchema(resolvedProp.items) : null
      };
    }
    
    return result;
  }

  /**
   * 验证OpenAPI规范
   */
  validate() {
    const errors = [];
    
    if (!this.spec.openapi) {
      errors.push('缺少openapi版本字段');
    }
    
    if (!this.paths || Object.keys(this.paths).length === 0) {
      errors.push('没有找到任何API路径');
    }
    
    // 检查是否有操作ID
    const endpoints = this.getAllEndpoints();
    const missingOperationIds = endpoints.filter(e => !e.operationId || e.operationId.startsWith('get') || e.operationId.startsWith('post'));
    
    if (missingOperationIds.length > 0) {
      logger.warn(`${missingOperationIds.length}个接口缺少有意义的operationId`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings: missingOperationIds.length > 0 ? ['部分接口缺少有意义的operationId'] : [],
      stats: {
        endpoints: endpoints.length,
        tags: this.tags.length,
        models: Object.keys(this.components?.schemas || {}).length
      }
    };
  }
}

module.exports = OpenAPIParser;