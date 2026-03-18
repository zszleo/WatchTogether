/**
 * 自动化接口代码生成工具主入口
 * 根据 OpenAPI 文档生成前端 API 调用代码
 */

import { readConfig } from './config.js';
import { fetchOpenAPIDocument } from './openapi-client.js';
import { generateCode } from './code-generator.js';
import { writeFile, checkFileExists } from './utils/file-utils.js';
import { logger } from './utils/logger.js';

/**
 * 主函数
 */
async function main() {
  try {
    logger.info('开始生成接口代码...');

    // 1. 读取配置
    const config = readConfig();
    logger.debug('配置已加载', config);

    // 2. 获取 OpenAPI 文档
    logger.info(`正在获取 OpenAPI 文档: ${config.openapiUrl}`);
    const openAPIDoc = await fetchOpenAPIDocument(config.openapiUrl);
    logger.info('OpenAPI 文档获取成功');

    // 3. 生成代码
    logger.info('正在生成代码...');
    const generatedFiles = await generateCode(openAPIDoc, config);
    logger.info('代码生成完成');

    // 4. 写入文件
    logger.info('正在写入文件...');
    for (const file of generatedFiles) {
      const filePath = `${config.outputDir}/${file.filename}`;
      await writeFile(filePath, file.content);
      logger.info(`已生成文件: ${filePath}`);
    }

    // 5. 初始化 request.js（如果需要）
    if (config.initRequestFile) {
      const requestFilePath = `${config.utilsDir}/${config.requestFileName}`;
      const exists = await checkFileExists(requestFilePath);
      if (!exists) {
        const requestFileContent = `/**
 * 通用API请求方法
 * @param {string} path - 请求路径
 * @param {Object} options - 请求选项
 * @param {string} options.method - HTTP方法
 * @param {Object} options.params - 查询参数
 * @param {Object} options.data - 请求体数据
 * @param {Object} options.headers - 请求头
 * @param {string[]} options.allowedParams - 允许的参数列表（可选）
 * @param {boolean} options.strictMode - 严格模式（可选）
 * @param {Object} options.paramDefinitions - 参数定义（从OpenAPI生成）
 * @param {Function} options.requestInterceptor - 请求拦截器（可选）
 * @param {Function} options.responseInterceptor - 响应拦截器（可选）
 * @returns {Promise} Promise对象
 */
export async function request(path, options = {}) {
  const { 
    method = 'GET', 
    params, 
    data, 
    headers = {},
    allowedParams,
    strictMode = false,
    paramDefinitions = {},
    requestInterceptor,
    responseInterceptor
  } = options;
  
  // 构建完整URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const url = new URL(\`\${baseUrl}\${path}\`);
  
  // 处理查询参数
  if (params) {
    // 确定允许的参数列表
    let allowedKeys = null;
    
    if (allowedParams && Array.isArray(allowedParams)) {
      // 1. 如果指定了 allowedParams，使用它
      allowedKeys = allowedParams;
    } else if (strictMode && paramDefinitions && Object.keys(paramDefinitions).length > 0) {
      // 2. strictMode=true 且未指定 allowedParams，使用 OpenAPI 参数定义
      allowedKeys = Object.keys(paramDefinitions);
    }
    
    if (allowedKeys) {
      // 有过滤逻辑
      Object.keys(params).forEach(key => {
        if (allowedKeys.includes(key)) {
          if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key]);
          }
        } else if (strictMode) {
          // 严格模式：遇到未定义参数抛出错误
          throw new Error(\`参数验证失败：未定义的参数 "\${key}"\`);
        }
        // 非严格模式：忽略未定义参数
      });
    } else {
      // 默认行为：不过滤参数
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });
    }
  }
  
  // 设置请求头
  const defaultHeaders = {
    'Content-Type': 'application/json',
    // 可以添加认证头等
  };
  
  let requestHeaders = { ...defaultHeaders, ...headers };
  
  // 应用请求拦截器
  if (requestInterceptor && typeof requestInterceptor === 'function') {
    const interceptedRequest = requestInterceptor({
      url: url.toString(),
      method,
      headers: requestHeaders,
      body: data ? JSON.stringify(data) : undefined
    });
    
    // 更新请求配置
    if (interceptedRequest.url) url.href = interceptedRequest.url;
    if (interceptedRequest.method) method = interceptedRequest.method;
    if (interceptedRequest.headers) requestHeaders = interceptedRequest.headers;
    if (interceptedRequest.body !== undefined) data = interceptedRequest.body;
  }
  
  // 发送请求
  try {
    const response = await fetch(url.toString(), {
      method,
      headers: requestHeaders,
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }
    
    let result = await response.json();
    
    // 应用响应拦截器
    if (responseInterceptor && typeof responseInterceptor === 'function') {
      result = responseInterceptor(result);
    }
    
    return result;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

export default request;
`;
        await writeFile(requestFilePath, requestFileContent);
        logger.info(`已创建通用请求方法文件: ${requestFilePath}`);
      }
    }

    logger.info('接口代码生成完成！');
  } catch (error) {
    logger.error('接口代码生成失败:', error.message);
    process.exit(1);
  }
}

// 如果是直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };