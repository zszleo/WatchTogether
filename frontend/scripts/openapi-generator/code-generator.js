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
      const successResponse = responses['200'] || responses['201'] || responses['default'];
      
      if (!successResponse) continue;
      
      const respObj = {
        name: `${operationId}Response`,
        description: `${operation.summary || operationId} 响应数据`,
        properties: {}
      };
      
      if (successResponse.content && successResponse.content['application/json']) {
        const schema = successResponse.content['application/json'].schema;
        if (schema) {
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
          }
        }
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
    const className = `${capitalize(sanitizeIdentifier(group.tag))}Api`;
    const operations = [];
    
    for (const op of group.operations) {
      const funcName = camelCase(op.operationId.replace(/^(get|post|put|delete|patch)/i, ''));
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
      
      // 生成 JSDoc
      let jsdoc = `/**\n * ${op.summary || op.operationId}\n`;
      if (op.description) {
        jsdoc += ` * ${op.description}\n`;
      }
      jsdoc += ` * @param {Object} options - 请求选项\n`;
      
      for (const p of pathParams) {
        jsdoc += ` * @param {${p.schema?.type || 'string'}} options.${p.name} - ${p.description || p.name}\n`;
      }
      if (queryParams.length > 0) {
        jsdoc += ` * @param {Object} options.queryParams - 查询参数\n`;
      }
      if (hasBody) {
        jsdoc += ` * @param {Object} options.data - 请求体数据\n`;
      }
      jsdoc += ` * @returns {Promise} Promise对象\n */`;
      
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
        requestBody: op.requestBody
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
      if (op.hasPathParams) {
        requestOptions.push('params: { ' + (op.pathParamDefs || []).map(p => p.name).join(', ') + ' }');
      }
      if (op.hasQueryParams) {
        requestOptions.push('params: { ...params, ...queryParams }');
      }
      if (op.hasBody) {
        requestOptions.push('data');
      }
      
      content += `    return request(path, { method: '${op.method}'${requestOptions.length > 0 ? ', ' + requestOptions.join(', ') : ''} });\n`;
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
      const required = prop.required ? '必填' : '可选';
      const type = prop.type || 'any';
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
      const type = prop.type || 'any';
      const desc = prop.description ? ` - ${prop.description}` : '';
      content += ` * @property {${type}} ${propName}${desc}\n`;
    }
    
    content += ` */\n`;
  }
  
  return content;
}

export { groupAPIsByTag, generateRequestObjects, generateResponseObjects, generateAPIFunctions };
