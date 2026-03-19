# OpenAPI 代码生成工具

根据后端 Spring Boot 的 OpenAPI 文档自动生成前端 API 调用代码。

## 功能特性

- 从 OpenAPI 3.0 文档自动生成 API 调用代码
- 生成三个核心文件：`api.js`、`req.js`、`resp.js`
- 支持参数过滤和严格模式
- 支持请求/响应拦截器
- 自动生成 JSDoc 注释
- 支持命令行参数、环境变量和配置文件

## 快速开始

### 安装依赖

```bash
cd frontend/scripts/openapi-generator
npm install
```

### 运行生成

```bash
# 使用默认配置
npm run generate

# 指定 OpenAPI 文档 URL
node index.js --openapi-url http://localhost:18080/api-docs

# 指定输出目录
node index.js -o ./src/services
```

## 命令行参数

| 参数 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--openapi-url` | `-u` | OpenAPI 文档 URL | `http://localhost:18080/api-docs` |
| `--output-dir` | `-o` | 输出目录 | `../../src/services` |
| `--utils-dir` | | 工具类目录 | `../../src/utils` |
| `--api-file-name` | | API 文件名 | `api.js` |
| `--req-file-name` | | 请求参数文件名 | `req.js` |
| `--resp-file-name` | | 响应参数文件名 | `resp.js` |
| `--tags` | | 指定要生成的 tag（逗号分隔） | 全部 |
| `--filter-unknown-params` | | 过滤未定义参数 | `false` |
| `--strict-mode` | | 严格模式：拒绝未定义参数 | `false` |
| `--help` | `-h` | 显示帮助信息 | |
| `--version` | `-v` | 显示版本信息 | |

## 配置文件

在项目根目录创建 `.openapirc.json` 文件：

```json
{
  "openapiUrl": "http://localhost:18080/api-docs",
  "outputDir": "../../src/services",
  "utilsDir": "../../src/utils",
  "tags": ["会话管理", "房间管理"],
  "filterUnknownParams": false,
  "strictMode": false
}
```

## 环境变量

| 变量名 | 说明 |
|--------|------|
| `OPENAPI_URL` | OpenAPI 文档 URL |
| `OPENAPI_OUTPUT_DIR` | 输出目录 |
| `OPENAPI_UTILS_DIR` | 工具类目录 |
| `OPENAPI_TAGS` | 指定要生成的 tag（逗号分隔） |
| `OPENAPI_FILTER_UNKNOWN_PARAMS` | 过滤未定义参数 |
| `OPENAPI_STRICT_MODE` | 严格模式 |

## 配置优先级

命令行参数 > 环境变量 > 配置文件 > 默认配置

## 生成的文件

### 目录结构

```
frontend/src/
├── services/
│   ├── api.js                 # API 调用函数（每次覆盖生成）
│   ├── req.js                 # 请求参数对象（每次覆盖生成）
│   └── resp.js                # 响应参数对象（每次覆盖生成）
└── utils/
    └── request.js             # 通用请求方法（首次运行时创建）
```

### api.js 示例

```javascript
import { request } from '../utils/request';

/**
 * SessionsApi API
 */
export const SessionsApi = {
  /**
   * 获取会话信息
   * @param {string} sessionId - 会话ID
   * @param {Object} [options={}] - 请求选项
   * @returns {Promise} Promise对象
   */
  getSession: async (sessionId, options = {}) => {
    const path = `/api/sessions/${sessionId}`;
    return request(path, { method: 'GET', ...options });
  },

  /**
   * 创建会话
   * @param {Object} data - 请求体数据
   * @param {Object} [options={}] - 请求选项
   * @returns {Promise} Promise对象
   */
  createSession: async (data, options = {}) => {
    const path = `/api/sessions`;
    return request(path, { method: 'POST', data, ...options });
  },
};
```

### 使用示例

```javascript
import { SessionsApi, RoomsApi } from '@/services/api';

// 基本调用
const session = await SessionsApi.getSession('sess_abc123');

// 带查询参数
const rooms = await RoomsApi.getPublicRooms({ page: 1, size: 10 });

// 使用拦截器
const requestInterceptor = (config) => {
  config.headers['Authorization'] = `Bearer ${getToken()}`;
  return config;
};

const data = await SessionsApi.getSession('sess_abc123', { requestInterceptor });
```

## 参数过滤

### 默认行为
不过滤参数，传递的所有参数都会发送。

### 启用参数过滤
```bash
node index.js --filter-unknown-params
```
只发送 OpenAPI 文档中定义的参数，忽略其他参数。

### 严格模式
```bash
node index.js --strict-mode
```
遇到未定义的参数会抛出错误。

## 测试

```bash
# 运行测试
npm test

# 运行测试覆盖率
npm run test:coverage
```

当前测试覆盖率：**96.13%**

## 项目结构

```
openapi-generator/
├── index.js               # 主入口脚本
├── config.js              # 配置管理
├── openapi-client.js      # OpenAPI 文档获取与解析
├── code-generator.js      # 代码生成逻辑
├── templates/             # 代码模板
├── utils/
│   ├── file-utils.js      # 文件操作工具
│   └── logger.js          # 日志工具
├── __tests__/             # 测试文件
├── test-data/             # 测试数据
├── package.json
└── vitest.config.js
```

## 开发说明

### 技术栈
- Node.js
- ES Modules
- Axios（HTTP 请求）
- Vitest（测试框架）

### 添加新功能
1. 修改对应的模块文件
2. 添加单元测试
3. 运行测试确保通过
4. 更新文档

## License

MIT
