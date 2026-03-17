/**
 * OpenAPI代码生成工具配置文件
 */

module.exports = {
  // OpenAPI文档地址
  openapiUrl: 'http://localhost:18080/api-docs',
  
  // 输出目录
  outputDir: '../src/services/generated',
  
  // API分组配置
  groups: {
    // 按标签分组生成文件，例如：{ room: 'roomApi.js', session: 'sessionApi.js' }
    byTag: true,
    
    // 自定义分组映射（当byTag为false时生效）
    custom: {
      // 示例：'Room': 'roomApi.js'
    }
  },
  
  // 模板配置
  template: {
    // 使用的模板引擎：'handlebars' | 'ejs' | 'art-template'
    engine: 'handlebars',
    
    // 模板目录
    dir: './templates',
    
    // 默认模板文件
    default: 'api.hbs'
  },
  
  // 请求配置
  request: {
    // 超时时间（毫秒）
    timeout: 30000,
    
    // 请求头
    headers: {
      'User-Agent': 'OpenAPI-Generator/1.0.0'
    },
    
    // 代理配置
    proxy: null
  },
  
  // 生成选项
  generate: {
    // 是否生成TypeScript类型定义
    typescript: true,
    
    // TypeScript类型定义输出目录（相对于outputDir）
    typescriptOutput: '../src/types',
    
    // TypeScript类型定义文件名
    typescriptFile: 'api.d.ts',
    
    // 是否生成JSDoc注释
    jsdoc: true,
    
    // JSDoc详细程度：'basic' | 'detailed' | 'full'
    jsdocLevel: 'detailed',
    
    // 是否生成mock数据
    mock: false,
    
    // 是否生成测试文件
    tests: false,
    
    // 是否使用axios（如果为false则使用fetch）
    useAxios: true,
    
    // 基础URL配置
    baseUrl: 'process.env.VITE_API_BASE_URL || ""',
    
    // 请求拦截器
    requestInterceptor: '',
    
    // 响应拦截器
    responseInterceptor: ''
  },
  
  // 调试模式
  debug: false,
  
  // 监听模式（自动重新生成）
  watch: false
};