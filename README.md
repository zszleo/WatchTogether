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
├── frontend/          # 前端项目 (Vue 3)
├── backend/           # 后端项目 (Spring Boot)
└── docs/              # 项目文档
```

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

## 测试

```bash
# 后端测试 + 覆盖率
cd backend && ./mvnw test

# 前端测试
cd frontend && npm run test:coverage
```

## 许可证

MIT
