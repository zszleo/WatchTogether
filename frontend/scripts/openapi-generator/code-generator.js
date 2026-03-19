/**
 * 代码生成器模块
 * 将 OpenAPI 定义转换为前端代码
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseAllSchemas } from './openapi-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 主生成函数
 * @param {Object} doc - OpenAPI 文档
 * @param {Object} config - 配置
 * @returns {Promise<Array>} 生成的文件列表
 */
export async function generateCode(doc, config) {
  const schemas = parseAllSchemas(doc);
  
  // 按 tag 分组 API
  const apiGroups = groupAPIsByTag(doc, config);
  
  // 生成请求参数对象
  const requestObjects = generateRequestObjects(doc, config);
  
  // 生成响应参数对象
  const responseObjects = generateResponseObjects(doc, config);
  
  // 生成 API 函数
  const apiFunctions = generateAPIFunctions(doc, config);
  
  // 渲染模板
  const apiContent = renderApiTemplate(apiFunctions, config);
  const reqContent = renderReqTemplate(requestObjects, config);
  const respContent = renderRespTemplate(responseObjects, config);
  
  return [
    { filename: config.apiFileName, content: apiContent },
    { filename: config.reqFileName, content: reqContent },
    { filename: config.respFileName, content: respContent }
  ];
}

/**
 * 按 tag 分组 API
 * @param {Object} doc - OpenAPI 文档
 * @param {Object} config - 配置
 * @returns {Object} 分组后的 API
 */
function groupAPIsByTag(doc, config) {
  const groups = {};
  const defaultGroup = { tag: 'Default', operations: [] };
  
  for (const [path, pathItem] of Object.entries(doc.paths)) {
    const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
    
    for (const method of methods) {
      if (!pathItem[method]) continue;
      
      const operation = pathItem[method];
      const tags = operation.tags && operation.tags.length > 0 ? operation.tags : ['Default'];
      
      for (const tag of tags) {
        if (!groups[tag]) {
          groups[tag] = { tag, operations: [] };
        }
        
        groups[tag].operations.push({
          path,
          method,
          operationId: operation.operationId || generateOperationId(method, path),
          summary: operation.summary,
          description: operation.description,
          parameters: operation.parameters || [],
          requestBody: operation.requestBody,
          responses: operation.responses,
          deprecated: operation.deprecated
        });
      }
    }
  }
  
  // 过滤指定 tags
  if (config.tags && config.tags.length > 0) {
    for (const tag of Object.keys(groups)) {
      if (!config.tags.includes(tag)) {
        delete groups[tag];
      }
    }
  }
  
  return groups;
}

/**
 * 生成 operationId
 */
function generateOperationId(method, path) {
  const parts = path.split('/').filter(Boolean);
  const resource = parts[parts.length - 1] || 'resource';
  return `${method}${capitalize(resource)}`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function camelCase(str) {
  return str.replace(/[-_](\w)/g, (_, c) => c ? c.toUpperCase() : '');
}

function sanitizeIdentifier(str) {
  // 移除非字母数字字符，只保留字母、数字、下划线
  // 中文保留
  return str.replace(/[^\w\u4e00-\u9fa5]/g, '');
}

function extractResourceFromPaths(paths) {
  if (!paths || paths.length === 0) return 'Default';
  
  // 统计路径段出现频率
  const segmentCounts = {};
  const apiSegmentCounts = {};
  
  for (const path of paths) {
    // 移除路径参数，如 {sessionId}
    const cleanPath = path.replace(/\{[^}]+\}/g, '');
    const segments = cleanPath.split('/').filter(segment => segment.length > 0);
    
    // 跳过空段和API段
    for (const segment of segments) {
      if (segment === 'api') continue;
      segmentCounts[segment] = (segmentCounts[segment] || 0) + 1;
    }
    
    // 特别记录 /api/ 后的第一个非API段
    for (let i = 0; i < segments.length; i++) {
      if (segments[i] === 'api' && i + 1 < segments.length) {
        const resourceSegment = segments[i + 1];
        if (resourceSegment) {
          apiSegmentCounts[resourceSegment] = (apiSegmentCounts[resourceSegment] || 0) + 1;
        }
        break;
      }
    }
  }
  
  // 优先使用 /api/ 后的资源段
  if (Object.keys(apiSegmentCounts).length > 0) {
    const apiResources = Object.entries(apiSegmentCounts).sort((a, b) => b[1] - a[1]);
    return apiResources[0][0];
  }
  
  // 如果没有找到 /api/ 段，使用最常见的段
  if (Object.keys(segmentCounts).length > 0) {
    const sortedSegments = Object.entries(segmentCounts).sort((a, b) => b[1] - a[1]);
    return sortedSegments[0][0];
  }
  
  return 'Default';
}

function translateTagToClassName(tag, paths) {
  const resourceName = extractResourceFromPaths(paths);
  let className = resourceName;
  className = capitalize(className);
  return className;
}

/**
 * 生成请求参数对象
 */
function generateRequestObjects(doc, config) {
  const objects = {};
  const processed = new Set();
  
  for (const [path, pathItem] of Object.entries(doc.paths)) {
    const methods = ['get', 'post', 'put', 'delete', 'patch'];
    
    for (const method of methods) {
      if (!pathItem[method]) continue;
      
      const operation = pathItem[method];
      const operationId = operation.operationId || generateOperationId(method, path);
      
      if (processed.has(operationId)) continue;
      processed.add(operationId);
      
      const params = operation.parameters || [];
      const requestBody = operation.requestBody;
      
      if (params.length === 0 && !requestBody) continue;
      
      const requestObj = {
        name: `${operationId}Request`,
        description: `${operation.summary || operationId} 请求参数`,
        properties: {}
      };
      
      // 路径参数
      const pathParams = params.filter(p => p.in === 'path');
      for (const param of pathParams) {
        requestObj.properties[param.name] = {
          type: param.schema?.type || 'string',
          description: param.description,
          required: param.required,
          example: param.example
        };
      }
      
      // 查询参数
      const queryParams = params.filter(p => p.in === 'query');
      for (const param of queryParams) {
        requestObj.properties[param.name] = {
          type: param.schema?.type || 'string',
          description: param.description,
          required: param.required,
          example: param.example
        };
      }
      
      // 请求体
      if (requestBody && requestBody.content && requestBody.content['application/json']) {
        const schema = requestBody.content['application/json'].schema;
        if (schema && schema.$ref) {
          requestObj.properties['data'] = {
            type: 'object',
            description: requestBody.description || '请求体数据',
            ref: schema.$ref,
            refName: schema.refName,
            required: requestBody.required
          };
        }
      }
      
      if (Object.keys(requestObj.properties).length > 0) {
        objects[operationId] = requestObj;
      }
    }
  }
  
  return objects;
}

/**
 * 生成响应参数对象
 */
function generateResponseObjects(doc, config) {
  const objects = {};
  const processed = new Set();
  
  for (const [path, pathItem] of Object.entries(doc.paths)) {
    const methods = ['get', 'post', 'put', 'delete', 'patch'];
    
    for (const method of methods) {
      if (!pathItem[method]) continue;
      
      const operation = pathItem[method];
      const operationId = operation.operationId || generateOperationId(method, path);
      
      if (processed.has(operationId)) continue;
      processed.add(operationId);
      
      const responses = operation.responses || {};
      
      // 查找任何成功响应 (2xx) 或 default
      let successResponse = null;
      let successStatusCode = null;
      
      for (const [statusCode, response] of Object.entries(responses)) {
        if (statusCode.startsWith('2') || statusCode === 'default') {
          successResponse = response;
          successStatusCode = statusCode;
          break;
        }
      }
      
      if (!successResponse) continue;
      
      const respObj = {
        name: `${operationId}Response`,
        description: `${operation.summary || operationId} 响应数据`,
        properties: {}
      };
      
      // 查找任何JSON内容
      let jsonContent = null;
      if (successResponse.content) {
        // 优先使用 application/json
        if (successResponse.content['application/json']) {
          jsonContent = successResponse.content['application/json'];
        } else {
          // 查找其他可能的JSON内容类型
          for (const [contentType, content] of Object.entries(successResponse.content)) {
            if (contentType.includes('json') || contentType.includes('application/')) {
              jsonContent = content;
              break;
            }
          }
        }
      }
      
      if (jsonContent && jsonContent.schema) {
        const schema = jsonContent.schema;
        if (schema.$ref) {
          respObj.properties['data'] = {
            type: 'object',
            description: '响应数据',
            ref: schema.$ref,
            refName: schema.refName
          };
        } else if (schema.type === 'array' && schema.items) {
          respObj.properties['data'] = {
            type: 'array',
            description: '响应数据列表',
            items: schema.items.$ref ? { ref: schema.items.$ref, refName: schema.items.refName } : { type: schema.items.type }
          };
        } else if (schema.type === 'object' || schema.properties) {
          respObj.properties['data'] = {
            type: 'object',
            description: '响应数据',
            properties: parseProperties(schema.properties, doc.components?.schemas)
          };
        } else if (schema.type) {
          // 基本类型：string, number, boolean, integer
          respObj.properties['data'] = {
            type: schema.type,
            description: '响应数据'
          };
        }
      } else if (successResponse.description) {
        // 即使没有schema，也创建一个基本响应对象
        respObj.properties['data'] = {
          type: 'any',
          description: successResponse.description || '响应数据'
        };
      }
      
      if (Object.keys(respObj.properties).length > 0) {
        objects[operationId] = respObj;
      }
    }
  }
  
  return objects;
}

/**
 * 解析属性
 */
function parseProperties(properties, schemas) {
  const result = {};
  for (const [name, prop] of Object.entries(properties || {})) {
    if (prop.$ref) {
      result[name] = { type: 'object', ref: prop.$ref, refName: prop.refName };
    } else if (prop.type === 'array' && prop.items) {
      result[name] = {
        type: 'array',
        items: prop.items.$ref ? { ref: prop.items.$ref, refName: prop.items.refName } : { type: prop.items.type }
      };
    } else {
      result[name] = { type: prop.type, description: prop.description };
    }
  }
  return result;
}

/**
 * 生成 API 函数
 */
function generateAPIFunctions(doc, config) {
  const apiGroups = groupAPIsByTag(doc, config);
  const functions = [];
  
  for (const group of Object.values(apiGroups)) {
    // 收集该组所有路径
    const paths = group.operations.map(op => op.path);
    const resourceName = translateTagToClassName(group.tag, paths);
    const className = `${resourceName}Api`;
    const operations = [];
    
    const usedNames = new Set();
    for (const op of group.operations) {
      let funcName = camelCase(op.operationId);
      // 确保首字母小写
      if (funcName[0] === funcName[0].toUpperCase()) {
        funcName = funcName[0].toLowerCase() + funcName.slice(1);
      }
      // 处理冲突：如果名称已使用，添加方法前缀
      let baseName = funcName;
      let suffix = 1;
      while (usedNames.has(funcName)) {
        funcName = `${camelCase(op.method)}${capitalize(baseName)}`;
        if (suffix > 1) {
          funcName += suffix;
        }
        suffix++;
      }
      usedNames.add(funcName);
      const method = op.method.toUpperCase();
      
      // 构建参数
      const params = [];
      const pathParams = op.parameters?.filter(p => p.in === 'path') || [];
      const queryParams = op.parameters?.filter(p => p.in === 'query') || [];
      const hasBody = op.requestBody && op.requestBody.content?.['application/json'];
      
      // 路径参数
      if (pathParams.length > 0) {
        params.push(...pathParams.map(p => p.name));
      }
      
      // 查询参数对象
      if (queryParams.length > 0) {
        params.push('queryParams');
      }
      
      // 请求体
      if (hasBody) {
        params.push('data');
      }
      
      // 请求选项参数
      params.push('options = {}');
      
      // 生成 JSDoc
      let jsdoc = `/**\n * ${op.summary || op.operationId}\n`;
      if (op.description) {
        jsdoc += ` * ${op.description}\n`;
      }

      
      for (const p of pathParams) {
        jsdoc += ` * @param {${p.schema?.type || 'string'}} ${p.name} - ${p.description || p.name}\n`;
      }
      if (queryParams.length > 0) {
        jsdoc += ` * @param {Object} queryParams - 查询参数\n`;
      }
      if (hasBody) {
        jsdoc += ` * @param {Object} data - 请求体数据\n`;
      }
      jsdoc += ` * @param {Object} [options={}] - 请求选项（如headers、timeout等）\n`;
      jsdoc += ` * @returns {Promise} Promise对象\n */`;
      
      // 生成参数定义对象（用于参数过滤和严格模式）
      const paramDefinitions = {};
      queryParams.forEach(p => {
        paramDefinitions[p.name] = {
          type: p.schema?.type || 'string',
          description: p.description || '',
          required: p.required || false,
          in: p.in
        };
      });

      operations.push({
        jsdoc,
        name: funcName,
        method,
        path: op.path,
        params: params.join(', '),
        operationId: op.operationId,
        hasQueryParams: queryParams.length > 0,
        hasPathParams: pathParams.length > 0,
        hasBody: hasBody,
        queryParamDefs: queryParams,
        pathParamDefs: pathParams,
        requestBody: op.requestBody,
        paramDefinitions
      });
    }
    
    if (operations.length > 0) {
      functions.push({ className, operations });
    }
  }
  
  return functions;
}

/**
 * 渲染 api.js 模板
 */
function renderApiTemplate(apiFunctions, config) {
  let content = `/**
 * API 调用函数
 * 由 OpenAPI 代码生成器自动生成
 * 生成时间: ${new Date().toISOString()}
 */

import { request } from '../utils/${config.requestFileName.replace('.js', '')}';
`;
  
  for (const group of apiFunctions) {
    content += `\n/**\n * ${group.className} API\n */\nexport const ${group.className} = {\n`;
    
    for (const op of group.operations) {
      content += `  ${op.jsdoc}\n`;
      content += `  ${op.name}: async (${op.params}) => {\n`;
      
      // 构建路径，处理路径参数
      let pathTemplate = op.path;
      for (const p of op.pathParamDefs || []) {
        pathTemplate = pathTemplate.replace(`{${p.name}}`, `\${${p.name}}`);
      }
      content += `    const path = \`${pathTemplate}\`;\n`;
      
      const requestOptions = [];
      if (op.hasQueryParams) {
        requestOptions.push('params: queryParams');
      }
      if (op.hasBody) {
        requestOptions.push('data');
      }
      
      // 构建完整的请求选项
      const allOptions = [];
      allOptions.push(`method: '${op.method}'`);
      
      if (op.hasQueryParams) {
        allOptions.push('params: queryParams');
      }
      if (op.hasBody) {
        allOptions.push('data');
      }
      
      // 参数过滤和严格模式配置
      if (config.filterUnknownParams && op.hasQueryParams && Object.keys(op.paramDefinitions).length > 0) {
        const allowedParams = Object.keys(op.paramDefinitions);
        allOptions.push(`allowedParams: ${JSON.stringify(allowedParams)}`);
      }
      
      if (config.strictMode) {
        allOptions.push('strictMode: true');
      }
      
      // 参数定义（用于严格模式验证）
      if (Object.keys(op.paramDefinitions).length > 0) {
        allOptions.push(`paramDefinitions: ${JSON.stringify(op.paramDefinitions, null, 2)}`);
      }
      
      // 用户传递的options
      allOptions.push('...options');
      
      content += `    return request(path, { ${allOptions.join(', ')} });\n`;
      content += `  },\n`;
    }
    
    content += `};\n`;
  }
  
  return content;
}

/**
 * 渲染 req.js 模板
 */
function renderReqTemplate(requestObjects, config) {
  let content = `/**
 * 请求参数对象
 * 由 OpenAPI 代码生成器自动生成
 * 生成时间: ${new Date().toISOString()}
 */

`;
  
  for (const req of Object.values(requestObjects)) {
    content += `/**
 * ${req.description}
 * @typedef {Object} ${req.name}
`;
    
    for (const [propName, prop] of Object.entries(req.properties)) {
      let type = prop.type || 'any';
      // 如果有引用，使用引用类型
      if (prop.refName) {
        type = prop.refName;
      } else if (prop.ref) {
        // 从$ref中提取类型名
        const refParts = prop.ref.split('/');
        type = refParts[refParts.length - 1] || 'any';
      }
      
      // 如果是数组且有items.refName
      if (prop.type === 'array' && prop.items) {
        let itemType = 'any';
        if (prop.items.refName) {
          itemType = prop.items.refName;
        } else if (prop.items.ref) {
          const refParts = prop.items.ref.split('/');
          itemType = refParts[refParts.length - 1] || 'any';
        } else if (prop.items.type) {
          itemType = prop.items.type;
        }
        type = `${itemType}[]`;
      }
      
      const required = prop.required ? '必填' : '可选';
      const desc = prop.description ? ` - ${prop.description}` : '';
      content += ` * @property {${type}} ${propName} - ${required}${desc}\n`;
    }
    
    content += ` */\n`;
  }
  
  return content;
}

/**
 * 渲染 resp.js 模板
 */
function renderRespTemplate(responseObjects, config) {
  let content = `/**
 * 响应参数对象
 * 由 OpenAPI 代码生成器自动生成
 * 生成时间: ${new Date().toISOString()}
 */

`;
  
  for (const resp of Object.values(responseObjects)) {
    content += `/**
 * ${resp.description}
 * @typedef {Object} ${resp.name}
`;
    
    for (const [propName, prop] of Object.entries(resp.properties)) {
      let type = prop.type || 'any';
      // 如果有引用，使用引用类型
      if (prop.refName) {
        type = prop.refName;
      } else if (prop.ref) {
        // 从$ref中提取类型名
        const refParts = prop.ref.split('/');
        type = refParts[refParts.length - 1] || 'any';
      }
      
      // 如果是数组且有items.refName
      if (prop.type === 'array' && prop.items) {
        let itemType = 'any';
        if (prop.items.refName) {
          itemType = prop.items.refName;
        } else if (prop.items.ref) {
          const refParts = prop.items.ref.split('/');
          itemType = refParts[refParts.length - 1] || 'any';
        } else if (prop.items.type) {
          itemType = prop.items.type;
        }
        type = `${itemType}[]`;
      }
      
      const desc = prop.description ? ` - ${prop.description}` : '';
      content += ` * @property {${type}} ${propName}${desc}\n`;
    }
    
    content += ` */\n`;
  }
  
  return content;
}

export { groupAPIsByTag, generateRequestObjects, generateResponseObjects, generateAPIFunctions };
