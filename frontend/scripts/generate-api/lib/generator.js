/**
 * 代码生成模块
 * 使用模板引擎生成API代码
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');
const TypeGenerator = require('./type-generator');

/**
 * 代码生成器类
 */
class CodeGenerator {
  constructor(config = {}) {
    this.config = config;
    this.templateEngine = null;
    this.templateCache = new Map();
  }

  /**
   * 初始化模板引擎
   */
  async initTemplateEngine() {
    const engine = this.config.template?.engine || 'handlebars';
    
    try {
      switch (engine.toLowerCase()) {
        case 'handlebars':
          const handlebars = require('handlebars');
          this.templateEngine = handlebars;
          
          // 注册助手函数
          this.registerHandlebarsHelpers();
          logger.info('使用Handlebars模板引擎');
          break;
          
        case 'ejs':
          this.templateEngine = require('ejs');
          logger.info('使用EJS模板引擎');
          break;
          
        case 'art-template':
          this.templateEngine = require('art-template');
          logger.info('使用Art-Template模板引擎');
          break;
          
        default:
          throw new Error(`不支持的模板引擎: ${engine}`);
      }
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error(`模板引擎"${engine}"未安装，请运行: npm install ${engine}`);
      }
      throw error;
    }
    
    return this.templateEngine;
  }

  /**
   * 注册Handlebars助手函数
   */
  registerHandlebarsHelpers() {
    const handlebars = this.templateEngine;
    
    // 驼峰命名
    handlebars.registerHelper('camelCase', function(str) {
      if (!str) return '';
      return str
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .split(' ')
        .map((word, index) => {
          if (index === 0) return word.toLowerCase();
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');
    });
    
    // 帕斯卡命名
    handlebars.registerHelper('pascalCase', function(str) {
      if (!str) return '';
      return str
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
    });
    
    // 下划线命名
    handlebars.registerHelper('snakeCase', function(str) {
      if (!str) return '';
      return str
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .split(' ')
        .map(word => word.toLowerCase())
        .join('_');
    });
    
    // 连字符命名
    handlebars.registerHelper('kebabCase', function(str) {
      if (!str) return '';
      return str
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .split(' ')
        .map(word => word.toLowerCase())
        .join('-');
    });
    
    // JSON格式化
    handlebars.registerHelper('json', function(obj) {
      return JSON.stringify(obj, null, 2);
    });
    
    // 格式化日期
    handlebars.registerHelper('now', function() {
      return new Date().toISOString();
    });
    
    // 首字母大写
    handlebars.registerHelper('capitalize', function(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    });
    
    // 首字母小写
    handlebars.registerHelper('lowercase', function(str) {
      if (!str) return '';
      return str.charAt(0).toLowerCase() + str.slice(1);
    });
    
    // 条件判断
    handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    });
    
    // 连接字符串
    handlebars.registerHelper('concat', function(...args) {
      args.pop(); // 移除options参数
      return args.join('');
    });
    
    // 循环次数
    handlebars.registerHelper('times', function(n, block) {
      let accum = '';
      for (let i = 0; i < n; i++) {
        accum += block.fn(i);
      }
      return accum;
    });
  }

  /**
   * 加载模板
   */
  async loadTemplate(templateName) {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName);
    }
    
    const templateDir = this.config.template?.dir || './templates';
    const templateFile = path.resolve(templateDir, templateName);
    
    if (!fs.existsSync(templateFile)) {
      throw new Error(`模板文件不存在: ${templateFile}`);
    }
    
    const templateContent = fs.readFileSync(templateFile, 'utf8');
    let compiledTemplate;
    
    if (this.config.template?.engine === 'handlebars') {
      compiledTemplate = this.templateEngine.compile(templateContent);
    } else if (this.config.template?.engine === 'ejs') {
      compiledTemplate = this.templateEngine.compile(templateContent);
    } else if (this.config.template?.engine === 'art-template') {
      compiledTemplate = this.templateEngine.compile(templateContent);
    } else {
      throw new Error('未初始化模板引擎');
    }
    
    this.templateCache.set(templateName, compiledTemplate);
    return compiledTemplate;
  }

  /**
   * 生成代码
   */
  async generateCode(templateData, options = {}) {
    const {
      templateName = this.config.template?.default || 'api.hbs',
      outputFile,
      outputDir,
      format = true
    } = options;
    
    // 确保模板引擎已初始化
    if (!this.templateEngine) {
      await this.initTemplateEngine();
    }
    
    // 加载模板
    const template = await this.loadTemplate(templateName);
    
    // 准备模板数据
    const data = {
      ...templateData,
      config: this.config,
      now: new Date().toISOString()
    };
    
    // 渲染模板
    let generatedCode;
    
    if (this.config.template?.engine === 'handlebars') {
      generatedCode = template(data);
    } else if (this.config.template?.engine === 'ejs') {
      generatedCode = template(data);
    } else if (this.config.template?.engine === 'art-template') {
      generatedCode = template(data, {});
    }
    
    // 格式化代码（如果启用）
    if (format) {
      generatedCode = await this.formatCode(generatedCode);
    }
    
    // 写入文件
    if (outputFile) {
      await this.writeToFile(generatedCode, outputFile, outputDir);
      return outputFile;
    }
    
    return generatedCode;
  }

  /**
   * 格式化生成的代码
   */
  async formatCode(code) {
    try {
      // 尝试使用Prettier格式化
      const prettier = require('prettier');
      
      const config = await prettier.resolveConfig(process.cwd());
      const formatted = await prettier.format(code, {
        ...config,
        parser: 'babel',
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
        printWidth: 100
      });
      
      return formatted;
    } catch (error) {
      // 如果Prettier不可用，返回原始代码
      logger.warn('代码格式化失败，使用原始代码:', error.message);
      return code;
    }
  }

  /**
   * 写入文件
   */
  async writeToFile(content, outputFile, outputDir = null) {
    let filePath = outputFile;
    
    if (outputDir) {
      filePath = path.join(outputDir, outputFile);
    }
    
    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`创建目录: ${dir}`);
    }
    
    // 写入文件
    fs.writeFileSync(filePath, content, 'utf8');
    logger.success(`文件已生成: ${filePath}`);
    
    return filePath;
  }

  /**
   * 生成多个文件（按标签分组）
   */
  async generateMultipleFiles(templateData, options = {}) {
    const { outputDir, groupByTag = true } = options;
    
    if (!groupByTag || !templateData.tags || templateData.tags.length === 0) {
      // 生成单个文件
      const outputFile = options.outputFile || 'api.generated.js';
      return this.generateCode(templateData, {
        ...options,
        outputFile: path.join(outputDir, outputFile)
      });
    }
    
    const generatedFiles = [];
    
    // 为每个标签生成单独的文件
    for (const tag of templateData.tags) {
      if (!tag.endpoints || tag.endpoints.length === 0) continue;
      
      // 准备标签特定的数据
      const tagData = {
        info: templateData.info,
        config: templateData.config,
        utils: templateData.utils,
        tags: [tag],
        endpoints: tag.endpoints
      };
      
      // 生成文件名
      const fileName = `${tag.name.toLowerCase()}.api.js`;
      const filePath = path.join(outputDir, fileName);
      
      try {
        await this.generateCode(tagData, {
          ...options,
          outputFile: filePath,
          templateName: options.templateName
        });
        
        generatedFiles.push({
          tag: tag.name,
          file: filePath,
          endpoints: tag.endpoints.length
        });
        
        logger.info(`生成标签"${tag.name}"的API文件: ${fileName} (${tag.endpoints.length}个接口)`);
      } catch (error) {
        logger.error(`生成标签"${tag.name}"的API文件失败:`, error.message);
      }
    }
    
    // 生成索引文件
    if (generatedFiles.length > 1) {
      await this.generateIndexFile(generatedFiles, outputDir, options);
    }
    
    return generatedFiles;
  }

  /**
   * 生成索引文件
   */
  async generateIndexFile(generatedFiles, outputDir, options) {
    const indexContent = `/**
 * API模块索引文件
 * 自动生成于: ${new Date().toISOString()}
 */

${generatedFiles.map(file => `import { ${file.tag}Api } from './${path.basename(file.file, '.js')}';`).join('\n')}

// 导出所有API模块
export default {
${generatedFiles.map(file => `  ${file.tag}Api,`).join('\n')}
};

// 按需导出
${generatedFiles.map(file => `export { ${file.tag}Api };`).join('\n')}
`;

    const indexPath = path.join(outputDir, 'index.js');
    fs.writeFileSync(indexPath, indexContent, 'utf8');
    logger.success(`索引文件已生成: ${indexPath}`);
    
    return indexPath;
  }

  /**
   * 生成TypeScript类型定义（基于模板数据）
   */
  async generateTypeDefinitions(templateData, outputDir) {
    if (!this.config.generate?.typescript) {
      return null;
    }
    
    const typeDefs = [];
    
    // 生成模型类型定义
    if (templateData.models && templateData.models.length > 0) {
      typeDefs.push('// 模型类型定义');
      
      for (const model of templateData.models) {
        const props = model.properties.map(prop => {
          const required = prop.required ? '' : '?';
          return `  ${prop.name}${required}: ${prop.type}; // ${prop.description}`;
        }).join('\n');
        
        typeDefs.push(`export interface ${model.name} {\n${props}\n}`);
      }
    }
    
    // 生成API函数类型定义
    if (templateData.endpoints && templateData.endpoints.length > 0) {
      typeDefs.push('\n// API函数类型定义');
      
      for (const endpoint of templateData.endpoints) {
        if (!endpoint.types?.functionSignature) continue;
        
        typeDefs.push(`export ${endpoint.types.functionSignature};`);
      }
    }
    
    if (typeDefs.length === 0) {
      return null;
    }
    
    const typeContent = `/**
 * TypeScript类型定义
 * 自动生成于: ${new Date().toISOString()}
 */

${typeDefs.join('\n\n')}
`;
    
    const typePath = path.join(outputDir, 'api.types.ts');
    fs.writeFileSync(typePath, typeContent, 'utf8');
    logger.success(`TypeScript类型定义已生成: ${typePath}`);
    
    return typePath;
  }

  /**
   * 生成完整的TypeScript类型定义文件
   */
  async generateTypeDefinitionFile(parser, outputDir, options = {}) {
    if (!this.config.generate?.typescript) {
      return null;
    }
    
    try {
      const typeGenerator = new TypeGenerator(parser, this.config);
      const typeDefinitions = typeGenerator.generateTypes();
      
      const typeContent = typeDefinitions.typeDefinitionFile;
      
      // 确定输出路径
      const typescriptOutput = this.config.generate?.typescriptOutput || outputDir;
      const typescriptFile = this.config.generate?.typescriptFile || 'api.d.ts';
      const typeDir = path.isAbsolute(typescriptOutput) 
        ? typescriptOutput 
        : path.join(outputDir, typescriptOutput);
      
      const typePath = path.join(typeDir, typescriptFile);
      
      // 确保目录存在
      const dir = path.dirname(typePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`创建类型定义目录: ${dir}`);
      }
      
      // 写入文件
      fs.writeFileSync(typePath, typeContent, 'utf8');
      logger.success(`TypeScript类型定义文件已生成: ${typePath}`);
      
      // 同时生成TypeScript声明文件供JavaScript使用
      if (typescriptFile.endsWith('.d.ts')) {
        const jsDeclarationPath = path.join(typeDir, 'api-types.js');
        const jsDeclaration = `/**
 * TypeScript类型声明（供JavaScript项目使用）
 * 此文件仅用于类型检查，实际类型定义在${typescriptFile}
 */

// @ts-check

export {};`;
        
        fs.writeFileSync(jsDeclarationPath, jsDeclaration, 'utf8');
        logger.info(`JavaScript类型声明文件已生成: ${jsDeclarationPath}`);
      }
      
      return typePath;
    } catch (error) {
      logger.error('生成TypeScript类型定义失败:', error.message);
      return null;
    }
  }

  /**
   * 清理输出目录
   */
  async cleanOutputDir(outputDir, options = {}) {
    const { exclude = [], backup = false } = options;
    
    if (!fs.existsSync(outputDir)) {
      return;
    }
    
    if (backup) {
      const backupDir = `${outputDir}.backup.${Date.now()}`;
      fs.cpSync(outputDir, backupDir, { recursive: true });
      logger.info(`备份目录: ${backupDir}`);
    }
    
    const files = fs.readdirSync(outputDir);
    
    for (const file of files) {
      if (exclude.includes(file)) continue;
      
      const filePath = path.join(outputDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        fs.rmSync(filePath, { recursive: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
    
    logger.info(`清理输出目录: ${outputDir}`);
  }
}

module.exports = CodeGenerator;