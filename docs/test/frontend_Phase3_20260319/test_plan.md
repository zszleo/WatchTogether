# WatchTogether 前端测试计划

## 1. 测试目标

为 WatchTogether 前端应用建立完整的测试体系，确保：
- 核心功能稳定可靠
- 用户交互体验流畅
- 代码质量达到 80% 覆盖率要求
- 支持持续集成/持续部署 (CI/CD)

## 2. 测试范围

### 2.1 核心功能模块
1. **房间管理**：创建、加入、离开房间
2. **视频同步**：播放、暂停、进度同步、播放列表管理
3. **实时聊天**：消息发送、接收、表情支持
4. **用户系统**：会话管理、个人资料

### 2.2 组件覆盖
| 模块 | 组件 | 优先级 |
|------|------|--------|
| 视频 | VideoPlayer.vue, VideoControls.vue | P0 |
| 聊天 | ChatPanel.vue, MessageInput.vue, MessageList.vue | P0 |
| 房间 | RoomForm.vue, RoomView.vue | P0 |
| 页面 | HomeView, CreateRoomView, JoinRoomView | P1 |
| 通用 | ErrorComponent.vue, LoadingSpinner.vue | P2 |

### 2.3 服务层
- `services/api.js` (REST API 客户端)
- `services/socket.js` (WebSocket 服务)
- `utils/request.js` (HTTP 请求封装)

### 2.4 状态管理
- `stores/room.js` (房间状态)
- `stores/chat.js` (聊天状态)
- `stores/user.js` (用户状态)

## 3. 测试策略

### 3.1 测试金字塔
```
        E2E 测试 (10%)
       ↗           ↖
    集成测试 (30%)
       ↗           ↖
    单元测试 (60%)
```

### 3.2 测试类型

#### 单元测试 (Vitest)
- **Store 测试**：状态变更、action 逻辑、getter 计算
- **工具函数测试**：请求封装、数据格式化、工具方法
- **服务层测试**：API 调用、Socket 事件处理

#### 组件测试 (Vue Test Utils)
- **渲染测试**：组件正确渲染、props 传递
- **交互测试**：用户事件触发、表单提交
- **状态响应测试**：store 状态变化时组件更新

#### 集成测试
- **组件-Store 集成**：组件与 Pinia store 交互
- **API 集成**：请求发送、响应处理、错误处理
- **Socket 集成**：事件监听、消息传递

#### E2E 测试 (Playwright-cli)
- **用户流程**：完整用户操作路径
- **跨浏览器**：Chrome, Firefox, Safari
- **响应式**：不同屏幕尺寸

## 4. 测试用例设计

### 4.1 单元测试用例

#### Store: room.js
```javascript
describe('Room Store', () => {
  test('createRoom - 正常创建房间')
  test('createRoom - 参数验证失败')
  test('joinRoom - 成功加入房间')
  test('joinRoom - 房间不存在')
  test('leaveRoom - 清理状态')
  test('updateVideoState - 同步播放状态')
  test('updateUserList - 更新用户列表')
  test('getPublicRooms - 获取公开房间')
})
```

#### Store: chat.js
```javascript
describe('Chat Store', () => {
  test('sendMessage - 发送消息')
  test('receiveMessage - 接收消息')
  test('addEmoji - 添加表情')
  test('clearMessages - 清空消息')
})
```

#### Store: user.js
```javascript
describe('User Store', () => {
  test('setSession - 设置会话')
  test('clearSession - 清除会话')
  test('updateProfile - 更新资料')
  test('isAuthenticated - 验证状态')
})
```

#### Service: socket.js
```javascript
describe('Socket Service', () => {
  test('connect - 建立连接')
  test('disconnect - 断开连接')
  test('emit - 发送事件')
  test('on - 监听事件')
  test('事件监听和响应')
  test('连接异常处理')
})
```

### 4.2 组件测试用例

#### VideoPlayer.vue
```javascript
describe('VideoPlayer', () => {
  test('渲染视频播放器')
  test('接收 videoUrl prop')
  test('触发 play/pause 事件')
  test('同步外部播放状态')
  test('处理加载状态')
  test('处理错误状态')
})
```

#### ChatPanel.vue
```javascript
describe('ChatPanel', () => {
  test('渲染聊天面板')
  test('显示消息列表')
  test('发送新消息')
  test('自动滚动到最新消息')
  test('表情选择器集成')
})
```

#### RoomForm.vue
```javascript
describe('RoomForm', () => {
  test('渲染表单字段')
  test('验证必填字段')
  test('提交创建房间')
  test('提交加入房间')
  test('处理表单错误')
})
```

### 4.3 集成测试用例

#### 房间流程
```javascript
describe('房间管理流程', () => {
  test('创建房间 -> 加入房间 -> 离开房间')
  test('房间状态在组件间同步')
  test('用户列表实时更新')
})
```

#### 聊天流程
```javascript
describe('聊天消息流程', () => {
  test('发送消息 -> 显示在列表')
  test('接收他人消息 -> 实时显示')
  test('消息历史加载')
})
```

### 4.4 E2E 测试用例

#### 主要用户流程
```javascript
// 使用 playwright-cli 语法
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // 完整观看流程
  // 1. 访问首页
  await page.goto('http://localhost:3000');
  // 2. 创建房间
  await page.click('button:has-text("创建房间")');
  // 3. 上传/选择视频
  // 4. 邀请他人加入
  // 5. 同步播放视频
  // 6. 使用聊天功能
  // 7. 离开房间
  
  await browser.close();
})();
```

## 5. 测试环境

### 5.1 开发环境
- **Node.js**: 18+
- **浏览器**: Chrome (主要), Firefox, Safari
- **测试框架**: Vitest 1.1.0
- **组件测试**: Vue Test Utils 2.4.3
- **E2E**: Playwright-cli

### 5.2 CI/CD 环境
- **GitHub Actions** 或 **GitLab CI**
- **并行测试**: 支持多 worker
- **覆盖率报告**: 自动生成并上传

### 5.3 真实后端服务
- **后端服务地址**: `http://localhost:18080` (API), `http://localhost:19090` (Socket)
- **数据库**: 使用测试数据库，每次测试前清理数据
- **测试数据**: 预置测试用户和房间数据

### 5.4 测试数据管理
- **数据初始化**: 测试前运行数据库迁移和种子数据
- **数据清理**: 每个测试后清理测试产生的数据
- **数据隔离**: 使用事务或数据库快照确保测试独立性
- **测试用户**: 预置测试账号，避免依赖真实用户注册

## 6. 测试工具配置

### 6.1 Vitest 配置增强
```javascript
// vitest.config.js 扩展
export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/**/*.d.ts',
        'src/**/*.spec.js',
        'src/**/*.test.js'
      ]
    }
  }
})
```

### 6.2 测试工具安装
```bash
npm install -D @vue/test-utils vitest @vitest/coverage-v8 jsdom
npm install -D @playwright/cli  # E2E 测试
# 运行 E2E 测试: npx playwright-cli test
# 录制测试脚本: npx playwright-cli codegen
```

## 7. 测试进度计划

### 阶段 1：基础建设 (1 周) ✓ 已完成
- [x] 配置测试框架
- [x] 安装额外测试依赖
- [x] 创建测试工具函数
- [x] 配置测试数据库和后端服务连接

### 阶段 2：单元测试 (2 周) ✓ 已完成
- [x] Store 单元测试 (room, chat, user)
- [x] Service 单元测试 (api, socket, request)
- [x] 工具函数测试

### 阶段 3：组件测试 (2 周) ✓ 已完成
- [x] 通用组件测试 (ErrorComponent, LoadingSpinner)
- [x] 核心组件测试 (VideoPlayer, ChatPanel)
- [x] 页面组件测试 (所有 Views)

### 阶段 4：集成测试 (1 周) ✓ 已完成
- [x] 组件-Store 集成测试 (4个测试通过)
- [x] API 集成测试 (7个测试通过, 2个跳过)
- [x] Socket 集成测试 (10个测试通过, 含 system:message 功能)

### 阶段 5：E2E 测试 (1 周)
- [ ] 配置 Playwright-cli
- [ ] 编写核心流程测试
- [ ] 跨浏览器测试

### 阶段 6：优化和文档 (1 周)
- [ ] 提高测试覆盖率
- [ ] 优化测试性能
- [ ] 编写测试文档

## 8. 质量标准

### 8.1 覆盖率要求
- **行覆盖率**: ≥ 80%
- **分支覆盖率**: ≥ 80%
- **函数覆盖率**: ≥ 80%
- **语句覆盖率**: ≥ 80%

### 8.2 测试质量
- 测试独立性：每个测试可独立运行
- 测试可重复性：多次运行结果一致
- 测试可维护性：易于理解和修改

## 9. 风险与应对

### 9.1 技术风险
| 风险 | 影响 | 应对措施 |
|------|------|----------|
| Socket 测试依赖后端服务 | 中 | 确保后端服务稳定，添加重试机制 |
| 视频播放测试困难 | 中 | 使用测试视频文件，模拟播放事件 |
| 异步操作多 | 低 | 使用 Vitest 异步测试支持 |
| 数据库状态污染 | 中 | 每个测试前重置数据库状态 |

### 9.2 进度风险
| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 测试用例编写耗时 | 高 | 优先核心功能，逐步扩展 |
| 环境配置问题 | 中 | 提前准备详细文档 |
| 团队技能不足 | 中 | 提供测试培训 |

## 10. 交付物

1. **测试代码**: 所有测试文件
2. **测试报告**: 覆盖率报告、测试结果
3. **测试文档**: 测试指南、最佳实践
4. **CI/CD 配置**: 自动化测试流水线

---

**文档版本**: v1.5  
**创建日期**: 2026-03-19  
**更新日期**: 2026-03-20  
**负责人**: 前端团队