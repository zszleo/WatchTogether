/**
 * 配置管理模块
 * 负责读取和管理工具配置，支持命令行参数、环境变量和配置文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import minimist from 'minimist';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 默认配置
 */
const DEFAULT_CONFIG = {
  openapiUrl: 'http://localhost:18080/api-docs',
  outputDir: '../../src/services',
  utilsDir: '../../src/utils',
  apiFileName: 'api.js',
  reqFileName: 'req.js',
  respFileName: 'resp.js',
  requestFileName: 'request.js',
  basePath: '',
  tags: [],
  filterUnknownParams: false,
  strictMode: false,
  initRequestFile: true,
  excludeTags: [],
  customTemplates: null
};

/**
 * 配置文件名称
 */
const CONFIG_FILE_NAME = '.openapirc.json';

/**
 * 获取配置文件路径
 * @returns {string} 配置文件完整路径
 */
function getConfigFilePath() {
  const cwd = process.cwd();
  return path.join(cwd, CONFIG_FILE_NAME);
}

/**
 * 解析命令行参数
 * @returns {Object} 命令行参数
 */
function parseArgs() {
  const rawArgv = process.argv.slice(2);
  const argv = minimist(rawArgv, {
    string: [
      'openapi-url',
      'output-dir',
      'utils-dir',
      'api-file-name',
      'req-file-name',
      'resp-file-name',
      'request-file-name',
      'base-path',
      'tags'
    ],
    boolean: [
      'filter-unknown-params',
      'strict-mode',
      'init-request-file',
      'help',
      'version'
    ],
    alias: {
      u: 'openapi-url',
      o: 'output-dir',
      h: 'help',
      v: 'version'
    },
    unknown: (param) => {
      if (param.startsWith('--')) {
        console.warn(`Warning: Unknown option: ${param}`);
        return false;
      }
      return true;
    }
  });

  // 获取原始参数列表，用于判断哪些参数被显式传递
  const explicitArgs = new Set();
  for (let i = 0; i < rawArgv.length; i++) {
    const arg = rawArgv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-/g, '');
      explicitArgs.add(key);
      if (rawArgv[i + 1] && !rawArgv[i + 1].startsWith('--')) {
        i++;
      }
    } else if (arg.startsWith('-') && !arg.startsWith('--')) {
      // 处理短参数如 -u, -o
      const shortForms = { u: 'openapi-url', o: 'output-dir', h: 'help', v: 'version' };
      for (const char of arg.slice(1)) {
        if (shortForms[char]) {
          explicitArgs.add(shortForms[char].replace(/-/g, ''));
        }
      }
    }
  }

  const result = {};

  // String 参数：只在显式传递时才设置
  if (explicitArgs.has('openapiurl')) result.openapiUrl = argv['openapi-url'];
  if (explicitArgs.has('outputdir')) result.outputDir = argv['output-dir'];
  if (explicitArgs.has('utilsdir')) result.utilsDir = argv['utils-dir'];
  if (explicitArgs.has('apifilename')) result.apiFileName = argv['api-file-name'];
  if (explicitArgs.has('reqfilename')) result.reqFileName = argv['req-file-name'];
  if (explicitArgs.has('respfilename')) result.respFileName = argv['resp-file-name'];
  if (explicitArgs.has('requestfilename')) result.requestFileName = argv['request-file-name'];
  if (explicitArgs.has('basepath')) result.basePath = argv['base-path'];
  if (explicitArgs.has('tags')) {
    result.tags = argv['tags'] ? (Array.isArray(argv['tags']) ? argv['tags'] : [argv['tags']]) : undefined;
  }

  // Boolean 参数：只在显式传递时才设置
  if (explicitArgs.has('filterunknownparams')) result.filterUnknownParams = argv['filter-unknown-params'];
  if (explicitArgs.has('strictmode')) result.strictMode = argv['strict-mode'];
  if (explicitArgs.has('initrequestfile')) result.initRequestFile = argv['init-request-file'];
  if (explicitArgs.has('help')) result.help = argv.help;
  if (explicitArgs.has('version')) result.version = argv.version;

  return result;
}

/**
 * 读取配置文件
 * @param {string} configPath - 配置文件路径
 * @returns {Object} 配置对象
 */
function readConfigFile(configPath = CONFIG_FILE_NAME) {
  const fullPath = getConfigFilePath();
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`警告：无法读取配置文件 ${fullPath}: ${error.message}`);
    return null;
  }
}

/**
 * 读取环境变量配置
 * @returns {Object} 环境变量配置
 */
function readEnvConfig() {
  return {
    openapiUrl: process.env.OPENAPI_URL,
    outputDir: process.env.OPENAPI_OUTPUT_DIR,
    utilsDir: process.env.OPENAPI_UTILS_DIR,
    apiFileName: process.env.OPENAPI_API_FILE_NAME,
    reqFileName: process.env.OPENAPI_REQ_FILE_NAME,
    respFileName: process.env.OPENAPI_RESP_FILE_NAME,
    requestFileName: process.env.OPENAPI_REQUEST_FILE_NAME,
    basePath: process.env.OPENAPI_BASE_PATH,
    tags: process.env.OPENAPI_TAGS ? process.env.OPENAPI_TAGS.split(',').map(t => t.trim()) : undefined,
    filterUnknownParams: process.env.OPENAPI_FILTER_UNKNOWN_PARAMS === 'true' ? true : 
                         process.env.OPENAPI_FILTER_UNKNOWN_PARAMS === 'false' ? false : undefined,
    strictMode: process.env.OPENAPI_STRICT_MODE === 'true' ? true : 
               process.env.OPENAPI_STRICT_MODE === 'false' ? false : undefined,
    initRequestFile: process.env.OPENAPI_INIT_REQUEST_FILE === 'false' ? false : 
                    process.env.OPENAPI_INIT_REQUEST_FILE === 'true' ? true : undefined
  };
}

/**
 * 合并配置（优先级：命令行 > 环境变量 > 配置文件 > 默认配置）
 * @param  {...Object} configs - 配置对象，按优先级从高到低排列
 * @returns {Object} 合并后的配置
 */
function mergeConfigs(...configs) {
  const result = { ...DEFAULT_CONFIG };
  
  configs.forEach(config => {
    if (config) {
      Object.keys(config).forEach(key => {
        if (config[key] !== undefined && config[key] !== null) {
          result[key] = config[key];
        }
      });
    }
  });
  
  return result;
}

/**
 * 验证配置
 * @param {Object} config - 配置对象
 * @throws {Error} 配置验证失败
 */
function validateConfig(config) {
  if (!config.openapiUrl) {
    throw new Error('配置错误：openapiUrl 不能为空');
  }

  if (!config.outputDir) {
    throw new Error('配置错误：outputDir 不能为空');
  }

  if (config.openapiUrl && typeof config.openapiUrl !== 'string') {
    throw new Error('配置错误：openapiUrl 必须是字符串');
  }

  if (config.outputDir && typeof config.outputDir !== 'string') {
    throw new Error('配置错误：outputDir 必须是字符串');
  }

  if (config.tags && !Array.isArray(config.tags)) {
    throw new Error('配置错误：tags 必须是数组');
  }

  // 验证 URL 格式
  try {
    new URL(config.openapiUrl);
  } catch (error) {
    throw new Error(`配置错误：openapiUrl 格式无效: ${config.openapiUrl}`);
  }

  return true;
}

/**
 * 读取并合并所有配置
 * @returns {Object} 最终配置
 */
export function readConfig() {
  const argsConfig = parseArgs();
  
  if (argsConfig.help) {
    showHelp();
    process.exit(0);
  }
  
  if (argsConfig.version) {
    showVersion();
    process.exit(0);
  }
  
  const envConfig = readEnvConfig();
  const fileConfig = readConfigFile();
  
  const config = mergeConfigs(DEFAULT_CONFIG, fileConfig, envConfig, argsConfig);
  
  validateConfig(config);
  
  return config;
}

/**
 * 获取默认配置
 * @returns {Object} 默认配置
 */
export function getDefaultConfig() {
  return { ...DEFAULT_CONFIG };
}

/**
 * 显示帮助信息
 */
export function showHelp() {
  console.log(`
OpenAPI to Frontend API Code Generator

Usage: node index.js [options]

Options:
  --openapi-url, -u <url>       OpenAPI文档URL (default: http://localhost:18080/api-docs)
  --output-dir, -o <dir>         输出目录 (default: ../../src/services)
  --utils-dir <dir>             工具类目录 (default: ../../src/utils)
  --api-file-name <name>        API文件名 (default: api.js)
  --req-file-name <name>        请求参数文件名 (default: req.js)
  --resp-file-name <name>       响应参数文件名 (default: resp.js)
  --request-file-name <name>    request方法文件名 (default: request.js)
  --base-path <path>            API基础路径
  --tags <tag1,tag2>           指定要生成的tag（逗号分隔）
  --filter-unknown-params       过滤未定义参数
  --strict-mode                 严格模式：拒绝未定义参数
  --init-request-file           初始化request.js文件 (default: true)
  --help, -h                    显示帮助信息
  --version, -v                 显示版本信息

Configuration:
  配置可以通过以下方式设置（优先级从低到高）：
  1. 默认配置
  2. .openapirc.json 配置文件
  3. 环境变量 (OPENAPI_*)
  4. 命令行参数

Examples:
  node index.js
  node index.js --openapi-url http://localhost:8080/api-docs
  node index.js -u http://localhost:8080/api-docs -o ./src/services
  node index.js --tags User,Session
  node index.js --strict-mode --filter-unknown-params
`);
}

/**
 * 显示版本信息
 */
export function showVersion() {
  const packagePath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  console.log(`openapi-generator v${packageJson.version}`);
}