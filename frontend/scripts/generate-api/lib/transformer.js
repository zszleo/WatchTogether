/**
 * 数据转换模块
 * 将OpenAPI数据转换为模板所需格式
 */

const { logger } = require('../utils/logger');

/**
 * 数据转换器类
 */
class DataTransformer {
  constructor(parser, config = {}) {
    this.parser = parser;
    this.config = config;
  }

  /**
   * 转换所有接口数据为模板数据
   */
  transformForTemplate() {
    const endpoints = this.parser.getAllEndpoints();
    const models = this.parser.getModels();
    const tags = this.parser.getEndpointsByTag();
    
    return {
      // 基本信息
      info: this.transformInfo(),
      
      // 所有接口
      endpoints: endpoints.map(endpoint => this.transformEndpoint(endpoint)),
      
      // 按标签分组
      tags: this.transformTags(tags),
      
      // 模型定义
      models: this.transformModels(models),
      
      // 全局配置
      config: {
        useAxios: this.config.generate?.useAxios !== false,
        baseUrl: this.config.generate?.baseUrl || '',
        requestInterceptor: this.config.generate?.requestInterceptor || '',
        responseInterceptor: this.config.generate?.responseInterceptor || '',
        generateTypescript: this.config.generate?.typescript || false,
        generateMock: this.config.generate?.mock || false,
        generateTests: this.config.generate?.tests || false
      },
      
      // 工具函数
      utils: {
        formatFunctionName: this.formatFunctionName.bind(this),
        formatType: this.formatType.bind(this),
        formatDescription: this.formatDescription.bind(this),
        getParamExample: this.getParamExample.bind(this)
      }
    };
  }

  /**
   * 转换基本信息
   */
  transformInfo() {
    const info = this.parser.info;
    
    return {
      title: info.title || 'API',
      description: info.description || '',
      version: info.version || '1.0.0',
      contact: info.contact || {},
      license: info.license || {}
    };
  }

  /**
   * 转换单个接口
   */
  transformEndpoint(endpoint) {
    const functionName = this.formatFunctionName(endpoint.operationId);
    const jsdoc = this.generateJSDoc({ ...endpoint, functionName });
    
    return {
      // 基本信息
      ...endpoint,
      
      // 函数名
      functionName,
      
      // JSDoc注释
      jsdoc,
      
      // 转换后的参数
      parameters: this.transformParameters(endpoint.parameters),
      
      // 转换后的请求体
      requestBody: this.transformRequestBody(endpoint.requestBody),
      
      // 转换后的响应
      responses: this.transformResponses(endpoint.responses),
      
      // 路径处理
      path: endpoint.path,
      pathWithParams: this.formatPathWithParams(endpoint.path, endpoint.pathParams),
      
      // 请求配置
      requestConfig: this.getRequestConfig(endpoint),
      
      // 类型信息
      types: this.getEndpointTypes(endpoint),
      
      // 示例代码
      examples: this.getEndpointExamples(endpoint, functionName)
    };
  }

  /**
   * 转换参数
   */
  transformParameters(parameters) {
    return parameters.map(param => ({
      ...param,
      type: this.formatType(param.schema),
      defaultValue: this.getDefaultValue(param.schema),
      isPathParam: param.in === 'path',
      isQueryParam: param.in === 'query',
      isHeaderParam: param.in === 'header',
      isBodyParam: param.in === 'body',
      isFormData: param.in === 'formData'
    }));
  }

  /**
   * 转换请求体
   */
  transformRequestBody(requestBody) {
    if (!requestBody) return null;
    
    const contentTypes = Object.keys(requestBody.content || {});
    const primaryType = contentTypes[0] || 'application/json';
    const schema = requestBody.content[primaryType]?.schema || {};
    
    return {
      ...requestBody,
      primaryContentType: primaryType,
      schema,
      type: this.formatType(schema),
      isMultipart: primaryType.includes('multipart/form-data'),
      isJson: primaryType.includes('application/json'),
      isFormUrlEncoded: primaryType.includes('application/x-www-form-urlencoded')
    };
  }

  /**
   * 转换响应
   */
  transformResponses(responses) {
    const result = {};
    
    for (const [statusCode, response] of Object.entries(responses)) {
      const contentTypes = Object.keys(response.content || {});
      const primaryType = contentTypes[0] || 'application/json';
      const schema = response.content[primaryType]?.schema || {};
      
      result[statusCode] = {
        ...response,
        primaryContentType: primaryType,
        schema,
        type: this.formatType(schema),
        isSuccess: statusCode.startsWith('2'),
        isError: statusCode.startsWith('4') || statusCode.startsWith('5')
      };
    }
    
    return result;
  }

  /**
   * 转换标签分组
   */
  transformTags(tags) {
    const result = [];
    
    for (const [tagName, endpoints] of Object.entries(tags)) {
      result.push({
        name: tagName,
        endpoints: endpoints.map(endpoint => this.transformEndpoint(endpoint)),
        description: this.getTagDescription(tagName)
      });
    }
    
    return result;
  }

  /**
   * 转换模型
   */
  transformModels(models) {
    const result = [];
    
    for (const [modelName, model] of Object.entries(models)) {
      result.push({
        name: modelName,
        type: model.type,
        properties: this.transformModelProperties(model.properties),
        required: model.required,
        description: model.schema.description || '',
        example: model.schema.example
      });
    }
    
    return result;
  }

  /**
   * 转换模型属性
   */
  transformModelProperties(properties) {
    const result = [];
    
    for (const [propName, prop] of Object.entries(properties)) {
      result.push({
        name: propName,
        type: prop.type,
        description: prop.description || '',
        required: prop.required,
        example: prop.example,
        enum: prop.enum
      });
    }
    
    return result;
  }

  /**
   * 格式化函数名
   */
  formatFunctionName(operationId) {
    if (!operationId) return 'apiCall';
    
    // 转换为驼峰命名
    return operationId
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .map((word, index) => {
        if (index === 0) {
          return word.charAt(0).toLowerCase() + word.slice(1);
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join('')
      .replace(/([a-z])([A-Z])/g, '$1$2')
      .replace(/\s+/g, '');
  }

  /**
   * 格式化类型
   */
  formatType(schema) {
    return this.parser.getTypeFromSchema(schema);
  }

  /**
   * 格式化描述
   */
  formatDescription(description) {
    if (!description) return '';
    
    // 清理描述文本
    return description
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 获取参数示例值
   */
  getParamExample(schema) {
    if (schema.example !== undefined) return schema.example;
    
    if (schema.default !== undefined) return schema.default;
    
    switch (schema.type) {
      case 'string':
        if (schema.enum && schema.enum.length > 0) return schema.enum[0];
        if (schema.format === 'date-time') return '2024-01-01T00:00:00Z';
        if (schema.format === 'date') return '2024-01-01';
        if (schema.format === 'email') return 'user@example.com';
        return 'string';
        
      case 'number':
      case 'integer':
        return 0;
        
      case 'boolean':
        return false;
        
      case 'array':
        return [];
        
      case 'object':
        return {};
        
      default:
        return null;
    }
  }

  /**
   * 获取默认值
   */
  getDefaultValue(schema) {
    if (schema.default !== undefined) return schema.default;
    return undefined;
  }

  /**
   * 格式化带参数的路径
   */
  formatPathWithParams(path, pathParams) {
    let result = path;
    pathParams.forEach(param => {
      result = result.replace(`{${param}}`, `\${${param}}`);
    });
    return result;
  }

  /**
   * 获取请求配置
   */
  getRequestConfig(endpoint) {
    const config = {
      method: endpoint.method.toUpperCase(),
      url: endpoint.path,
      headers: {},
      params: {},
      data: null
    };
    
    // 添加安全配置
    if (endpoint.security && endpoint.security.length > 0) {
      config.security = endpoint.security;
    }
    
    return config;
  }

  /**
   * 获取接口类型信息
   */
  getEndpointTypes(endpoint) {
    const paramsType = this.getParamsType(endpoint.parameters);
    const requestBodyType = this.getRequestBodyType(endpoint.requestBody);
    const responseType = this.getResponseType(endpoint.responses);
    
    return {
      params: paramsType,
      requestBody: requestBodyType,
      response: responseType,
      functionSignature: this.getFunctionSignature(endpoint, paramsType, requestBodyType, responseType)
    };
  }

  /**
   * 获取参数类型
   */
  getParamsType(parameters) {
    const pathParams = parameters.filter(p => p.in === 'path');
    const queryParams = parameters.filter(p => p.in === 'query');
    const headerParams = parameters.filter(p => p.in === 'header');
    
    const types = [];
    
    if (pathParams.length > 0) {
      const pathType = pathParams.map(p => `${p.name}: ${this.formatType(p.schema)}`).join(', ');
      types.push(`pathParams: { ${pathType} }`);
    }
    
    if (queryParams.length > 0) {
      const queryType = queryParams.map(p => `${p.name}${p.required ? '' : '?'}: ${this.formatType(p.schema)}`).join(', ');
      types.push(`queryParams: { ${queryType} }`);
    }
    
    if (headerParams.length > 0) {
      const headerType = headerParams.map(p => `${p.name}${p.required ? '' : '?'}: ${this.formatType(p.schema)}`).join(', ');
      types.push(`headers: { ${headerType} }`);
    }
    
    return types.length > 0 ? `{ ${types.join('; ')} }` : '{}';
  }

  /**
   * 获取请求体类型
   */
  getRequestBodyType(requestBody) {
    if (!requestBody) return 'void';
    
    const schema = requestBody.content?.['application/json']?.schema;
    if (!schema) return 'any';
    
    return this.formatType(schema);
  }

  /**
   * 获取响应类型
   */
  getResponseType(responses) {
    const successResponse = Object.entries(responses).find(([code]) => code.startsWith('2'));
    if (!successResponse) return 'any';
    
    const schema = successResponse[1].content?.['application/json']?.schema;
    if (!schema) return 'any';
    
    return this.formatType(schema);
  }

  /**
   * 获取函数签名
   */
  getFunctionSignature(endpoint, paramsType, requestBodyType, responseType) {
    const functionName = this.formatFunctionName(endpoint.operationId);
    const params = [];
    
    if (paramsType !== '{}') params.push(`params: ${paramsType}`);
    if (requestBodyType !== 'void') params.push(`data: ${requestBodyType}`);
    
    const returnType = `Promise<${responseType}>`;
    
    return `${functionName}(${params.join(', ')}): ${returnType}`;
  }

  /**
   * 获取接口示例代码
   */
  getEndpointExamples(endpoint, functionName) {
    const examples = [];
    
    // 基础调用示例
    examples.push({
      title: '基础调用',
      code: this.generateExampleCode(endpoint, functionName)
    });
    
    return examples;
  }

  /**
   * 生成示例代码
   */
  generateExampleCode(endpoint, functionName) {
    const params = [];
    const args = [];
    
    if (endpoint.pathParams.length > 0) {
      params.push(`pathParams: { ${endpoint.pathParams.map(p => `${p}: 'value'`).join(', ')} }`);
      args.push(`{ pathParams: { ${endpoint.pathParams.map(p => `${p}: 'value'`).join(', ')} } }`);
    }
    
    if (endpoint.requestBody) {
      params.push('data: {}');
      args.push('{}');
    }
    
    return `const result = await ${functionName}(${args.join(', ')});`;
  }

  /**
   * 生成JSDoc注释
   */
  generateJSDoc(endpoint) {
    const jsdocLevel = this.config.generate?.jsdocLevel || 'basic';
    const lines = [];
    
    // 函数描述
    if (endpoint.summary) {
      lines.push(` * ${endpoint.summary}`);
    }
    
    if (endpoint.description && endpoint.description !== endpoint.summary) {
      lines.push(` * ${endpoint.description}`);
    }
    
    if (endpoint.summary || endpoint.description) {
      lines.push(' *');
    }
    
    // 弃用标记
    if (endpoint.deprecated) {
      lines.push(' * @deprecated');
    }
    
    // 参数说明
    if (jsdocLevel !== 'basic' && endpoint.parameters && endpoint.parameters.length > 0) {
      endpoint.parameters.forEach(param => {
        const type = this.formatType(param.schema);
        const required = param.required ? ' (必填)' : '';
        const desc = param.description ? ` ${param.description}` : '';
        lines.push(` * @param {${type}} ${param.name}${required}${desc}`);
      });
    } else if (endpoint.parameters && endpoint.parameters.length > 0) {
      // 基础模式：只显示参数名
      endpoint.parameters.forEach(param => {
        const required = param.required ? ' (必填)' : '';
        lines.push(` * @param ${param.name}${required}`);
      });
    }
    
    // 请求体参数
    if (endpoint.requestBody) {
      const requestBodyType = this.formatType(endpoint.requestBody.schema);
      lines.push(` * @param {${requestBodyType}} data 请求体数据`);
    }
    
    // 返回类型说明
    const successResponse = Object.entries(endpoint.responses || {})
      .find(([code]) => code.startsWith('2'));
    
    if (successResponse) {
      const responseType = this.formatType(successResponse[1].schema);
      lines.push(` * @returns {Promise<${responseType}>} 响应数据`);
    } else {
      lines.push(' * @returns {Promise<any>} 响应数据');
    }
    
    // 详细模式：添加示例
    if (jsdocLevel === 'detailed' || jsdocLevel === 'full') {
      lines.push(' *');
      
      if (endpoint.pathParams.length > 0) {
        const exampleParams = endpoint.pathParams.map(p => `${p}: 'example'`).join(', ');
        lines.push(` * @example`);
        lines.push(` * // 使用路径参数`);
        lines.push(` * await ${endpoint.functionName}({ ${exampleParams} });`);
      }
      
      if (endpoint.requestBody) {
        lines.push(` * @example`);
        lines.push(` * // 使用请求体`);
        lines.push(` * await ${endpoint.functionName}({}, { ... });`);
      }
    }
    
    // 完整模式：添加更多细节
    if (jsdocLevel === 'full') {
      lines.push(' *');
      lines.push(` * @throws {Error} 请求失败时抛出错误`);
      lines.push(` * @see ${endpoint.path} ${endpoint.method.toUpperCase()}`);
    }
    
    // 添加JSDoc标记
    if (lines.length > 0) {
      lines.unshift('/**');
      lines.push(' */');
      return lines.join('\n');
    }
    
    return '';
  }

  /**
   * 获取标签描述
   */
  getTagDescription(tagName) {
    const tag = this.parser.tags.find(t => t.name === tagName);
    return tag ? tag.description || '' : '';
  }
}

module.exports = DataTransformer;