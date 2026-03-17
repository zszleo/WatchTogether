/**
 * OpenAPI文档获取模块
 * 支持从远程URL或本地文件获取OpenAPI文档
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const url = require('url');

/**
 * 获取OpenAPI文档
 * @param {string} source - OpenAPI文档源（URL或文件路径）
 * @param {Object} options - 配置选项
 * @returns {Promise<Object>} OpenAPI文档对象
 */
async function fetchOpenAPI(source, options = {}) {
  const {
    timeout = 30000,
    headers = {},
    proxy = null,
    cache = false,
    cacheFile = '.openapi-cache.json'
  } = options;

  // 检查缓存
  if (cache && fs.existsSync(cacheFile)) {
    try {
      const cachedData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      const cacheTime = cachedData.timestamp;
      const now = Date.now();
      // 缓存有效期1小时
      if (now - cacheTime < 3600000) {
        console.log(`使用缓存的OpenAPI文档（${new Date(cacheTime).toLocaleString()}）`);
        return cachedData.data;
      }
    } catch (error) {
      console.warn('读取缓存失败:', error.message);
    }
  }

  let openapiData;
  
  // 判断源类型
  if (source.startsWith('http://') || source.startsWith('https://')) {
    openapiData = await fetchFromUrl(source, { timeout, headers, proxy });
  } else {
    openapiData = await fetchFromFile(source);
  }

  // 保存缓存
  if (cache) {
    try {
      const cacheData = {
        timestamp: Date.now(),
        data: openapiData,
        source
      };
      fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2), 'utf8');
      console.log('OpenAPI文档缓存已保存');
    } catch (error) {
      console.warn('保存缓存失败:', error.message);
    }
  }

  return openapiData;
}

/**
 * 从URL获取OpenAPI文档
 */
async function fetchFromUrl(sourceUrl, options) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new url.URL(sourceUrl);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'OpenAPI-Generator/1.0.0',
        ...options.headers
      },
      timeout: options.timeout
    };

    // 代理配置（简化版）
    if (options.proxy) {
      console.warn('代理配置暂未实现');
    }

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const contentType = res.headers['content-type'] || '';
            let result;
            
            if (contentType.includes('application/json') || data.trim().startsWith('{')) {
              result = JSON.parse(data);
            } else if (contentType.includes('application/yaml') || contentType.includes('text/yaml')) {
              // 简化的YAML解析（实际应使用yaml库）
              result = parseYaml(data);
            } else {
              // 尝试自动检测
              try {
                result = JSON.parse(data);
              } catch {
                result = parseYaml(data);
              }
            }
            
            resolve(result);
          } catch (error) {
            reject(new Error(`解析响应数据失败: ${error.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`请求失败: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`请求超时 (${options.timeout}ms)`));
    });

    req.end();
  });
}

/**
 * 从文件获取OpenAPI文档
 */
async function fetchFromFile(filePath) {
  return new Promise((resolve, reject) => {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    
    if (!fs.existsSync(absolutePath)) {
      reject(new Error(`文件不存在: ${absolutePath}`));
      return;
    }

    fs.readFile(absolutePath, 'utf8', (error, data) => {
      if (error) {
        reject(new Error(`读取文件失败: ${error.message}`));
        return;
      }

      try {
        let result;
        
        if (filePath.endsWith('.json') || data.trim().startsWith('{')) {
          result = JSON.parse(data);
        } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
          result = parseYaml(data);
        } else {
          // 尝试自动检测
          try {
            result = JSON.parse(data);
          } catch {
            result = parseYaml(data);
          }
        }
        
        resolve(result);
      } catch (error) {
        reject(new Error(`解析文件失败: ${error.message}`));
      }
    });
  });
}

/**
 * 简化的YAML解析函数
 * 注意：实际项目应使用'yaml'或'js-yaml'库
 */
function parseYaml(yamlString) {
  // 简化实现 - 实际应使用yaml库
  try {
    // 尝试解析为JSON（如果YAML是简单对象）
    const jsonLike = yamlString
      .replace(/:(\s*)(?=\S)/g, ':$1"')
      .replace(/"(\s*):/g, '"$1:');
    return JSON.parse(`{${jsonLike}}`);
  } catch {
    throw new Error('YAML解析需要安装yaml库，请运行: npm install yaml');
  }
}

module.exports = {
  fetchOpenAPI,
  fetchFromUrl,
  fetchFromFile
};