# WatchTogether - 一起看电影聊天网站设计文档

## 项目概述

WatchTogether是一个允许朋友在线同步观看视频并实时聊天的网站。用户无需注册，通过昵称即可创建或加入房间，实现视频的严格同步播放和即时聊天互动。

## 功能优先级

### 核心功能（MVP必须功能）
1. **房间系统**：创建/加入房间，房间生命周期管理
2. **视频同步播放**：外部URL播放，严格同步控制
3. **基础聊天**：文本消息，用户加入/离开通知
4. **基本用户系统**：访客昵称，无需注册

### 增强功能（MVP后可添加）
1. **表情系统**：Emoji支持，图片表情
2. **文件上传**：本地上传视频，自定义表情上传
3. **用户中心**：观看历史，个人设置，头像管理
4. **房间发现**：公开房间列表，搜索功能

## 功能列表

### 1. 房间系统
- 创建房间：设置房间名称、最大人数（2-10人）、公开/私密选项
- 加入方式：6位房间号（ABC123）或邀请链接
- 房间生命周期：最后一人离开后房间自动解散，数据保存至MySQL
- 公开房间列表：用户可浏览并加入公开房间

### 2. 视频同步播放
- 视频来源：外部URL（如bilibili）、本地上传、内置示例视频
- 播放控制：严格同步，任何人的播放/暂停/跳转操作实时同步给所有成员
- 播放器功能：支持进度控制、音量调节、全屏模式

### 3. 聊天系统
- 消息类型：文本、Emoji、图片表情
- 系统通知：用户加入/离开房间通知
- 聊天历史：消息存储到MySQL，支持时间戳查询
- 在线成员列表：实时显示房间内所有用户

### 4. 用户系统
- 无需注册：使用访客昵称加入
- 个人设置：修改昵称、选择头像、管理自定义表情
- 本地Session：浏览器存储用户会话信息
- 观看历史：记录用户参与过的房间

### 5. 表情包系统
- 系统表情：预置Emoji和常用图片表情
- 自定义表情：用户上传个人表情图片（PNG/JPG/GIF，最大2MB）
- 表情管理：收藏、删除、分类管理

## 前端设计风格

### 设计理念
**"自然温馨"** - 打造放松舒适的观影聊天体验

### 设计原则
1. **自然有机**：大圆角（20-28px）创造有机形态，柔和渐变与阴影模仿自然光照
2. **温馨舒适**：充足留白，柔和对比度，温暖中性色调
3. **细腻动效**：平滑过渡（250ms），悬停视觉反馈，淡入上浮动画
4. **无障碍设计**：WCAG AA颜色对比度，明确焦点状态

### 色彩系统
```css
:root {
  /* 主色调 */
  --bg-primary: #f7f5f0;        /* 米白背景 */
  --bg-secondary: #efece6;       /* 米白略深 */
  --bg-tertiary: #e5e0d6;       /* 米白更深 */
  
  /* 强调色 */
  --accent-primary: #a7c3a6;     /* 灰绿 */
  --accent-secondary: #c4d4bc;  /* 灰绿浅 */
  --accent-caramel: #c4824a;    /* 焦糖棕 */
  --accent-caramel-light: #d9a066; /* 焦糖浅 */
  
  /* 功能色 */
  --text-primary: #2d3436;       /* 深灰 */
  --text-secondary: #636e72;     /* 中灰 */
  --text-muted: #9ca3af;         /* 浅灰 */
  
  /* 状态色 */
  --success: #a7c3a6;
  --error: #e07a5f;
  --online: #81b29a;
}
```

### 字体系统
```css
/* 标题：Noto Ser SC - 优雅中文衬线 */
--font-display: 'Noto Serif SC', 'Source Han Serif SC', serif;

/* 正文：无衬线 */
--font-body: 'Nunito', 'PingFang SC', sans-serif;

/* 数字 */
--font-mono: 'JetBrains Mono', monospace;
```

### 组件风格
- **圆角**：按钮24px，卡片24px，输入框20px
- **阴影**：`0 4px 20px rgba(0,0,0,0.08)` + `0 8px 30px rgba(0,0,0,0.04)`
- **间距**：宽松设计，充足呼吸感

### 动效
- **页面进入**：`opacity: 0; transform: translateY(20px)` → `1, 0`
- **悬停**：`transform: translateY(-2px)` + 阴影加深
- **过渡**：`transition: all 0.25s ease`

## 技术架构

### 技术栈选择
- **前端**: Vue 3 + Vite + Pinia + Vue Router + socket.io-client + Video.js
- **后端**: Spring Boot 3.x + netty-socketio + Spring Data JPA + MySQL + Redis
- **实时通信**: Socket.io（前后端统一）
- **数据库**: MySQL 8.0（持久化存储：房间、消息、用户数据）
- **缓存**: Redis 7.x（会话、房间状态、在线用户、热门数据）
- **文件存储**: 本地文件系统（支持扩展为云存储）
- **部署**: 云服务器（Docker容器化）

### Redis缓存设计
```
Redis键值设计：

1. 会话缓存（Session）
   Key: session:{sessionId}
   Value: {nickname, avatar, createdAt, lastActiveAt}
   TTL: 7天（无活动则过期）

2. 房间状态缓存（Room State）
   Key: room:{roomId}:state
   Value: {name, maxUsers, isPublic, videoUrl, videoTime, isPlaying, users:[]}
   TTL: 房间解散后清除

3. 在线用户集合（Online Users）
   Key: room:{roomId}:users
   Value: Set[{sessionId}, ...]
   TTL: 房间解散后清除

4. 公开房间列表（Public Rooms）
   Key: public:rooms
   Value: Sorted Set [{roomId, score: updatedAt}]
   TTL: 实时更新

5. 用户最近房间（User History）
   Key: user:{sessionId}:history
   Value: List[{roomId, joinedAt}, ...]
   TTL: 30天

6. Socket.io会话映射（Socket Mapping）
   Key: socket:{socketId}
   Value: {sessionId, roomId}
   TTL: 连接断开后清除
```

### 数据流转设计
```
读操作流程：
1. 查询优先从Redis获取
2. Redis未命中时从MySQL获取
3. 写入Redis缓存后返回

写操作流程：
1. 先更新MySQL（持久化）
2. 再更新Redis（缓存失效或更新）
3. 通过Socket.io广播变更

典型场景：
- 用户加入房间 → Redis更新在线列表 → 广播user-joined
- 视频播放 → Redis更新房间状态 → 广播video:sync
- 发送消息 → MySQL存储 → Redis缓存最新消息 → 广播chat:message
```

### 架构图
```
[用户浏览器] Vue 3 SPA
      ↓
[HTTP/REST]     [Socket.io]
      ↓              ↓
[Spring Boot应用]
      ↓              ↓
[MySQL数据库] ←→ [Redis缓存]
```

### 组件设计
```
前端结构：
src/
├── views/          # 页面组件
│   ├── HomeView.vue       # 首页
│   ├── RoomView.vue       # 房间页面
│   ├── CreateRoomView.vue # 创建房间
│   ├── JoinRoomView.vue   # 加入房间
│   ├── HistoryView.vue    # 观看历史
│   └── ProfileView.vue    # 个人中心
├── components/     # 可复用组件
│   ├── video/     # 视频相关组件
│   ├── chat/      # 聊天相关组件
│   ├── room/      # 房间相关组件
│   └── common/    # 通用组件
├── stores/        # Pinia状态管理
└── services/      # API和Socket服务

后端结构：
src/main/java/com/watchtogether/
├── controller/    # REST控制器
├── service/       # 业务逻辑
├── repository/    # 数据访问层
├── config/        # 配置类（Socket.io配置）
├── model/         # 数据模型
├── dto/           # 数据传输对象
└── WebSocketHandler.java  # Socket.io事件处理器
```

## 数据模型设计

### MySQL表结构

#### 1. rooms表（房间信息）
```sql
CREATE TABLE rooms (
  id VARCHAR(6) PRIMARY KEY,          -- 6位房间号：ABC123
  name VARCHAR(100),                  -- 房间名称
  max_users INT DEFAULT 5,            -- 最大人数：2-10
  is_public BOOLEAN DEFAULT true,     -- 是否公开
  creator_session_id VARCHAR(50),     -- 创建者会话ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. sessions表（访客会话）
```sql
CREATE TABLE sessions (
  id VARCHAR(50) PRIMARY KEY,         -- sess_xyz789
  nickname VARCHAR(50) DEFAULT '游客', -- 用户昵称
  avatar VARCHAR(100) DEFAULT 'avatar1.png', -- 头像
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. room_participants表（房间参与记录）
```sql
CREATE TABLE room_participants (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  room_id VARCHAR(6),
  session_id VARCHAR(50),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP NULL,
  INDEX idx_room (room_id),
  INDEX idx_session (session_id)
);
```

#### 4. chat_messages表（聊天记录）
```sql
CREATE TABLE chat_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  room_id VARCHAR(6),
  session_id VARCHAR(50),
  content TEXT,                       -- 消息内容
  message_type ENUM('text', 'emoji', 'image') DEFAULT 'text',
  emoji_id INT NULL,                  -- 关联的表情ID（可选）
  emoji_type ENUM('emoji', 'image') NULL, -- 表情类型
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 服务器时间戳
  INDEX idx_room_created (room_id, created_at)
);
```

#### 5. emoji_categories表（表情分类）
```sql
CREATE TABLE emoji_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50),                   -- 分类名称
  type ENUM('emoji', 'image') NOT NULL, -- 表情类型
  sort_order INT DEFAULT 0            -- 排序
);
```

#### 6. emojis表（表情库）
```sql
CREATE TABLE emojis (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT,                    -- 分类ID
  code VARCHAR(50),                   -- 表情代码
  display_text VARCHAR(50),           -- 显示文本
  image_url VARCHAR(255),             -- 图片URL
  type ENUM('emoji', 'image') NOT NULL,
  is_default BOOLEAN DEFAULT true,    -- 是否系统默认
  owner_session_id VARCHAR(50) NULL,  -- 所有者（用户自定义表情）
  original_filename VARCHAR(255) NULL, -- 原始文件名
  file_size INT NULL,                 -- 文件大小
  mime_type VARCHAR(50) NULL,         -- 文件类型
  is_active BOOLEAN DEFAULT true,     -- 是否可用
  upload_at TIMESTAMP NULL,           -- 上传时间
  sort_order INT DEFAULT 0,           -- 排序
  INDEX idx_category (category_id),
  INDEX idx_owner (owner_session_id)
);
```

#### 7. user_emoji_favorites表（用户收藏）
```sql
CREATE TABLE user_emoji_favorites (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(50),
  emoji_id INT,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_emoji (session_id, emoji_id)
);
```

### Redis实时状态存储
```java
// Redis键值设计（Java对象序列化）

// 1. 房间基本信息（Hash）
room:{roomId} → {
  name: String,
  maxUsers: int,
  isPublic: boolean,
  creatorSessionId: String,
  createdAt: timestamp,
  videoUrl: String,
  videoTime: double,
  isPlaying: boolean,
  userCount: int
}

// 2. 房间在线用户（Hash）
room:{roomId}:users → {
  {sessionId}: {nickname, avatar, socketId, joinTime}
}

// 3. Socket连接映射（String）
socket:{socketId} → {sessionId, roomId}

// 4. 用户会话数据（Hash）
session:{sessionId} → {
  nickname: String,
  avatar: String,
  createdAt: timestamp,
  lastActiveAt: timestamp
}

// 5. 公开房间集合（Sorted Set）
public:rooms → {roomId: score(updatedAt)}

// 6. 用户房间历史（List）
user:{sessionId}:history → [{roomId, joinedAt}, ...]
```

## API设计

### REST API端点

#### 房间管理
```
POST   /api/rooms                    # 创建房间
GET    /api/rooms                    # 获取公开房间列表
GET    /api/rooms/{id}               # 获取房间信息
DELETE /api/rooms/{id}               # 删除房间（房主）
GET    /api/rooms/{id}/invite        # 生成邀请链接
```

#### 用户会话
```
POST   /api/sessions                 # 创建访客会话
GET    /api/sessions/{id}            # 获取会话信息
PUT    /api/sessions/{id}            # 更新昵称/头像
GET    /api/sessions/{id}/rooms      # 获取用户历史房间
```

#### 聊天历史
```
GET    /api/rooms/{id}/messages      # 获取聊天历史（分页）
```

#### 视频管理
```
POST   /api/videos/upload            # 上传视频文件
GET    /api/videos/samples           # 获取内置示例视频列表
```

#### 表情管理
```
GET    /api/emojis/categories        # 获取表情分类
GET    /api/emojis                   # 获取表情列表
GET    /api/emojis/my-emojis         # 获取用户自定义表情
POST   /api/emojis/upload            # 上传自定义表情
POST   /api/emojis/favorites         # 收藏表情
DELETE /api/emojis/favorites/{id}    # 取消收藏
DELETE /api/emojis/my-emojis/{id}    # 删除自定义表情
```

### Socket.io事件设计

#### 连接和房间事件
```
前端发送：
- 'join-room': {roomId, sessionId, nickname}
- 'leave-room': {roomId, sessionId}

后端广播：
- 'user-joined': {sessionId, nickname, avatar}
- 'user-left': {sessionId, nickname}
- 'room-state': {roomInfo, users, videoState}
```

#### 视频同步事件
```
前端发送：
- 'video:play': {roomId, time}
- 'video:pause': {roomId}
- 'video:seek': {roomId, time}
- 'video:url-change': {roomId, url}

后端广播：
- 'video:sync-play': {time}
- 'video:sync-pause': {}
- 'video:sync-seek': {time}
- 'video:sync-url-change': {url}
```

#### 聊天事件
```
前端发送：
- 'chat:message': {
    roomId, 
    content, 
    type,        // 'text' | 'emoji' | 'image'
    senderId, 
    senderNickname,
    timestamp    // 客户端时间戳
  }

后端处理：
1. 验证消息内容
2. 存储到MySQL（包含服务器时间戳）
3. 广播到房间：
   'chat:message': {
     id,          // 消息ID
     content,     // 消息内容
     type,        // 消息类型
     senderId,    // 发送者ID
     senderNickname, // 发送者昵称
     timestamp,   // 客户端时间戳
     createdAt    // 服务器时间戳
   }
```

## 页面设计

### 1. 首页 (`/`)
- 顶部：Logo + 标题 "一起看"
- 中上方：两个大按钮「创建房间」「加入房间」
- 中下方：房间卡片列表（标签切换：「公开房间」「我的房间」）
- 底部导航：历史、个人中心

### 2. 创建房间页 (`/create`)
- 输入昵称（自动生成默认）
- 房间名称（可选，默认"房间+编号"）
- 最大人数滑块（2-10）
- 公开/私密开关
- 「创建」按钮 → 跳转到房间页面

### 3. 加入房间页 (`/join`)
- 输入昵称（链接进入时自动填充）
- 输入房间号 或 粘贴邀请链接
- 邀请链接自动识别房间号

### 4. 房间页 (`/room/:id`)
- **左侧（70%）**：视频播放器（Video.js）
- **右侧（30%）**：
  - 顶部：房间信息（名称、人数、邀请链接复制）
  - 中部：在线成员列表
  - 底部：聊天区域 + 发送框（支持文本和表情）
- **视频控制区**：播放/暂停、进度条、音量、全屏按钮
- **视频源切换**：URL输入框、本地上传按钮、内置视频选择器

### 5. 观看历史页 (`/history`)
- 按时间倒序的房间记录卡片
- 卡片信息：房间名、最后观看时间、参与人数
- 「再次加入」按钮
- 「清空历史」按钮

### 6. 个人中心页 (`/profile`)
- 基本信息：修改昵称、选择头像（预设库）
- 表情管理：我的收藏、我的上传表情
- 上传表情：选择图片、输入名称、上传按钮
- 观看统计：总观看时长、参与房间数
- 清除记录：清除本地会话和历史记录

## 文件存储方案

### 本地文件系统结构
```
uploads/
├── videos/              # 用户上传的视频
│   ├── {roomId}/       # 按房间分目录
│   └── temp/           # 临时上传文件
├── emojis/             # 表情图片
│   ├── system/         # 系统预置表情
│   └── user/           # 用户自定义表情
│       └── user_{sessionId}_{timestamp}_{random}.{ext}
└── avatars/            # 用户头像（预设）
    └── avatar{1-20}.png
```

### 文件上传限制
- **视频文件**: MP4/WEBM/OGG格式，最大100MB
- **表情图片**: PNG/JPG/GIF格式，最大2MB，建议尺寸128x128像素
- **上传命名**: 使用UUID或时间戳+随机数避免文件名冲突
- **安全验证**: 文件类型验证、大小限制、病毒扫描（可选）

## 安全考虑

### 1. 输入验证和过滤
- 所有用户输入进行XSS过滤
- 聊天内容敏感词过滤
- 文件上传类型和大小限制

### 2. 权限控制
- 房间操作权限：只有房主可以删除房间
- 视频控制：所有房间成员都可以控制播放
- 文件访问：用户只能访问自己上传的文件

### 3. 会话安全
- Session ID使用安全的随机生成算法
- 重要操作验证Session有效性
- 定期清理过期Session和房间数据

### 4. 视频URL安全
- 验证外部视频URL的有效性和安全性
- 防止恶意重定向和钓鱼链接
- 支持HTTPS协议的视频源

## 性能优化

### 1. 前端优化
- 使用Vite进行快速构建和HMR
- 组件懒加载和路由懒加载
- 图片和表情使用懒加载和压缩
- WebSocket连接复用

### 2. 后端优化
- 数据库连接池配置
- 频繁查询的数据使用缓存
- 聊天消息分页查询
- Socket.io连接的心跳检测和断线重连

### 3. 数据库优化
- 合适的索引设计
- 定期清理过期数据（30天前的聊天记录）
- 分表策略（当数据量大时）

## 部署方案

### 1. 开发环境
- 本地运行：前端Vite开发服务器 + 后端Spring Boot
- 数据库：本地MySQL或Docker MySQL容器
- 实时通信：本地Socket.io服务器

### 2. 生产环境
- **服务器配置**: 2核4G云服务器（腾讯云/阿里云）
- **部署方式**: Docker容器化部署
  ```
  # Docker Compose配置
  version: '3'
  services:
    mysql:
      image: mysql:8.0
      environment:
        MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
        MYSQL_DATABASE: watchtogether
      volumes:
        - mysql_data:/var/lib/mysql
    
    redis:
      image: redis:7-alpine
      volumes:
        - redis_data:/data
    
    app:
      build: .
      ports:
        - "80:18080"
        - "443:8443"
      environment:
        SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/watchtogether
        SPRING_DATASOURCE_USERNAME: root
        SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
        SPRING_DATA_REDIS_HOST: redis
        SPRING_DATA_REDIS_PORT: 6379
        FILE_UPLOAD_DIR: /app/uploads
      volumes:
        - ./uploads:/app/uploads
      depends_on:
        - mysql
        - redis

  volumes:
    mysql_data:
    redis_data:
  ```

### 3. 可选扩展
- **云存储**: 文件上传量增大时，可迁移到云存储（S3/OSS）
- **CDN**: 静态资源（表情图片、预设头像）使用CDN加速
- **监控**: 集成Prometheus + Grafana监控系统性能

## 开发计划

### Phase 1: 基础设施（2周）
1. 项目初始化：Spring Boot + Vue 3 项目搭建
2. MySQL数据库：表结构创建、Redis连接配置
3. 基础框架：日志、异常处理、统一响应格式
4. 前端基础：Vite + Vue 3 + Pinia + Router 搭建
5. 前后端联调基础框架

### Phase 2: 核心MVP功能（3周）
**目标：实现房间创建/加入 + 视频同步 + 基础聊天**

1. **用户会话系统**
   - Session创建/查询API
   - Redis会话缓存
   - 前端本地存储

2. **房间系统**
   - 房间创建/查询/删除API
   - Redis房间状态存储
   - 邀请链接生成

3. **Socket.io集成**
   - 连接管理、房间加入/离开事件
   - 用户上下线通知
   - Redis在线用户管理

4. **视频同步**
   - 视频播放器集成（Video.js）
   - 播放/暂停/跳转同步
   - Redis视频状态缓存

5. **基础聊天**
   - 文本消息发送/接收
   - MySQL消息持久化
   - 消息时间戳显示

### Phase 3: 增强功能（2周）
1. **Emoji表情支持**
2. **图片表情**
3. **用户自定义表情上传**
4. **公开房间列表**
5. **观看历史**
6. **个人中心（昵称、头像）**

### Phase 4: 优化和部署（1周）
1. Redis缓存优化
2. 安全性增强（输入验证、敏感词过滤）
3. Docker容器化部署
4. 测试和Bug修复

## 成功指标

### 功能完成度（MVP）
- 用户能够创建和加入房间
- 视频播放严格同步
- 实时聊天功能正常
- Emoji表情支持

### 功能完成度（增强版）
- 图片表情和自定义表情
- 公开房间列表
- 观看历史和个人中心

### 性能指标
- 房间创建时间 < 1秒
- 消息延迟 < 100毫秒
- 视频同步延迟 < 200毫秒
- 页面加载时间 < 2秒

### 用户体验
- 界面美观，操作流畅
- 错误提示清晰
- 移动端适配良好
- 浏览器兼容性好

---

**设计版本**: v1.1（更新Redis设计，划分功能优先级）  
**设计日期**: 2026年2月28日  
**设计者**: opencode  
**状态**: 待批准 ✅