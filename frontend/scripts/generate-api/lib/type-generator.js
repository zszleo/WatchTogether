/**
 * TypeScript类型定义生成器
 * 生成完整的TypeScript类型定义文件(.d.ts)
 */

const { logger } = require('../utils/logger');

/**
 * TypeScript类型定义生成器类
 */
class TypeGenerator {
  constructor(parser, config = {}) {
    this.parser = parser;
    this.config = config;
  }

  /**
   * 生成完整的类型定义
   */
  generateTypes() {
    const models = this.parser.getModels();
    const endpoints = this.parser.getAllEndpoints();
    const tags = this.parser.getEndpointsByTag();
    
    return {
      // 基本信息
      info: this.generateInfo(),
      
      // 模型类型定义
      models: this.generateModelTypes(models),
      
      // 请求参数类型定义
      requestTypes: this.generateRequestTypes(endpoints),
      
      // 响应类型定义
      responseTypes: this.generateResponseTypes(endpoints),
      
      // API函数类型定义
      apiFunctionTypes: this.generateApiFunctionTypes(endpoints, tags),
      
      // 枚举类型定义
      enumTypes: this.generateEnumTypes(models),
      
      // 工具类型定义
      utilityTypes: this.generateUtilityTypes(),
      
      // 完整类型定义文件内容
      typeDefinitionFile: this.generateTypeDefinitionFile()
    };
  }

  /**
   * 生成基本信息
   */
  generateInfo() {
    const info = this.parser.info;
    
    return {
      title: info.title || 'API',
      version: info.version || '1.0.0',
      description: info.description || '',
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 生成模型类型定义
   */
  generateModelTypes(models) {
    const result = [];
    
    for (const [modelName, model] of Object.entries(models)) {
      const modelType = this.generateModelType(modelName, model);
      result.push(modelType);
    }
    
    return result;
  }

  /**
   * 生成单个模型类型定义
   */
  generateModelType(modelName, model) {
    const properties = model.properties || {};
    const required = model.required || [];
    
    // 生成属性定义
    const propertyDefs = [];
    for (const [propName, prop] of Object.entries(properties)) {
      const isRequired = required.includes(propName);
      const type = this.formatTypeForTypeScript(prop.schema);
      const description = prop.description ? `\n   * ${prop.description}` : '';
      
      propertyDefs.push({
        name: propName,
        type,
        required: isRequired,
        description: prop.description || '',
        example: prop.example,
        enum: prop.enum
      });
    }
    
    // 生成TypeScript接口定义
    const interfaceDef = this.generateInterfaceDefinition(modelName, propertyDefs);
    
    return {
      name: modelName,
      interface: interfaceDef,
      properties: propertyDefs,
      description: model.schema.description || '',
      example: model.schema.example
    };
  }

  /**
   * 生成接口定义
   */
  generateInterfaceDefinition(interfaceName, properties) {
    const lines = [];
    lines.push(`interface ${interfaceName} {`);
    
    for (const prop of properties) {
      const requiredMarker = prop.required ? '' : '?';
      const comment = prop.description ? ` // ${prop.description}` : '';
      lines.push(`  ${prop.name}${requiredMarker}: ${prop.type};${comment}`);
    }
    
    lines.push('}');
    return lines.join('\n');
  }

  /**
   * 生成请求参数类型定义
   */
  generateRequestTypes(endpoints) {
    const result = [];
    
    for (const endpoint of endpoints) {
      const requestType = this.generateEndpointRequestType(endpoint);
      if (requestType) {
        result.push(requestType);
      }
    }
    
    return result;
  }

  /**
   * 生成单个接口请求类型
   */
  generateEndpointRequestType(endpoint) {
    const paramsType = this.generateParamsType(endpoint.parameters);
    const requestBodyType = this.generateRequestBodyType(endpoint.requestBody);
    const hasParams = paramsType !== '{}';
    const hasRequestBody = requestBodyType !== 'void';
    
    if (!hasParams && !hasRequestBody) {
      return null;
    }
    
    const typeName = `${this.formatTypeName(endpoint.operationId)}Request`;
    
    // 生成请求类型定义
    let typeDef;
    
    if (hasParams && !hasRequestBody) {
      // 只有参数
      typeDef = `type ${typeName} = ${paramsType};`;
    } else if (!hasParams && hasRequestBody) {
      // 只有请求体
      typeDef = `type ${typeName} = ${requestBodyType};`;
    } else {
      // 两者都有
      // 合并paramsType和data属性
      // paramsType已经是对象字面量，如{ queryParams: { ... } }
      // 需要提取其内部属性到外层对象
      const paramsObj = paramsType.replace(/^\{\s*|\s*\}$/g, '');
      typeDef = `type ${typeName} = {\n  ${paramsObj}\n  data: ${requestBodyType}\n};`;
    }
    
    return {
      name: typeName,
      endpoint: endpoint.operationId,
      type: typeDef,
      paramsType,
      requestBodyType,
      description: endpoint.summary || endpoint.description || ''
    };
  }

  /**
   * 生成参数类型
   */
  generateParamsType(parameters) {
    const pathParams = parameters.filter(p => p.in === 'path');
    const queryParams = parameters.filter(p => p.in === 'query');
    const headerParams = parameters.filter(p => p.in === 'header');
    
    const parts = [];
    
    if (pathParams.length > 0) {
      const pathType = pathParams.map(p => 
        `${p.name}: ${this.formatTypeForTypeScript(p.schema)}`
      ).join('; ');
      parts.push(`pathParams: { ${pathType} }`);
    }
    
    if (queryParams.length > 0) {
      const queryType = queryParams.map(p => 
        `${p.name}${p.required ? '' : '?'}: ${this.formatTypeForTypeScript(p.schema)}`
      ).join('; ');
      parts.push(`queryParams: { ${queryType} }`);
    }
    
    if (headerParams.length > 0) {
      const headerType = headerParams.map(p => 
        `${p.name}${p.required ? '' : '?'}: ${this.formatTypeForTypeScript(p.schema)}`
      ).join('; ');
      parts.push(`headers: { ${headerType} }`);
    }
    
    if (parts.length === 0) {
      return '{}';
    }
    
    if (parts.length === 1) {
      return `{ ${parts[0]} }`;
    }
    
    return `{\n    ${parts.join('\n    ')}\n  }`;
  }

  /**
   * 生成请求体类型
   */
  generateRequestBodyType(requestBody) {
    if (!requestBody) return 'void';
    
    const contentTypes = Object.keys(requestBody.content || {});
    const primaryType = contentTypes[0] || 'application/json';
    const schema = requestBody.content[primaryType]?.schema;
    
    if (!schema) return 'any';
    
    return this.formatTypeForTypeScript(schema);
  }

  /**
   * 生成响应类型定义
   */
  generateResponseTypes(endpoints) {
    const result = [];
    
    for (const endpoint of endpoints) {
      const responseType = this.generateEndpointResponseType(endpoint);
      if (responseType) {
        result.push(responseType);
      }
    }
    
    return result;
  }

  /**
   * 生成单个接口响应类型
   */
  generateEndpointResponseType(endpoint) {
    const successResponse = Object.entries(endpoint.responses || {})
      .find(([code]) => code.startsWith('2'));
    
    if (!successResponse) return null;
    
    const [statusCode, response] = successResponse;
    const schema = response.content?.['application/json']?.schema;
    
    const typeName = `${this.formatTypeName(endpoint.operationId)}Response`;
    const type = schema ? this.formatTypeForTypeScript(schema) : 'any';
    
    return {
      name: typeName,
      endpoint: endpoint.operationId,
      type: `type ${typeName} = ${type};`,
      description: response.description || endpoint.summary || '',
      statusCode
    };
  }

  /**
   * 生成API函数类型定义
   */
  generateApiFunctionTypes(endpoints, tags) {
    const result = [];
    
    // 按标签分组生成API模块类型
    for (const [tagName, tagEndpoints] of Object.entries(tags)) {
      const moduleName = this.formatModuleName(tagName);
      const functionTypes = [];
      
      for (const endpoint of tagEndpoints) {
        const functionType = this.generateApiFunctionType(endpoint);
        functionTypes.push(functionType);
      }
      
      if (functionTypes.length > 0) {
        result.push({
          module: moduleName,
          interface: this.generateApiModuleInterface(moduleName, functionTypes),
          functions: functionTypes
        });
      }
    }
    
    return result;
  }

  /**
   * 生成API函数类型
   */
  generateApiFunctionType(endpoint) {
    const paramsType = this.generateParamsType(endpoint.parameters);
    const requestBodyType = this.generateRequestBodyType(endpoint.requestBody);
    const responseType = this.generateEndpointResponseType(endpoint);
    
    const hasParams = paramsType !== '{}';
    const hasRequestBody = requestBodyType !== 'void';
    
    const params = [];
    if (hasParams) params.push(`params: ${paramsType}`);
    if (hasRequestBody) params.push(`data: ${requestBodyType}`);
    
    const returnType = responseType ? responseType.name : 'any';
    
    return {
      name: this.formatFunctionName(endpoint.operationId),
      signature: `(${params.join(', ')}): Promise<${returnType}>`,
      description: endpoint.summary || endpoint.description || '',
      deprecated: endpoint.deprecated || false
    };
  }

  /**
   * 生成API模块接口
   */
  generateApiModuleInterface(moduleName, functionTypes) {
    const lines = [];
    lines.push(`interface ${moduleName}Api {`);
    
    for (const func of functionTypes) {
      const comment = func.description ? `\n  // ${func.description}` : '';
      const deprecated = func.deprecated ? '\n  /** @deprecated */' : '';
      
      if (deprecated) lines.push(deprecated);
      if (comment) lines.push(comment);
      lines.push(`  ${func.name}: ${func.signature};`);
    }
    
    lines.push('}');
    return lines.join('\n');
  }

  /**
   * 生成枚举类型定义
   */
  generateEnumTypes(models) {
    const result = [];
    
    for (const [modelName, model] of Object.entries(models)) {
      const properties = model.properties || {};
      
      for (const [propName, prop] of Object.entries(properties)) {
        if (prop.enum && prop.enum.length > 0) {
          const enumName = `${modelName}${this.formatTypeName(propName)}Enum`;
          const enumDef = this.generateEnumDefinition(enumName, prop.enum);
          
          result.push({
            name: enumName,
            definition: enumDef,
            values: prop.enum,
            description: prop.description || ''
          });
        }
      }
    }
    
    // 检查参数中的枚举
    const endpoints = this.parser.getAllEndpoints();
    for (const endpoint of endpoints) {
      for (const param of endpoint.parameters) {
        if (param.schema?.enum && param.schema.enum.length > 0) {
          const enumName = `${this.formatTypeName(endpoint.operationId)}${this.formatTypeName(param.name)}Enum`;
          const enumDef = this.generateEnumDefinition(enumName, param.schema.enum);
          
          result.push({
            name: enumName,
            definition: enumDef,
            values: param.schema.enum,
            description: param.description || ''
          });
        }
      }
    }
    
    return result;
  }

  /**
   * 生成枚举定义
   */
  generateEnumDefinition(enumName, values) {
    const lines = [];
    lines.push(`enum ${enumName} {`);
    
    for (const value of values) {
      const key = this.formatEnumKey(value);
      lines.push(`  ${key} = '${value}',`);
    }
    
    lines.push('}');
    return lines.join('\n');
  }

  /**
   * 生成工具类型定义
   */
  generateUtilityTypes() {
    const types = [
      'type ApiResponse<T> = { success: true; data: T; } | { success: false; error: string; code: number; };',
      'type PaginatedResponse<T> = { items: T[]; total: number; page: number; pageSize: number; };',
      'type IdType = string | number;',
      'type DateTimeString = string; // ISO 8601格式',
      'type DateString = string; // YYYY-MM-DD格式',
      'type EmailString = string;',
      'type UUIDString = string;',
      'type FileUpload = File | Blob;'
    ];
    
    return {
      types,
      definition: types.join('\n')
    };
  }

  /**
   * 生成完整类型定义文件内容
   */
  generateTypeDefinitionFile() {
    const models = this.parser.getModels();
    const endpoints = this.parser.getAllEndpoints();
    const tags = this.parser.getEndpointsByTag();
    
    const lines = [];
    
    // 文件头部
    lines.push('// ============================================');
    lines.push(`// ${this.parser.info.title || 'API'} 类型定义`);
    lines.push(`// 版本: ${this.parser.info.version || '1.0.0'}`);
    lines.push(`// 生成时间: ${new Date().toISOString()}`);
    lines.push('// ============================================\n');
    
    // 工具类型
    lines.push('// 工具类型');
    lines.push(this.generateUtilityTypes().definition);
    lines.push('');
    
    // 枚举类型
    const enumTypes = this.generateEnumTypes(models);
    if (enumTypes.length > 0) {
      lines.push('// 枚举类型');
      for (const enumType of enumTypes) {
        lines.push(enumType.definition);
        lines.push('');
      }
    }
    
    // 模型类型
    const modelTypes = this.generateModelTypes(models);
    if (modelTypes.length > 0) {
      lines.push('// 数据模型类型');
      for (const modelType of modelTypes) {
        lines.push(modelType.interface);
        lines.push('');
      }
    }
    
    // 请求类型
    const requestTypes = this.generateRequestTypes(endpoints);
    if (requestTypes.length > 0) {
      lines.push('// 请求参数类型');
      for (const requestType of requestTypes) {
        if (requestType) {
          lines.push(requestType.type);
          lines.push('');
        }
      }
    }
    
    // 响应类型
    const responseTypes = this.generateResponseTypes(endpoints);
    if (responseTypes.length > 0) {
      lines.push('// 响应数据类型');
      for (const responseType of responseTypes) {
        if (responseType) {
          lines.push(responseType.type);
          lines.push('');
        }
      }
    }
    
    // API模块类型
    const apiTypes = this.generateApiFunctionTypes(endpoints, tags);
    if (apiTypes.length > 0) {
      lines.push('// API模块类型');
      for (const apiType of apiTypes) {
        lines.push(apiType.interface);
        lines.push('');
      }
    }
    
    // 导出声明
    lines.push('// 导出声明');
    lines.push('declare module \'@/services/api\' {');
    lines.push('  export interface ApiClient {');
    
    for (const apiType of apiTypes) {
      lines.push(`    ${apiType.module}Api: ${apiType.module}Api;`);
    }
    
    lines.push('  }');
    lines.push('}');
    
    return lines.join('\n');
  }

  /**
   * 为TypeScript格式化类型
   */
  formatTypeForTypeScript(schema) {
    // 使用解析器的类型格式化，但确保TypeScript兼容
    const type = this.parser.getTypeFromSchema(schema);
    
    // 确保类型是TypeScript兼容的
    if (type === 'string' || type === 'number' || type === 'boolean' || type === 'object') {
      return type;
    }
    
    if (type.startsWith('Array<')) {
      return type;
    }
    
    if (type.startsWith('{ ') || type.startsWith('Record<')) {
      return type;
    }
    
    if (type.includes(' | ')) {
      return type;
    }
    
    // 可能是模型引用
    return type;
  }

  /**
   * 格式化类型名称
   */
  formatTypeName(name) {
    if (!name) return 'Unknown';
    
    return name
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
      .replace(/^([a-z])/, (match) => match.toUpperCase());
  }

  /**
   * 格式化函数名
   */
  formatFunctionName(operationId) {
    if (!operationId) return 'apiCall';
    
    return operationId
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .map((word, index) => {
        if (index === 0) return word.charAt(0).toLowerCase() + word.slice(1);
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join('')
      .replace(/([a-z])([A-Z])/g, '$1$2')
      .replace(/\s+/g, '');
  }

  /**
   * 格式化模块名
   */
  formatModuleName(tagName) {
    return this.formatTypeName(tagName);
  }

  /**
   * 格式化枚举键
   */
  formatEnumKey(value) {
    if (typeof value === 'string') {
      // 转换为大写蛇形命名
      return value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/__+/g, '_')
        .replace(/^_|_$/g, '');
    }
    return `VALUE_${value}`;
  }
}

module.exports = TypeGenerator;