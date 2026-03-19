# ArtPlayer 集成实现计划

## 任务分解

### 阶段 1：ArtPlayer 基础集成

| # | 任务 | 文件 | 验证标准 |
|---|------|------|----------|
| 1.1 | 安装依赖 | package.json | `npm install artplayer artplayer-plugin-danmuku` |
| 1.2 | 创建 ArtPlayerWrapper.vue | components/video/ArtPlayerWrapper.vue | 组件可渲染视频，支持播放/暂停/跳转 |
| 1.3 | 重构 VideoPlayer.vue | components/video/VideoPlayer.vue | 使用 ArtPlayerWrapper 替代原生 video |
| 1.4 | 适配 Socket 同步事件 | components/video/VideoPlayer.vue | 多人房间视频同步正常 |
| 1.5 | 集成 VideoControls | components/video/VideoPlayer.vue | 外部控制条可控制播放器 |

### 阶段 2：聊天-弹幕同步

| # | 任务 | 文件 | 验证标准 |
|---|------|------|----------|
| 2.1 | 创建 DanmakuBridge.vue | components/video/DanmakuBridge.vue | 组件可发送和接收弹幕 |
| 2.2 | 修改 MessageInput.vue | components/chat/MessageInput.vue | 新增"发送弹幕"模式选项 |
| 2.3 | 修改 ChatPanel.vue | components/chat/ChatPanel.vue | 集成 DanmakuBridge |
| 2.4 | 修改 RoomView.vue | views/RoomView.vue | 房间页面集成弹幕功能 |
| 2.5 | 测试多人弹幕同步 | - | 多人房间弹幕同步显示 |

### 阶段 3：优化与测试

| # | 任务 | 文件 | 验证标准 |
|---|------|------|----------|
| 3.1 | 弹幕样式优化 | styles/ | 弹幕显示美观，不遮挡关键内容 |
| 3.2 | 性能测试 | - | 100+ 弹幕不卡顿 |
| 3.3 | 边界情况处理 | DanmakuBridge.vue | 断网重连后状态正确 |
| 3.4 | 回滚方案实现 | VideoPlayer.vue | 环境变量可切换播放器 |

## Socket 事件扩展

```javascript
// socket.js 新增方法
function emitChatMessage(data) {
  // data.type: 'text' | 'image' | 'danmaku'
  socket?.emit('chat:message', data)
}
```

## 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| package.json | 修改 | 新增依赖 |
| components/video/ArtPlayerWrapper.vue | 新增 | ArtPlayer 封装 |
| components/video/DanmakuBridge.vue | 新增 | 弹幕桥接 |
| components/video/VideoPlayer.vue | 重构 | 使用 ArtPlayer |
| components/chat/MessageInput.vue | 修改 | 支持弹幕模式 |
| components/chat/ChatPanel.vue | 修改 | 集成桥接层 |
| views/RoomView.vue | 修改 | 集成弹幕 |
