# WatchTogether 实施计划汇总

> **总览**: WatchTogether 一起看电影聊天网站的完整实施计划

**项目周期**: 约 8 周

---

## 文件结构

```
docs/plans/
├── 2026-02-28-watchtogether-design.md    # 设计文档
├── 2026-02-28-frontend-plan.md           # 前端实施计划
├── 2026-02-28-backend-plan.md            # 后端实施计划
└── 2026-02-28-implementation-plan.md     # 本文件 - 实施计划汇总
```

---

## 开发阶段概览

### Phase 1: 基础设施 (2周)

| 周次 | 前端任务 | 后端任务 |
|------|----------|----------|
| 1 | 项目初始化 (Vite + Vue 3) | Spring Boot 项目搭建 |
| 2 | 样式系统 + 路由配置 | Redis + Socket.io 配置 |

**交付物**: 可运行的基础框架，前后端可联调

### Phase 2: 核心MVP功能 (3周)

| 周次 | 前端任务 | 后端任务 |
|------|----------|----------|
| 3 | 服务层 (API + Socket) | 数据模型 + Session API |
| 4 | 首页 + 创建/加入房间 | 房间 API + Socket 事件 |
| 5 | 视频播放器 + 聊天面板 | 视频同步 + 聊天消息 |

**交付物**: MVP 可用版本 - 房间创建/加入、视频同步、基础聊天

### Phase 3: 增强功能 (2周)

| 周次 | 前端任务 | 后端任务 |
|------|----------|----------|
| 6 | Emoji 表情 + 历史页面 | 表情 API |
| 7 | 个人中心 + 自定义表情 | 文件上传 + 观看历史 |

**交付物**: 完整功能版本 - 表情系统、用户中心

### Phase 4: 优化部署 (1周)

| 任务 | 内容 |
|------|------|
| 性能优化 | 缓存优化、代码优化 |
| 安全性 | 输入验证、敏感词过滤 |
| 部署 | Docker 容器化 |

---

## 前端详细计划

**计划文件**: `2026-02-28-frontend-plan.md`

### Task 列表

1. **Task 1**: 项目初始化
   - package.json, vite.config.js, main.js, App.vue
   - 目录结构创建

2. **Task 2**: 样式系统
   - CSS 变量 (colors, fonts, radius, shadows)
   - 基础样式和工具类

3. **Task 3**: 路由配置
   - Vue Router 配置
   - 6个页面骨架 (Home, Create, Join, Room, History, Profile)

4. **Task 4**: 服务层封装
   - API 服务 (roomApi, sessionApi, emojiApi, videoApi)
   - Socket 服务 (socketService)

5. **Task 5**: 状态管理
   - Pinia stores (user, room, chat)

6. **Task 6**: 首页开发
   - 公开房间列表
   - 创建/加入按钮

7. **Task 7**: 创建房间页
   - 房间表单组件
   - 房间创建逻辑

8. **Task 8**: 加入房间页
   - 房间号输入
   - 邀请链接复制

9. **Task 9**: 视频播放器
   - VideoPlayer 组件
   - VideoControls 组件

10. **Task 10**: 聊天面板
    - ChatPanel 组件
    - MessageList 组件
    - MessageInput 组件

11. **Task 11**: 房间页面整合
    - 视频 + 聊天布局
    - 视频源切换

12. **Task 12-16**: 增强功能 (历史、个人中心、表情等)

---

## 后端详细计划

**计划文件**: `2026-02-28-backend-plan.md`

### Task 列表

1. **Task 1**: Spring Boot 项目初始化
   - pom.xml, application.yml
   - 主类

2. **Task 2**: Redis 配置
   - RedisConfig
   - RedisTemplate

3. **Task 3**: Socket.io 配置
   - SocketIOConfig
   - 启动类

4. **Task 4**: 统一响应和异常处理
   - ApiResponse
   - GlobalExceptionHandler

5. **Task 5**: 数据模型
   - Room, Session, ChatMessage 实体
   - Repository 接口

6. **Task 6**: 会话服务
   - SessionService
   - SessionController

7. **Task 7**: 房间服务
   - RoomService
   - RoomController

8. **Task 8**: Socket.io 事件处理器
   - 连接/断开事件
   - 加入/离开房间
   - 视频同步
   - 聊天消息

9. **Task 9**: 聊天历史 API

10. **Task 10-12**: 增强功能 (表情、文件上传、Docker)

---

## 技术栈清单

### 前端
- Vue 3.4+
- Vite 5+
- Pinia 2.1+
- Vue Router 4+
- socket.io-client 4.7+
- video.js 8.6+

### 后端
- Spring Boot 3.2+
- netty-socketio 2.0+
- Spring Data JPA
- MySQL 8.0
- Redis 7+

---

## 数据库表结构

```sql
-- rooms 表
CREATE TABLE rooms (
  id VARCHAR(6) PRIMARY KEY,
  name VARCHAR(100),
  max_users INT DEFAULT 5,
  is_public BOOLEAN DEFAULT TRUE,
  creator_session_id VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- sessions 表
CREATE TABLE sessions (
  id VARCHAR(50) PRIMARY KEY,
  nickname VARCHAR(50),
  avatar VARCHAR(100),
  created_at TIMESTAMP,
  last_active_at TIMESTAMP
);

-- chat_messages 表
CREATE TABLE chat_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  room_id VARCHAR(6),
  session_id VARCHAR(50),
  content TEXT,
  message_type ENUM('TEXT', 'EMOJI', 'IMAGE'),
  created_at TIMESTAMP
);
```

---

## Redis 键值设计

| Key 格式 | 类型 | 说明 |
|----------|------|------|
| `session:{id}` | String | 会话缓存 |
| `room:{id}` | Hash | 房间信息缓存 |
| `public:rooms` | ZSet | 公开房间列表 |
| `room:{id}:users` | Set | 在线用户 |
| `socket:{socketId}` | String | Socket 映射 |
| `room:state:{id}` | Hash | 视频状态 |

---

## Socket.io 事件

### 客户端发送
- `join-room` - 加入房间
- `leave-room` - 离开房间
- `video:play` - 播放
- `video:pause` - 暂停
- `video:seek` - 跳转
- `video:url-change` - 切换视频
- `chat:message` - 发送消息

### 服务端广播
- `user-joined` - 用户加入
- `user-left` - 用户离开
- `room-state` - 房间状态
- `video:sync-play` - 同步播放
- `video:sync-pause` - 同步暂停
- `video:sync-seek` - 同步跳转
- `video:sync-url-change` - 同步视频切换
- `chat:message` - 新消息

---

## 前端设计风格

**主题**: 自然温馨

**色彩**:
- 背景: 米白 #f7f5f0
- 强调: 灰绿 #a7c3a6, 焦糖棕 #c4824a

**字体**:
- 标题: Noto Serif SC
- 正文: Nunito

**圆角**: 20-28px

**动画**: 淡入上浮, 250ms过渡

---

## 启动顺序

### 开发环境

1. **启动 MySQL**
```bash
docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=watchtogether mysql:8.0
```

2. **启动 Redis**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

3. **启动后端**
```bash
cd backend
./mvnw spring-boot:run
```

4. **启动前端**
```bash
cd frontend
npm install
npm run dev
```

### 生产环境

```bash
docker-compose up -d
```

---

## 成功标准

### MVP (Phase 2 结束)
- [ ] 可创建和加入房间
- [ ] 视频播放严格同步
- [ ] 实时聊天可用
- [ ] 页面加载 < 2秒

### 完整版 (Phase 3 结束)
- [ ] Emoji 表情支持
- [ ] 图片表情
- [ ] 观看历史
- [ ] 个人中心

---

**Plan version**: v1.0  
**Created**: 2026-02-28
**Status**: Ready for execution
