# WatchTogether (一起看)

实时同步观影平台，支持多人同时观看视频并保持播放进度同步。

## 功能特性

- **房间管理** - 创建公开/私有房间，生成邀请码
- **视频同步** - 播放/暂停、跳转、URL 变更实时同步
- **实时聊天** - 文字消息 + 表情发送
- **用户管理** - 匿名会话、昵称设置、历史记录

## 技术栈

| 前端 | 后端 |
|-----|------|
| Vue 3 | Spring Boot 3.2 |
| Vite | Java 17 |
| Pinia | MySQL |
| Socket.io | Redis |
| Video.js | Socket.IO |

## 项目结构

```
watchTogether/
├── [frontend](./frontend)          # 前端项目 (Vue 3)
├── [backend](./backend)           # 后端项目 (Spring Boot)
└── [docs](./docs)                 # 项目文档
```

详细文档:
- [前端 README](./frontend/README.md)
- [后端 README](./backend/README.md)

## 快速开始

### 前置要求

- Node.js 18+
- Java 17+
- Maven 3.8+
- MySQL 8.0+
- Redis 7.x

### 本地开发

**后端**

```bash
cd backend
cp src/main/resources/application-dev.yml src/main/resources/application.yml
# 配置数据库和Redis连接
./mvnw spring-boot:run
```

**前端**

```bash
cd frontend
npm install
npm run dev
```

### Docker 部署

```bash
# 后端
cd backend
docker-compose up -d

# 前端
cd frontend
docker-compose up -d
```

## API 文档

启动后端后访问: http://localhost:18080/swagger-ui.html

## API 代码生成

项目提供了一个自动化工具，可以根据后端 OpenAPI 文档自动生成前端 API 调用代码。

### 生成代码

**方式一：在前端项目中使用（推荐）**

```bash
cd frontend
npm run generate:api
```

**方式二：单独使用工具**

```bash
cd frontend/scripts/openapi-generator
npm install
npm run generate
```

### 生成的文件

```
frontend/src/
├── services/
│   ├── api.js                 # API 调用函数
│   ├── req.js                 # 请求参数对象
│   └── resp.js                # 响应参数对象
└── utils/
    └── request.js             # 通用请求方法（首次运行时创建）
```

### 使用示例

```javascript
import { SessionsApi, RoomsApi } from '@/services/api';

// 获取会话
const session = await SessionsApi.getSession('sess_abc123');

// 创建房间
const room = await RoomsApi.createRoom(data, { headers: { 'X-Session-Id': sessionId } });

// 带查询参数
const messages = await RoomsApi.getChatMessages(roomId, { page: 0, size: 50 });
```

### 自定义配置

```bash
# 指定 OpenAPI 文档 URL
node index.js --openapi-url http://localhost:18080/api-docs

# 只生成指定 tag 的接口
node index.js --tags 会话管理,房间管理

# 启用参数过滤
node index.js --filter-unknown-params
```

详细文档请查看 [openapi-generator README](./frontend/scripts/openapi-generator/README.md)

## 测试

```bash
# 后端测试 + 覆盖率
cd backend && ./mvnw test

# 前端测试
cd frontend && npm run test:coverage
```

## 许可证

MIT
