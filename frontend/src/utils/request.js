/**
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
  let { 
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
  const url = new URL(`${baseUrl}${path}`);
  
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
          throw new Error(`参数验证失败：未定义的参数 "${key}"`);
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
