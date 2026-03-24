# ArtPlayer 集成实现计划

## 任务分解

### 阶段 1：基础设施

| # | 任务 | 文件 | 验证标准 |
|---|------|------|----------|
| 1.1 | 安装依赖 | package.json | `npm install artplayer artplayer-plugin-danmuku` |
| 1.2 | 创建视频源识别工具 | utils/videoSource.js | 可正确识别 Bilibili、YouTube、普通视频 |
| 1.3 | 更新 roomStore | stores/room.js | videoState 包含 name 字段 |

### 阶段 2：播放器重构

| # | 任务 | 文件 | 验证标准 |
|---|------|------|----------|
| 2.1 | 创建 IframePlayer.vue | components/video/IframePlayer.vue | iframe 可嵌入 Bilibili/YouTube |
| 2.2 | 创建 ArtPlayerWrapper.vue | components/video/ArtPlayerWrapper.vue | ArtPlayer 可播放普通视频 |
| 2.3 | 重构 VideoPlayer.vue | components/video/VideoPlayer.vue | 根据源类型自动选择播放器 |
| 2.4 | 适配 Socket 同步事件 | components/video/VideoPlayer.vue | 多人房间视频同步正常 |

### 阶段 3：弹幕系统集成

| # | 任务 | 文件 | 验证标准 |
|---|------|------|----------|
| 3.1 | 创建 DanmakuBridge.vue | components/video/DanmakuBridge.vue | 可发送和接收弹幕 |
| 3.2 | 实现防重复机制 | components/video/DanmakuBridge.vue | 发送弹幕后聊天列表不重复 |
| 3.3 | 修改 MessageInput.vue | components/chat/MessageInput.vue | 新增弹幕模式切换和颜色选择 |
| 3.4 | 修改 ChatPanel.vue | components/chat/ChatPanel.vue | 集成 DanmakuBridge |

### 阶段 4：集成与优化

| # | 任务 | 文件 | 验证标准 |
|---|------|------|----------|
| 4.1 | 更新 RoomView.vue | views/RoomView.vue | 页面顶部显示视频名称 |
| 4.2 | 弹幕样式优化 | styles/ | 弹幕显示美观 |
| 4.3 | 边界情况处理 | 多个文件 | 断网重连、空视频等 |
| 4.4 | 集成测试 | - | 多人房间弹幕同步正常 |

## 防重复机制实现

```javascript
// DanmakuBridge.vue
const pendingMessages = new Set()

function sendDanmaku(text, color) {
  const tempId = `temp_${Date.now()}_${Math.random()}`
  
  // 1. 记录临时ID
  pendingMessages.add(tempId)
  
  // 2. 本地立即渲染弹幕
  playerRef.sendDanmaku({ text, color })
  
  // 3. 本地添加消息（带tempId）
  chatStore.addMessage({ ...data, tempId })
  
  // 4. 广播到服务器（不带tempId）
  socketService.emit('chat:message', { ...data })
  
  // 5. 清理（超时保护）
  setTimeout(() => pendingMessages.delete(tempId), 5000)
}

function handleChatMessage(data) {
  // 检查是否是自己刚发送的
  if (data.tempId && pendingMessages.has(data.tempId)) {
    pendingMessages.delete(data.tempId)
    return // 已处理，忽略
  }
  
  // 其他客户端的消息
  chatStore.addMessage(data)
  if (data.type === 'danmaku') {
    playerRef.sendDanmaku({ text: data.content, color: data.color })
  }
}
```
