# WatchTogether 后端服务

[← 返回项目主页](../README.md)

基于 Spring Boot 的 WatchTogether 同步观影平台后端服务。

## 功能特性

- **房间管理**: 创建、加入和管理观看房间，支持公开/私有房间
- **实时同步**: 基于 Socket.io 的视频播放同步（播放/暂停/跳转/URL变更）
- **会话管理**: 基于 Redis 的用户会话状态管理，支持7天TTL
- **聊天系统**: 实时聊天消息传递
- **文件上传**: 支持视频和图片上传（最大100MB）
- **表情系统**: 交互式表情反应功能
- **健康监控**: 系统健康检查和依赖服务状态监控
- **API 文档**: 集成 OpenAPI/Swagger 文档

## 技术栈

- **Java 17** - 编程语言
- **Spring Boot 3.2.0** - 应用框架
- **Spring Data JPA** - 数据持久化
- **MySQL 8.0** - 关系型数据库
- **Redis 7.x** - 缓存和会话存储
- **Socket.IO (netty-socketio 2.0.11)** - 实时通信
- **Maven** - 构建工具
- **Docker & Docker Compose** - 容器化部署
- **Lombok** - 代码简化
- **SpringDoc OpenAPI** - API 文档生成

## 系统架构

```
前端客户端 → HTTP API (端口 18080) → Spring Boot 应用
          → Socket.IO (端口 19090) → 实时事件处理器
                                    
应用层: Controller → Service → Repository → Model
缓存层: Redis (会话、房间状态、在线用户)
持久层: MySQL (房间、会话、聊天记录、历史记录)
```

## 环境要求

- Java 17 或更高版本
- Maven 3.6+
- Docker 和 Docker Compose（可选，用于数据库服务）
- MySQL 8.0+（或使用Docker容器）
- Redis 7.x+（或使用Docker容器）

## 快速开始

### 1. 克隆仓库
```bash
git clone <仓库地址>
cd watchTogether/backend
```

### 2. 配置环境变量
复制环境变量示例文件并根据需要修改：
```bash
cp .env.example .env
```
编辑 `.env` 文件，设置数据库连接等参数。

### 3. 启动依赖服务（使用 Docker）
```bash
# 启动 MySQL 和 Redis
docker-compose up -d

# 验证服务状态
docker-compose ps
```

### 4. 构建项目
```bash
mvn clean package
```

### 5. 运行应用
```bash
# 开发模式（使用 dev profile）
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 或运行打包后的 JAR
java -jar target/watchtogether-backend-1.0.0.jar --spring.profiles.active=dev
```

### 6. 验证服务运行状态
```bash
# 简单健康检查
curl http://localhost:18080/api/health/simple

# 完整健康检查（包含 Redis 状态）
curl http://localhost:18080/api/health
```

## API 文档

应用启动后，访问以下地址查看 API 文档：

- **Swagger UI**: http://localhost:18080/swagger-ui.html
- **OpenAPI 文档**: http://localhost:18080/api-docs

### 主要 API 端点

#### 健康检查
- `GET /api/health` - 系统健康状态（包含 Redis 检查）
- `GET /api/health/simple` - 简单健康状态

#### 会话管理
- `POST /api/sessions` - 创建新用户会话
- `GET /api/sessions/{id}` - 获取会话详情
- `DELETE /api/sessions/{id}` - 删除会话
- `GET /api/sessions/{id}/validate` - 验证会话有效性
- `PUT /api/sessions/{id}/profile` - 更新用户资料
- `GET /api/sessions/{id}/history` - 获取用户历史记录

#### 房间管理
- `POST /api/rooms` - 创建新房间
- `GET /api/rooms` - 获取公开房间列表
- `GET /api/rooms/{roomId}` - 获取房间详情
- `GET /api/rooms/code/{roomCode}` - 通过房间码获取房间
- `DELETE /api/rooms/{roomId}` - 删除房间
- `GET /api/rooms/{roomId}/invite` - 获取房间邀请链接
- `GET /api/rooms/{roomId}/messages` - 获取房间聊天消息（分页）

#### 文件管理
- `POST /api/files/upload` - 上传文件（视频/图片）
- `GET /api/files/{fileId}` - 获取文件信息
- `DELETE /api/files/{fileId}` - 删除文件

#### 表情管理
- `GET /api/emojis` - 获取可用表情列表
- `POST /api/emojis/{emojiId}/send` - 发送表情到房间

## Socket.IO 实时事件

Socket.IO 服务器运行在端口 19090。支持以下事件：

### 连接管理
- **连接**: 客户端连接时自动建立
- **断开连接**: 客户端断开时自动清理

### 房间事件
- **join-room**: 加入房间（需要房间码和会话ID）
- **leave-room**: 离开房间

### 视频同步事件
- **video:play**: 视频播放事件
- **video:pause**: 视频暂停事件
- **video:seek**: 视频跳转事件
- **video:url-change**: 视频URL变更事件

### 聊天事件
- **chat:message**: 发送聊天消息

### 广播事件（服务器到客户端）
- **user-joined**: 用户加入房间通知
- **user-left**: 用户离开房间通知
- **video:sync-play**: 视频播放同步
- **video:sync-pause**: 视频暂停同步
- **video:sync-seek**: 视频跳转同步
- **video:sync-url-change**: 视频URL变更同步
- **room-state**: 房间状态更新
- **chat:message**: 聊天消息广播

## 环境变量配置

详细环境变量请参考 `.env.example` 文件：

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=watchtogether
DB_USERNAME=root
DB_PASSWORD=root

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DATABASE=0
REDIS_PASSWORD=

# Socket.IO 配置
SOCKETIO_HOST=0.0.0.0
SOCKETIO_PORT=19090

# 应用设置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=100
ALLOWED_EXTENSIONS=.mp4,.webm,.mkv,.mov,.avi

# 日志配置
LOG_LEVEL_COM_WATCHTOGETHER=INFO
LOG_FILE_PATH=logs/application.log

# 房间设置
ROOM_ID_LENGTH=6
ROOM_MAX_USERS_DEFAULT=5

# 会话设置
SESSION_TTL_DAYS=7
SESSION_ID_PREFIX=sess_
SESSION_ID_LENGTH=12
```

## 项目结构

```
src/main/java/com/watchtogether/
├── annotation/          # 自定义注解（@SessionId, @CurrentSession, @RequireSession）
├── common/             # 通用常量和工具
├── config/             # 配置类（Redis, Socket.IO, OpenAPI, WebMvc）
├── controller/         # REST 控制器
├── dto/                # 数据传输对象（请求/响应/事件）
├── model/              # JPA 实体类
├── repository/         # 数据访问仓库
├── service/            # 业务逻辑服务
├── socket/             # Socket.io 事件处理器
├── utils/              # 工具类（RedisUtil等）
├── interceptor/        # 拦截器（会话验证）
├── resolver/           # 参数解析器
├── handler/            # 全局异常处理器
├── context/            # 上下文管理
└── exception/          # 自定义异常

src/main/resources/
├── application.yml     # 主配置文件
├── application-dev.yml # 开发环境配置
├── application-test.yml # 测试环境配置
├── application-prod.yml # 生产环境配置
```

## 数据库设计

主要数据表：

- **rooms**: 房间信息（房间码、名称、视频URL、播放状态等）
- **sessions**: 用户会话（会话ID、昵称、头像、在线状态等）
- **chat_messages**: 聊天消息记录（待实现）
- **session_history**: 用户历史记录（加入/离开房间）
- **emojis**: 表情符号定义

使用 JPA 自动建表策略（开发环境为 `update`，生产环境为 `validate`）。

## 测试

### 运行测试
```bash
# 运行所有测试
mvn test

# 运行特定测试类
mvn test -Dtest=RoomControllerTest

# 生成测试报告
mvn surefire-report:report
```

### 测试覆盖率
项目包含单元测试和集成测试，涵盖：
- 控制器层测试
- 服务层测试
- 工具类测试
- 异常处理测试
- Socket 事件处理器测试

## 部署

### 开发环境部署
1. 使用 `docker-compose.yml` 启动数据库服务
2. 本地运行 Spring Boot 应用
3. 访问 http://localhost:18080

### 生产环境部署
#### 选项1：传统部署
1. 构建 JAR 包：`mvn clean package -DskipTests`
2. 配置生产环境变量
3. 运行：`java -jar target/watchtogether-backend-1.0.0.jar --spring.profiles.active=prod`

#### 选项2：Docker 容器部署
使用 `docker-compose.full.yml` 部署完整栈：
```bash
# 构建并启动所有服务
docker-compose -f docker-compose.full.yml up --build -d

# 查看日志
docker-compose -f docker-compose.full.yml logs -f
```

#### 选项3：使用部署脚本
```bash
# 启动完整栈
./deploy.sh start full

# 查看状态
./deploy.sh status

# 查看日志
./deploy.sh logs
```

### 生产环境注意事项
1. 将 `spring.jpa.hibernate.ddl-auto` 设置为 `validate` 或 `none`
2. 使用强密码和安全配置的 Redis
3. 配置正确的 CORS 允许来源
4. 生产环境启用 HTTPS
5. 配置日志轮转和监控
6. 设置适当的资源限制（内存、CPU）

## 监控与维护

### 健康检查端点
- `GET /api/health` - 系统健康状态
- `GET /api/health/simple` - 简单健康检查

### 日志
- 日志文件：`logs/application-{profile}.log`
- 日志级别可通过环境变量配置
- 支持日志轮转（按大小和时间）

### 性能监控
- 使用 Spring Boot Actuator（待集成）
- Redis 连接池监控
- 数据库连接池监控

## 故障排除

### 常见问题

1. **MySQL 连接失败**
   - 确认 MySQL 服务正在运行：`docker ps | grep mysql`
   - 检查 `.env` 文件中的数据库凭据
   - 验证网络连接和端口访问

2. **Redis 连接失败**
   - 确认 Redis 服务正在运行：`docker ps | grep redis`
   - 检查 Redis 配置和密码设置
   - 验证 Redis 客户端连接

3. **端口冲突**
   - 修改 `application.yml` 或 `.env` 中的 `server.port`
   - 修改 `socketio.port` 配置

4. **Socket.IO 无法工作**
   - 确认 Socket.IO 服务器已启动（查看应用日志）
   - 验证客户端连接端口是否正确（默认 19090）
   - 检查 CORS 配置

5. **文件上传失败**
   - 确认上传目录存在且有写权限
   - 检查文件大小限制配置
   - 验证文件扩展名是否允许

### 日志查看
```bash
# 查看应用日志
tail -f logs/application.log

# 查看 Docker 容器日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f app
```

## 开发指南

### 代码规范
- 遵循 Java 命名规范
- 使用 Lombok 减少样板代码
- 添加必要的 Javadoc 注释
- 使用 SLF4J 进行日志记录

### 新增 API 端点
1. 在 `controller` 包中创建新的控制器
2. 定义请求映射和 Swagger 注解
3. 创建对应的 DTO 类
4. 在 `service` 包中实现业务逻辑
5. 添加单元测试

### 新增 Socket 事件
1. 在 `SocketEventHandler` 类中添加事件处理方法
2. 使用 `@OnEvent` 注解标注方法
3. 在 `dto/event` 包中创建事件数据类
4. 更新客户端文档

### 数据库变更
1. 修改 JPA 实体类
2. 开发环境会自动更新表结构
3. 生产环境需要手动执行数据库迁移脚本

## 贡献指南

1. Fork 项目仓库
2. 创建功能分支：`git checkout -b feature/新功能`
3. 提交更改：`git commit -m '添加新功能'`
4. 推送到分支：`git push origin feature/新功能`
5. 提交 Pull Request

## 许可证

专有 - 保留所有权利。

## 联系方式

- 项目仓库：<仓库地址>
- 问题反馈：使用 Issue 跟踪系统
- 文档更新：提交 Pull Request

---
*最后更新：2026-03-09*
