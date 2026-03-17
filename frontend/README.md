# 一起看 (WatchTogether)

一个实时同步观影的 Web 应用，支持多人同时观看视频、实时聊天、视频控制同步。用户可以创建房间、邀请好友，享受同步的观影体验。

## 主要功能

- **房间管理**：创建公开/私有房间，生成邀请码，查看房间列表
- **实时同步**：视频播放、暂停、跳转操作实时同步给所有房间成员
- **多种视频源**：支持 URL 输入、本地视频上传、示例视频
- **实时聊天**：文字聊天、表情发送、系统消息通知
- **用户管理**：匿名会话、昵称设置、历史记录查看
- **响应式设计**：适配桌面和移动端设备
- **Mock 模式**：支持无后端服务的离线开发模式

## 技术栈

### 前端框架
- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 前端构建工具
- **Pinia** - 状态管理
- **Vue Router** - 路由管理

### 核心库
- **Socket.io-client** - 实时 WebSocket 通信
- **Video.js** - 视频播放器
- **CSS3 + Flexbox/Grid** - 现代布局

### 开发工具
- **Node.js 18+** - 运行时环境
- **npm** - 包管理器
- **Docker** - 容器化部署
- **Nginx** - 生产环境 Web 服务器

## 项目结构

```
watchtogether-frontend/
├── src/
│   ├── views/              # 页面组件
│   │   ├── HomeView.vue    # 首页
│   │   ├── CreateRoomView.vue
│   │   ├── JoinRoomView.vue
│   │   ├── RoomView.vue    # 房间主界面
│   │   ├── ProfileView.vue
│   │   └── HistoryView.vue
│   ├── components/         # 可复用组件
│   │   ├── chat/          # 聊天相关组件
│   │   ├── video/         # 视频播放器组件
│   │   ├── room/          # 房间相关组件
│   │   └── common/        # 通用组件
│   ├── stores/            # Pinia 状态管理
│   │   ├── room.js       # 房间状态
│   │   ├── chat.js       # 聊天状态
│   │   └── user.js       # 用户状态
│   ├── services/          # 服务层
│   │   ├── api.js        # REST API 客户端
│   │   └── socket.js     # Socket.io 服务
│   ├── router/           # 路由配置
│   │   └── index.js
│   ├── styles/           # 样式文件
│   │   ├── main.css
│   │   └── variables.css
│   ├── assets/           # 静态资源
│   ├── App.vue           # 根组件
│   └── main.js           # 应用入口
├── public/               # 静态文件
├── dist/                # 构建输出目录
├── package.json         # 项目配置和依赖
├── vite.config.js       # Vite 配置
├── Dockerfile          # Docker 构建配置
├── docker-compose.yml  # Docker Compose 配置
├── nginx.conf          # Nginx 配置
├── index.html          # HTML 模板
├── .env.development    # 开发环境变量
└── .env.production     # 生产环境变量
```

## 安装与运行

### 环境要求

- Node.js 18 或更高版本
- npm 8 或更高版本
- 现代浏览器（Chrome 90+, Firefox 88+, Safari 14+）

### 开发环境

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd watchTogether/frontend
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.development .env.local
   # 编辑 .env.local 文件，根据需要调整配置
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```
   
   开发服务器将在 http://localhost:3000 启动，支持热重载。

### Mock 模式

项目默认启用 Mock 模式，无需后端服务即可运行完整功能：

```bash
# 确保 .env.development 中的 VITE_USE_MOCK=true
npm run dev
```

## 构建与部署

### 生产构建

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 本地预览构建结果

```bash
npm run preview
```

### Docker 部署

#### 使用 Docker Compose（推荐）

```bash
# 启动完整服务栈（前端 + 后端 + 数据库）
docker-compose up -d
```

访问 http://localhost:3000

#### 单独构建前端镜像

```bash
# 构建镜像
docker build -t watchtogether-frontend .

# 运行容器
docker run -p 3000:80 watchtogether-frontend
```

### Nginx 配置

生产环境使用 Nginx 作为反向代理，配置文件位于 `nginx.conf`，支持：

- Vue Router History 模式
- 静态资源长期缓存
- Gzip 压缩
- API 和 WebSocket 代理

## 环境变量配置

### 开发环境 (.env.development)

```env
# 开发环境配置
VITE_APP_TITLE=一起看 (开发版)
VITE_API_BASE_URL=http://localhost:18080/api
VITE_SOCKET_URL=http://localhost:19090
VITE_USE_MOCK=true
VITE_APP_VERSION=1.0.0-dev
```

### 生产环境 (.env.production)

```env
# 生产环境配置
VITE_APP_TITLE=一起看
VITE_API_BASE_URL=/api
VITE_SOCKET_URL=/
VITE_USE_MOCK=false
VITE_APP_VERSION=1.0.0
```

### 变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| VITE_APP_TITLE | 应用标题 | 一起看 |
| VITE_API_BASE_URL | API 基础地址 | /api |
| VITE_SOCKET_URL | WebSocket 服务器地址 | / |
| VITE_USE_MOCK | 是否启用 Mock 模式 | false |
| VITE_APP_VERSION | 应用版本 | 1.0.0 |

## 测试

项目目前尚未集成测试框架。建议添加以下测试：

```bash
# 安装测试框架（建议）
npm install -D vitest @vue/test-utils jsdom

# 运行测试
npm test
```

### 测试覆盖目标
- 组件单元测试（覆盖率 > 80%）
- 状态管理测试
- API 服务测试
- Socket 服务测试
- E2E 测试（建议使用 Playwright）

## 开发指南

### 架构说明

1. **组件架构**
   - 视图组件（Views）：页面级组件，负责业务逻辑
   - 展示组件（Components）：可复用 UI 组件
   - 容器组件：连接状态管理和展示组件

2. **状态管理**
   - 使用 Pinia 进行集中状态管理
   - 按功能模块划分 store（room, chat, user）
   - 状态响应式更新，驱动 UI 自动刷新

3. **服务层**
   - API 服务：封装 REST API 调用，支持 Mock 模式
   - Socket 服务：管理 WebSocket 连接和事件

4. **路由配置**
   - 使用 Vue Router 4
   - 支持异步组件懒加载
   - 路由守卫可扩展

### 代码规范

1. **命名约定**
   - 组件：PascalCase (如 `VideoPlayer.vue`)
   - 变量/函数：camelCase
   - 常量：UPPER_SNAKE_CASE
   - CSS 类名：kebab-case

2. **文件组织**
   - 一个文件只导出一个主要组件/类/函数
   - 相关文件按功能模块分组
   - 避免过大的文件（建议 < 400 行）

3. **Vue 3 最佳实践**
   - 使用 Composition API 和 `<script setup>`
   - 响应式数据使用 `ref` 和 `reactive`
   - 计算属性使用 `computed`
   - 生命周期钩子使用 `onMounted`, `onUnmounted` 等

### 新增功能流程

1. **添加新页面**
   ```bash
   # 1. 在 src/views/ 创建 Vue 组件
   # 2. 在 src/router/index.js 添加路由配置
   # 3. 在相应位置添加导航链接
   ```

2. **添加新组件**
   ```bash
   # 1. 在 src/components/ 合适目录创建组件
   # 2. 导出组件并在父组件中导入使用
   ```

3. **添加新 API**
   ```bash
   # 1. 在 src/services/api.js 添加 API 函数
   # 2. 在相应的 store 中调用 API
   # 3. 在组件中使用 store 方法
   ```

## 贡献指南

1. **Fork 项目**
2. **创建特性分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **提交更改**
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
4. **推送到分支**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **创建 Pull Request**

### 提交信息规范

使用约定式提交：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

### 代码审查要求

- 通过 ESLint 检查
- 通过 TypeScript 类型检查（如启用）
- 添加必要的测试
- 更新相关文档

## 故障排除

### 常见问题

1. **开发服务器无法启动**
   - 检查端口 3000 是否被占用
   - 检查 Node.js 版本是否符合要求
   - 删除 `node_modules` 和 `package-lock.json` 后重装依赖

2. **Socket 连接失败**
   - 检查 `VITE_SOCKET_URL` 配置
   - 确认后端服务是否运行
   - 检查浏览器控制台错误信息

3. **视频无法播放**
   - 检查视频 URL 是否有效
   - 确认视频格式是否支持（MP4, WebM, Ogg）
   - 检查浏览器是否支持 HTML5 视频

4. **Mock 模式问题**
   - 确保 `VITE_USE_MOCK=true`
   - 清除浏览器缓存
   - 检查控制台 Mock 日志

### 调试技巧

1. **启用详细日志**
   ```javascript
   // 在代码中添加调试日志
   console.log('[Debug]', variable)
   
   // 查看 Socket 事件
   socketService.on('*', (event, data) => {
     console.log(`[Socket] ${event}:`, data)
   })
   ```

2. **浏览器开发者工具**
   - Network 标签：查看 API 请求和响应
   - Console 标签：查看日志和错误
   - Vue Devtools：调试 Vue 组件状态

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 联系方式

- 项目仓库：[GitHub Repository URL]
- 问题反馈：[GitHub Issues]
- 功能建议：[GitHub Discussions]

---

**一起看** - 让观影不再孤单，与朋友共享每一个精彩瞬间！