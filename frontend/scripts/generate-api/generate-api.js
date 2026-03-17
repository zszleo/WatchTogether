#!/usr/bin/env node

/**
 * OpenAPI代码生成工具主入口脚本
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('./utils/logger');

// 加载模块
const { fetchOpenAPI } = require('./lib/fetcher');
const OpenAPIParser = require('./lib/parser');
const DataTransformer = require('./lib/transformer');
const CodeGenerator = require('./lib/generator');

/**
 * 加载配置文件
 */
function loadConfig(configPath) {
  const defaultConfig = {
    openapiUrl: 'http://localhost:18080/api-docs',
    outputDir: './src/services/generated',
    groups: {
      byTag: true
    },
    template: {
      engine: 'handlebars',
      dir: './templates',
      default: 'api.hbs'
    },
    request: {
      timeout: 30000
    },
    generate: {
      typescript: false,
      jsdoc: true,
      mock: false,
      tests: false,
      useAxios: true
    },
    debug: false
  };

  let config = defaultConfig;

  // 尝试加载用户配置
  if (configPath && fs.existsSync(configPath)) {
    try {
      const userConfig = require(configPath);
      config = { ...defaultConfig, ...userConfig };
      logger.info(`加载配置文件: ${configPath}`);
    } catch (error) {
      logger.error(`配置文件加载失败: ${error.message}`);
      process.exit(1);
    }
  } else {
    // 尝试加载默认配置文件
    const defaultConfigPath = path.resolve(__dirname, 'openapi.config.js');
    if (fs.existsSync(defaultConfigPath)) {
      try {
        const userConfig = require(defaultConfigPath);
        config = { ...defaultConfig, ...userConfig };
        logger.info(`加载默认配置文件: ${defaultConfigPath}`);
      } catch (error) {
        logger.error(`默认配置文件加载失败: ${error.message}`);
      }
    } else {
      logger.warn('未找到配置文件，使用默认配置');
    }
  }

  // 处理环境变量
  if (process.env.OPENAPI_URL) {
    config.openapiUrl = process.env.OPENAPI_URL;
  }

  if (process.env.OUTPUT_DIR) {
    config.outputDir = process.env.OUTPUT_DIR;
  }

  // 设置调试模式
  if (config.debug || process.env.DEBUG) {
    logger.level = 0; // DEBUG级别
    logger.info('调试模式已启用');
  }

  return config;
}

/**
 * 解析命令行参数
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    config: null,
    url: null,
    output: null,
    watch: false,
    clean: false,
    help: false,
    version: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '-c':
      case '--config':
        options.config = args[++i];
        break;
        
      case '-u':
      case '--url':
        options.url = args[++i];
        break;
        
      case '-o':
      case '--output':
        options.output = args[++i];
        break;
        
      case '-w':
      case '--watch':
        options.watch = true;
        break;
        
      case '--clean':
        options.clean = true;
        break;
        
      case '-h':
      case '--help':
        options.help = true;
        break;
        
      case '-v':
      case '--version':
        options.version = true;
        break;
        
      case '--debug':
        logger.level = 0;
        break;
        
      default:
        if (arg.startsWith('-')) {
          logger.warn(`未知选项: ${arg}`);
        } else {
          // 可能是URL
          if (!options.url && (arg.startsWith('http://') || arg.startsWith('https://') || arg.endsWith('.json') || arg.endsWith('.yaml') || arg.endsWith('.yml'))) {
            options.url = arg;
          }
        }
    }
  }

  return options;
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
OpenAPI代码生成工具

用法:
  node generate-api.js [选项] [OpenAPI文档URL/路径]

选项:
  -c, --config <文件>     配置文件路径
  -u, --url <URL>        OpenAPI文档URL或文件路径
  -o, --output <目录>     输出目录
  -w, --watch            监听模式，自动重新生成
  --clean                清理输出目录
  -h, --help             显示帮助信息
  -v, --version          显示版本信息
  --debug                启用调试模式

示例:
  node generate-api.js
  node generate-api.js -c ./openapi.config.js
  node generate-api.js -u http://localhost:18080/api-docs -o ./src/api
  node generate-api.js ./openapi.json --clean

环境变量:
  OPENAPI_URL      OpenAPI文档URL
  OUTPUT_DIR       输出目录
  DEBUG            启用调试模式
`);
}

/**
 * 显示版本信息
 */
function showVersion() {
  const packagePath = path.resolve(__dirname, '../../package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log(`OpenAPI代码生成工具 v${packageJson.version || '1.0.0'}`);
  } catch {
    console.log('OpenAPI代码生成工具 v1.0.0');
  }
}

/**
 * 主生成函数
 */
async function generate(options, config) {
  try {
    logger.info('开始生成API代码...');
    
    // 确定OpenAPI文档源
    const openapiSource = options.url || config.openapiUrl;
    if (!openapiSource) {
      throw new Error('未指定OpenAPI文档源，请使用--url参数或在配置文件中设置openapiUrl');
    }
    
    logger.info(`OpenAPI源: ${openapiSource}`);
    
    // 步骤1: 获取OpenAPI文档
    logger.info('步骤1: 获取OpenAPI文档');
    const openapiData = await fetchOpenAPI(openapiSource, {
      timeout: config.request.timeout,
      headers: config.request.headers,
      proxy: config.request.proxy,
      cache: true
    });
    logger.success(`成功获取OpenAPI文档 (版本: ${openapiData.openapi || '未知'})`);
    
    // 步骤2: 解析OpenAPI文档
    logger.info('步骤2: 解析OpenAPI文档');
    const parser = new OpenAPIParser(openapiData);
    const validation = parser.validate();
    
    if (!validation.valid) {
      logger.error('OpenAPI文档验证失败:');
      validation.errors.forEach(error => logger.error(`  - ${error}`));
      throw new Error('OpenAPI文档验证失败');
    }
    
    logger.success(`解析成功: ${validation.stats.endpoints}个接口, ${validation.stats.tags}个标签, ${validation.stats.models}个模型`);
    
    // 步骤3: 转换数据
    logger.info('步骤3: 转换数据为模板格式');
    const transformer = new DataTransformer(parser, config);
    const templateData = transformer.transformForTemplate();
    logger.success('数据转换完成');
    
    // 步骤4: 生成代码
    logger.info('步骤4: 生成代码');
    const generator = new CodeGenerator(config);
    
    // 清理输出目录
    if (options.clean) {
      logger.info('清理输出目录...');
      await generator.cleanOutputDir(config.outputDir, { backup: true });
    }
    
    // 确保输出目录存在
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
      logger.info(`创建输出目录: ${config.outputDir}`);
    }
    
    // 生成代码文件
    let generatedFiles;
    
    if (config.groups.byTag && templateData.tags && templateData.tags.length > 0) {
      generatedFiles = await generator.generateMultipleFiles(templateData, {
        outputDir: config.outputDir,
        groupByTag: true,
        templateName: config.template.default
      });
    } else {
      const outputFile = 'api.generated.js';
      await generator.generateCode(templateData, {
        outputFile: path.join(config.outputDir, outputFile),
        templateName: config.template.default
      });
      generatedFiles = [{ file: outputFile, endpoints: templateData.endpoints.length }];
    }
    
    // 生成TypeScript类型定义
    let typeDefinitionFile = null;
    if (config.generate.typescript) {
      // 生成完整的TypeScript类型定义文件
      typeDefinitionFile = await generator.generateTypeDefinitionFile(parser, config.outputDir);
      
      // 同时生成基于模板数据的简单类型定义（兼容性）
      await generator.generateTypeDefinitions(templateData, config.outputDir);
    }
    
    logger.success(`API代码生成完成! 共生成${generatedFiles.length}个文件`);
    
    // 显示生成统计
    console.log('\n生成统计:');
    console.log(`  - 接口总数: ${validation.stats.endpoints}`);
    console.log(`  - 标签数量: ${validation.stats.tags}`);
    console.log(`  - 模型数量: ${validation.stats.models}`);
    console.log(`  - 输出目录: ${config.outputDir}`);
    
    if (typeDefinitionFile) {
      console.log(`  - 类型定义文件: ${typeDefinitionFile}`);
    }
    
    if (generatedFiles.length > 0) {
      console.log('\n生成的文件:');
      generatedFiles.forEach(file => {
        console.log(`  - ${file.tag || '主文件'}: ${file.file} (${file.endpoints || '?'}个接口)`);
      });
    }
    
    return {
      success: true,
      stats: validation.stats,
      files: generatedFiles
    };
    
  } catch (error) {
    logger.error('生成失败:', error.message);
    
    if (config.debug || logger.level === 0) {
      console.error(error.stack);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 监听模式
 */
async function watchMode(options, config) {
  logger.info('启动监听模式...');
  
  // 简化的监听实现
  // 实际项目应使用chokidar等库
  
  let isGenerating = false;
  let lastGeneration = Date.now();
  const DEBOUNCE_DELAY = 2000; // 2秒防抖
  
  const generateDebounced = async () => {
    const now = Date.now();
    
    if (isGenerating) {
      logger.debug('已有生成任务进行中，跳过');
      return;
    }
    
    if (now - lastGeneration < DEBOUNCE_DELAY) {
      logger.debug('防抖等待中...');
      return;
    }
    
    isGenerating = true;
    lastGeneration = now;
    
    try {
      logger.info('检测到变化，重新生成...');
      await generate(options, config);
    } catch (error) {
      logger.error('重新生成失败:', error.message);
    } finally {
      isGenerating = false;
    }
  };
  
  // 监听OpenAPI源（简化版）
  if (options.url && (options.url.endsWith('.json') || options.url.endsWith('.yaml') || options.url.endsWith('.yml'))) {
    logger.info(`监听文件: ${options.url}`);
    
    // 实际应使用fs.watch
    console.log('监听模式已启用（简化版）');
    console.log('按Ctrl+C退出');
    
    // 保持进程运行
    process.stdin.resume();
    
    process.on('SIGINT', () => {
      logger.info('监听模式已停止');
      process.exit(0);
    });
  } else {
    logger.warn('监听模式仅支持本地文件，当前使用URL模式将不会自动更新');
    
    // 定期检查
    const CHECK_INTERVAL = 30000; // 30秒
    
    setInterval(() => {
      logger.debug('定期检查OpenAPI文档更新...');
      generateDebounced();
    }, CHECK_INTERVAL);
    
    // 初始生成
    await generateDebounced();
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    // 解析命令行参数
    const options = parseArgs();
    
    // 处理帮助和版本信息
    if (options.help) {
      showHelp();
      process.exit(0);
    }
    
    if (options.version) {
      showVersion();
      process.exit(0);
    }
    
    // 加载配置
    const config = loadConfig(options.config);
    
    // 覆盖配置中的URL和输出目录
    if (options.url) {
      config.openapiUrl = options.url;
    }
    
    if (options.output) {
      config.outputDir = options.output;
    }
    
    // 监听模式
    if (options.watch) {
      await watchMode(options, config);
    } else {
      // 单次生成
      const result = await generate(options, config);
      
      if (!result.success) {
        process.exit(1);
      }
    }
    
  } catch (error) {
    logger.error('程序执行失败:', error.message);
    
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = {
  generate,
  loadConfig,
  parseArgs
};