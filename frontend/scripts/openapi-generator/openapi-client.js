/**
 * OpenAPI 文档获取与解析模块
 */

import axios from 'axios';

const OPENAPI_VERSION_3 = '3.0';
const SUPPORTED_VERSIONS = ['3.0.0', '3.0.1', '3.0.2', '3.0.3', '3.1.0'];

/**
 * 验证 OpenAPI 文档版本
 * @param {Object} doc - OpenAPI 文档
 * @throws {Error} 版本不支持
 */
function validateOpenAPIVersion(doc) {
  if (!doc.openapi) {
    throw new Error('无效的 OpenAPI 文档：缺少 openapi 字段');
  }

  const version = doc.openapi.split('.')[0] + '.' + doc.openapi.split('.')[1];
  if (version !== OPENAPI_VERSION_3) {
    throw new Error(`不支持的 OpenAPI 版本: ${doc.openapi}，仅支持 OpenAPI 3.x`);
  }
}

/**
 * 从 URL 获取 OpenAPI 文档
 * @param {string} url - OpenAPI 文档 URL
 * @returns {Promise<Object>} OpenAPI 文档对象
 */
export async function fetchOpenAPIDocument(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    const doc = response.data;

    validateOpenAPIVersion(doc);

    return parseOpenAPIDocument(doc);
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      throw new Error(`无法连接到 OpenAPI 文档地址: ${url}`);
    }
    if (error.response) {
      throw new Error(`获取 OpenAPI 文档失败: HTTP ${error.response.status}`);
    }
    throw new Error(`获取 OpenAPI 文档失败: ${error.message}`);
  }
}

/**
 * 从对象解析 OpenAPI 文档
 * @param {Object} doc - OpenAPI 文档对象
 * @returns {Object} 解析后的文档
 */
export function parseOpenAPIDocument(doc) {
  validateOpenAPIVersion(doc);

  const parsed = {
    openapi: doc.openapi,
    info: doc.info || {},
    servers: doc.servers || [],
    basePath: '',
    paths: {},
    components: doc.components || {},
    tags: doc.tags || []
  };

  // 提取 basePath
  if (doc.servers && doc.servers.length > 0) {
    const serverUrl = doc.servers[0].url;
    try {
      const url = new URL(serverUrl);
      parsed.basePath = url.pathname;
    } catch {
      parsed.basePath = '';
    }
  }

  // 解析 paths
  parsed.paths = parsePaths(doc.paths || {});

  return parsed;
}

/**
 * 解析 paths
 * @param {Object} paths - OpenAPI paths
 * @returns {Object} 解析后的 paths
 */
function parsePaths(paths) {
  const result = {};

  for (const [path, pathItem] of Object.entries(paths)) {
    const operations = {};

    const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

    for (const method of methods) {
      if (pathItem[method]) {
        operations[method] = parseOperation(pathItem[method], method, path);
      }
    }

    result[path] = {
      summary: pathItem.summary,
      description: pathItem.description,
      parameters: parseParameters(pathItem.parameters || []),
      ...operations
    };
  }

  return result;
}

/**
 * 解析操作
 * @param {Object} operation - OpenAPI operation
 * @param {string} method - HTTP 方法
 * @param {string} path - 路径
 * @returns {Object} 解析后的操作
 */
function parseOperation(operation, method, path) {
  return {
    operationId: operation.operationId || generateOperationId(method, path),
    summary: operation.summary,
    description: operation.description,
    tags: operation.tags || [],
    deprecated: operation.deprecated || false,
    parameters: parseParameters(operation.parameters || []),
    requestBody: parseRequestBody(operation.requestBody),
    responses: parseResponses(operation.responses || {})
  };
}

/**
 * 生成 operationId
 * @param {string} method - HTTP 方法
 * @param {string} path - 路径
 * @returns {string} operationId
 */
function generateOperationId(method, path) {
  const parts = path.split('/').filter(Boolean);
  const resource = parts[parts.length - 1] || 'resource';
  return `${method}${capitalize(resource)}`;
}

/**
 * 首字母大写
 * @param {string} str - 字符串
 * @returns {string} 处理后的字符串
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 解析参数
 * @param {Array} parameters - OpenAPI 参数数组
 * @returns {Array} 解析后的参数
 */
function parseParameters(parameters) {
  return parameters.map(param => {
    const parsed = {
      name: param.name,
      in: param.in,
      description: param.description,
      required: param.required || false,
      deprecated: param.deprecated || false,
      allowEmptyValue: param.allowEmptyValue || false
    };

    if (param.schema) {
      parsed.schema = parseSchema(param.schema);
    }

    if (param.example) {
      parsed.example = param.example;
    }

    return parsed;
  });
}

/**
 * 解析请求体
 * @param {Object} requestBody - OpenAPI requestBody
 * @returns {Object|null} 解析后的请求体
 */
function parseRequestBody(requestBody) {
  if (!requestBody) {
    return null;
  }

  const parsed = {
    description: requestBody.description,
    required: requestBody.required || false,
    content: {}
  };

  if (requestBody.content) {
    for (const [mediaType, mediaTypeObj] of Object.entries(requestBody.content)) {
      parsed.content[mediaType] = {
        schema: mediaTypeObj.schema ? parseSchema(mediaTypeObj.schema) : null,
        example: mediaTypeObj.example
      };
    }
  }

  return parsed;
}

/**
 * 解析响应
 * @param {Object} responses - OpenAPI responses
 * @returns {Object} 解析后的响应
 */
function parseResponses(responses) {
  const result = {};

  for (const [statusCode, response] of Object.entries(responses)) {
    const parsed = {
      description: response.description,
      content: {}
    };

    if (response.content) {
      for (const [mediaType, mediaTypeObj] of Object.entries(response.content)) {
        parsed.content[mediaType] = {
          schema: mediaTypeObj.schema ? parseSchema(mediaTypeObj.schema) : null,
          example: mediaTypeObj.example
        };
      }
    }

    result[statusCode] = parsed;
  }

  return result;
}

/**
 * 解析 schema
 * @param {Object} schema - OpenAPI schema
 * @returns {Object} 解析后的 schema
 */
export function parseSchema(schema) {
  if (!schema) {
    return null;
  }

  const parsed = {
    type: schema.type,
    description: schema.description,
    format: schema.format,
    nullable: schema.nullable,
    readOnly: schema.readOnly,
    writeOnly: schema.writeOnly,
    default: schema.default,
    example: schema.example
  };

  // 枚举
  if (schema.enum) {
    parsed.enum = schema.enum;
  }

  // 数组
  if (schema.type === 'array' && schema.items) {
    parsed.items = parseSchema(schema.items);
  }

  // 对象
  if (schema.type === 'object' || schema.properties) {
    parsed.properties = {};
    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        parsed.properties[propName] = parseSchema(propSchema);
      }
    }
    if (schema.required && Array.isArray(schema.required)) {
      parsed.required = schema.required;
    }
  }

  // 引用
  if (schema.$ref) {
    parsed.$ref = schema.$ref;
    parsed.refName = extractRefName(schema.$ref);
  }

  // 嵌套组合
  if (schema.allOf) {
    parsed.allOf = schema.allOf.map(s => parseSchema(s));
  }
  if (schema.oneOf) {
    parsed.oneOf = schema.oneOf.map(s => parseSchema(s));
  }
  if (schema.anyOf) {
    parsed.anyOf = schema.anyOf.map(s => parseSchema(s));
  }

  // 特定类型属性
  if (schema.type === 'string') {
    if (schema.minLength !== undefined) parsed.minLength = schema.minLength;
    if (schema.maxLength !== undefined) parsed.maxLength = schema.maxLength;
    if (schema.pattern) parsed.pattern = schema.pattern;
  }

  if (schema.type === 'number' || schema.type === 'integer') {
    if (schema.minimum !== undefined) parsed.minimum = schema.minimum;
    if (schema.maximum !== undefined) parsed.maximum = schema.maximum;
  }

  return parsed;
}

/**
 * 从 $ref 提取名称
 * @param {string} ref - $ref 值
 * @returns {string} 提取的名称
 */
function extractRefName(ref) {
  const parts = ref.split('/');
  return parts[parts.length - 1];
}

/**
 * 获取组件 schema
 * @param {Object} doc - 解析后的文档
 * @param {string} name - schema 名称
 * @returns {Object|null} schema 对象
 */
export function getComponentSchema(doc, name) {
  if (!doc.components || !doc.components.schemas || !doc.components.schemas[name]) {
    return null;
  }
  return parseSchema(doc.components.schemas[name]);
}

/**
 * 解析所有组件 schemas
 * @param {Object} doc - 解析后的文档
 * @returns {Object} schemas 映射
 */
export function parseAllSchemas(doc) {
  const schemas = {};

  if (doc.components && doc.components.schemas) {
    for (const [name, schema] of Object.entries(doc.components.schemas)) {
      schemas[name] = parseSchema(schema);
    }
  }

  return schemas;
}
