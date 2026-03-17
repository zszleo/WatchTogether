# WatchTogether 前端实施计划

> **For Claude:** Use superpowers:executing-plans to implement this plan.

**Goal:** 构建 Vue 3 前端应用，实现房间创建/加入、视频播放、聊天等核心功能

**Architecture:** Vue 3 SPA + Vite + Pinia + Vue Router，使用 Socket.io-client 进行实时通信

**Tech Stack:** Vue 3, Vite, Pinia, Vue Router, socket.io-client, Video.js

---

## Phase 1: 基础设施

### Task 1: 项目初始化

**Files:**
- Create: `frontend/index.html`
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/src/main.js`
- Create: `frontend/src/App.vue`

**Step 1: 创建 package.json**

```json
{
  "name": "watchtogether-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.5",
    "pinia": "^2.1.7",
    "socket.io-client": "^4.7.2",
    "video.js": "^8.6.1"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

**Step 2: 创建 vite.config.js**

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:18080',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:19090',
        ws: true
      }
    }
  }
})
```

**Step 3: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>一起看 - WatchTogether</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Nunito:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

**Step 4: 创建 main.js**

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './styles/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

**Step 5: 创建 App.vue**

```vue
<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
```

**Step 6: 创建目录结构**

```bash
mkdir -p frontend/src/{views,components/{video,chat,room,common},stores,services,styles,assets}
```

**Step 7: Commit**

```bash
cd frontend
git init
git add .
git commit -m "feat: initialize Vue 3 project with Vite"
```

---

### Task 2: 样式系统

**Files:**
- Create: `frontend/src/styles/main.css`
- Create: `frontend/src/styles/variables.css`

**Step 1: 创建 CSS 变量文件**

```css
/* frontend/src/styles/variables.css */
:root {
  /* 主色调 */
  --bg-primary: #f7f5f0;
  --bg-secondary: #efece6;
  --bg-tertiary: #e5e0d6;
  
  /* 强调色 */
  --accent-primary: #a7c3a6;
  --accent-secondary: #c4d4bc;
  --accent-caramel: #c4824a;
  --accent-caramel-light: #d9a066;
  
  /* 功能色 */
  --text-primary: #2d3436;
  --text-secondary: #636e72;
  --text-muted: #9ca3af;
  
  /* 状态色 */
  --success: #a7c3a6;
  --error: #e07a5f;
  --online: #81b29a;
  
  /* 字体 */
  --font-display: 'Noto Serif SC', serif;
  --font-body: 'Nunito', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* 圆角 */
  --radius-sm: 12px;
  --radius-md: 20px;
  --radius-lg: 24px;
  --radius-xl: 28px;
  
  /* 阴影 */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.12);
  
  /* 过渡 */
  --transition-fast: 0.15s ease;
  --transition-base: 0.25s ease;
  --transition-slow: 0.4s ease;
}
```

**Step 2: 创建主样式文件**

```css
/* frontend/src/styles/main.css */
@import './variables.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-weight: 600;
  line-height: 1.3;
}

a {
  color: var(--accent-caramel);
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--accent-caramel-light);
}

button {
  font-family: var(--font-body);
  cursor: pointer;
  border: none;
  outline: none;
}

input, textarea {
  font-family: var(--font-body);
  border: none;
  outline: none;
}

/* 工具类 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-secondary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background: transparent;
  border: 2px solid var(--accent-caramel);
  color: var(--accent-caramel);
}

.btn-secondary:hover {
  background: var(--accent-caramel);
  color: white;
}

.card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 24px;
}

.input {
  width: 100%;
  padding: 14px 18px;
  font-size: 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  transition: all var(--transition-base);
}

.input:focus {
  border-color: var(--accent-primary);
  background: white;
}

.input::placeholder {
  color: var(--text-muted);
}

/* 页面进入动画 */
.page-enter-active {
  animation: pageIn 0.4s ease forwards;
}

@keyframes pageIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Step 3: Commit**

```bash
git add src/styles/
git commit -m "feat: add CSS variables and base styles"
```

---

### Task 3: 路由配置

**Files:**
- Create: `frontend/src/router/index.js`
- Create: `frontend/src/views/HomeView.vue`
- Create: `frontend/src/views/CreateRoomView.vue`
- Create: `frontend/src/views/JoinRoomView.vue`
- Create: `frontend/src/views/RoomView.vue`
- Create: `frontend/src/views/HistoryView.vue`
- Create: `frontend/src/views/ProfileView.vue`

**Step 1: 创建路由配置**

```javascript
// frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/create',
      name: 'create-room',
      component: () => import('@/views/CreateRoomView.vue')
    },
    {
      path: '/join/:roomId?',
      name: 'join-room',
      component: () => import('@/views/JoinRoomView.vue')
    },
    {
      path: '/room/:roomId',
      name: 'room',
      component: () => import('@/views/RoomView.vue')
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/views/HistoryView.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue')
    }
  ]
})

export default router
```

**Step 2: 创建基础页面骨架**

```vue
<!-- frontend/src/views/HomeView.vue -->
<template>
  <div class="home">
    <header class="home-header">
      <h1 class="logo">一起看</h1>
      <p class="tagline">和朋友同步观影，实时聊天</p>
    </header>
    
    <main class="home-main">
      <div class="action-buttons">
        <router-link to="/create" class="btn btn-primary btn-large">
          创建房间
        </router-link>
        <router-link to="/join" class="btn btn-secondary btn-large">
          加入房间
        </router-link>
      </div>
    </main>
    
    <nav class="home-nav">
      <router-link to="/history" class="nav-item">历史</router-link>
      <router-link to="/profile" class="nav-item">个人</router-link>
    </nav>
  </div>
</template>

<script setup>
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

.home-header {
  text-align: center;
  padding: 60px 24px 40px;
}

.logo {
  font-family: var(--font-display);
  font-size: 3.5rem;
  color: var(--accent-caramel);
  margin-bottom: 8px;
}

.tagline {
  color: var(--text-secondary);
  font-size: 1.125rem;
}

.home-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
}

.action-buttons {
  display: flex;
  gap: 20px;
}

.btn-large {
  padding: 18px 48px;
  font-size: 1.125rem;
}

.home-nav {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 24px;
  border-top: 1px solid var(--bg-tertiary);
}

.nav-item {
  color: var(--text-secondary);
  font-weight: 500;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-base);
}

.nav-item:hover,
.nav-item.router-link-active {
  color: var(--accent-caramel);
  background: var(--bg-tertiary);
}
</style>
```

**Step 3: 创建其他页面骨架（简化版）**

```vue
<!-- frontend/src/views/CreateRoomView.vue -->
<template>
  <div class="page-create">
    <h1>创建房间</h1>
    <!-- 表单待实现 -->
  </div>
</template>

<style scoped>
.page-create {
  min-height: 100vh;
  padding: 40px 24px;
  background: var(--bg-primary);
}
</style>
```

类似创建其他页面骨架...

**Step 4: Commit**

```bash
git add src/router/ src/views/
git commit -m "feat: add router and basic page skeletons"
```

---

## Phase 2: 核心功能

### Task 4: 服务层封装

**Files:**
- Create: `frontend/src/services/api.js`
- Create: `frontend/src/services/socket.js`

**Step 1: 创建 API 服务**

```javascript
// frontend/src/services/api.js
const API_BASE = '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || '请求失败')
  }
  
  return response.json()
}

// 房间 API
export const roomApi = {
  create(data) {
    return request('/rooms', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  
  list() {
    return request('/rooms')
  },
  
  get(roomId) {
    return request(`/rooms/${roomId}`)
  },
  
  delete(roomId) {
    return request(`/rooms/${roomId}`, { method: 'DELETE' })
  },
  
  getInvite(roomId) {
    return request(`/rooms/${roomId}/invite`)
  },
  
  getMessages(roomId, page = 1, size = 50) {
    return request(`/rooms/${roomId}/messages?page=${page}&size=${size}`)
  }
}

// 会话 API
export const sessionApi = {
  create(nickname) {
    return request('/sessions', {
      method: 'POST',
      body: JSON.stringify({ nickname })
    })
  },
  
  get(sessionId) {
    return request(`/sessions/${sessionId}`)
  },
  
  update(sessionId, data) {
    return request(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },
  
  getHistory(sessionId) {
    return request(`/sessions/${sessionId}/rooms`)
  }
}

// 表情 API
export const emojiApi = {
  getCategories() {
    return request('/emojis/categories')
  },
  
  list(categoryId) {
    const query = categoryId ? `?category_id=${categoryId}` : ''
    return request(`/emojis${query}`)
  },
  
  getMyEmojis() {
    return request('/emojis/my-emojis')
  },
  
  upload(file, displayName) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('display_name', displayName)
    
    return fetch(`${API_BASE}/emojis/upload`, {
      method: 'POST',
      body: formData
    }).then(r => r.json())
  },
  
  delete(emojiId) {
    return request(`/emojis/my-emojis/${emojiId}`, { method: 'DELETE' })
  },
  
  addFavorite(emojiId) {
    return request('/emojis/favorites', {
      method: 'POST',
      body: JSON.stringify({ emoji_id: emojiId })
    })
  },
  
  removeFavorite(favoriteId) {
    return request(`/emojis/favorites/${favoriteId}`, { method: 'DELETE' })
  },
  
  getFavorites() {
    return request('/emojis/favorites')
  }
}

// 视频 API
export const videoApi = {
  getSamples() {
    return request('/videos/samples')
  },
  
  upload(file) {
    const formData = new FormData()
    formData.append('file', file)
    
    return fetch(`${API_BASE}/videos/upload`, {
      method: 'POST',
      body: formData
    }).then(r => r.json())
  }
}
```

**Step 2: 创建 Socket 服务**

```javascript
// frontend/src/services/socket.js
import { io } from 'socket.io-client'
import { ref, readonly } from 'vue'

class SocketService {
  constructor() {
    this.socket = null
    this.connected = ref(false)
    this.currentRoom = ref(null)
    this.listeners = new Map()
  }
  
  connect() {
    if (this.socket?.connected) return
    
    this.socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })
    
    this.socket.on('connect', () => {
      this.connected.value = true
      console.log('Socket connected')
    })
    
    this.socket.on('disconnect', () => {
      this.connected.value = false
      console.log('Socket disconnected')
    })
    
    // 重新加入房间
    this.socket.on('connect', () => {
      if (this.currentRoom.value) {
        this.joinRoom(this.currentRoom.value.roomId, this.currentRoom.value.sessionId)
      }
    })
  }
  
  disconnect() {
    this.socket?.disconnect()
    this.socket = null
    this.connected.value = false
  }
  
  joinRoom(roomId, sessionId) {
    this.currentRoom.value = { roomId, sessionId }
    this.socket?.emit('join-room', { roomId, sessionId })
  }
  
  leaveRoom(roomId) {
    this.socket?.emit('leave-room', { roomId })
    this.currentRoom.value = null
  }
  
  // 视频控制
  emitVideoPlay(roomId, time) {
    this.socket?.emit('video:play', { roomId, time })
  }
  
  emitVideoPause(roomId) {
    this.socket?.emit('video:pause', { roomId })
  }
  
  emitVideoSeek(roomId, time) {
    this.socket?.emit('video:seek', { roomId, time })
  }
  
  emitVideoUrlChange(roomId, url) {
    this.socket?.emit('video:url-change', { roomId, url })
  }
  
  // 聊天
  emitChatMessage(roomId, content, type = 'text', senderId, senderNickname) {
    this.socket?.emit('chat:message', {
      roomId,
      content,
      type,
      senderId,
      senderNickname,
      timestamp: new Date().toISOString()
    })
  }
  
  // 事件监听
  on(event, callback) {
    this.socket?.on(event, callback)
    this.listeners.set(event, callback)
  }
  
  off(event) {
    this.socket?.off(event, this.listeners.get(event))
    this.listeners.delete(event)
  }
  
  // 房间事件
  onUserJoined(callback) {
    this.on('user-joined', callback)
  }
  
  onUserLeft(callback) {
    this.on('user-left', callback)
  }
  
  onRoomState(callback) {
    this.on('room-state', callback)
  }
  
  // 视频同步事件
  onVideoSyncPlay(callback) {
    this.on('video:sync-play', callback)
  }
  
  onVideoSyncPause(callback) {
    this.on('video:sync-pause', callback)
  }
  
  onVideoSyncSeek(callback) {
    this.on('video:sync-seek', callback)
  }
  
  onVideoSyncUrlChange(callback) {
    this.on('video:sync-url-change', callback)
  }
  
  // 聊天事件
  onChatMessage(callback) {
    this.on('chat:message', callback)
  }
  
  onSystemMessage(callback) {
    this.on('system:message', callback)
  }
}

export const socketService = new SocketService()
export { readonly as readonly }
```

**Step 3: Commit**

```bash
git add src/services/
git commit -m "feat: add API and Socket services"
```

---

### Task 5: 状态管理

**Files:**
- Create: `frontend/src/stores/room.js`
- Create: `frontend/src/stores/user.js`
- Create: `frontend/src/stores/chat.js`

**Step 1: 创建用户状态**

```javascript
// frontend/src/stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sessionApi } from '@/services/api'

const STORAGE_KEY = 'watchtogether_user'

export const useUserStore = defineStore('user', () => {
  const sessionId = ref(null)
  const nickname = ref('')
  const avatar = ref('avatar1.png')
  const createdAt = ref(null)
  
  const isLoggedIn = computed(() => !!sessionId.value)
  
  // 从本地存储恢复
  function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      sessionId.value = data.sessionId
      nickname.value = data.nickname
      avatar.value = data.avatar
      createdAt.value = data.createdAt
    }
  }
  
  // 保存到本地存储
  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sessionId: sessionId.value,
      nickname: nickname.value,
      avatar: avatar.value,
      createdAt: createdAt.value
    }))
  }
  
  // 创建会话
  async function createSession(nick) {
    const nickname = nick || `游客${Math.floor(Math.random() * 10000)}`
    const data = await sessionApi.create(nickname)
    
    sessionId.value = data.id
    nickname.value = data.nickname
    avatar.value = data.avatar
    createdAt.value = data.createdAt
    
    saveToStorage()
    return data
  }
  
  // 更新用户信息
  async function updateProfile(data) {
    if (!sessionId.value) return
    
    const updated = await sessionApi.update(sessionId.value, data)
    nickname.value = updated.nickname
    avatar.value = updated.avatar
    saveToStorage()
  }
  
  // 登出
  function logout() {
    sessionId.value = null
    nickname.value = ''
    avatar.value = 'avatar1.png'
    createdAt.value = null
    localStorage.removeItem(STORAGE_KEY)
  }
  
  // 初始化
  loadFromStorage()
  
  return {
    sessionId,
    nickname,
    avatar,
    createdAt,
    isLoggedIn,
    createSession,
    updateProfile,
    logout,
    loadFromStorage
  }
})
```

**Step 2: 创建房间状态**

```javascript
// frontend/src/stores/room.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { roomApi } from '@/services/api'
import { socketService } from '@/services/socket'

export const useRoomStore = defineStore('room', () => {
  const currentRoom = ref(null)
  const users = ref([])
  const videoState = ref({
    url: '',
    isPlaying: false,
    currentTime: 0,
    duration: 0
  })
  const publicRooms = ref([])
  
  const userCount = computed(() => users.value.length)
  
  // 创建房间
  async function createRoom(data) {
    const result = await roomApi.create(data)
    return result
  }
  
  // 加入房间
  async function joinRoom(roomId) {
    const room = await roomApi.get(roomId)
    currentRoom.value = room
    
    // 连接Socket并加入
    socketService.connect()
    // 注意：sessionId 由调用方传入
    
    return room
  }
  
  // 离开房间
  function leaveRoom() {
    if (currentRoom.value) {
      socketService.leaveRoom(currentRoom.value.id)
    }
    currentRoom.value = null
    users.value = []
    videoState.value = { url: '', isPlaying: false, currentTime: 0, duration: 0 }
  }
  
  // 更新视频状态
  function updateVideoState(state) {
    videoState.value = { ...videoState.value, ...state }
  }
  
  // 添加用户
  function addUser(user) {
    if (!users.value.find(u => u.sessionId === user.sessionId)) {
      users.value.push(user)
    }
  }
  
  // 移除用户
  function removeUser(sessionId) {
    users.value = users.value.filter(u => u.sessionId !== sessionId)
  }
  
  // 获取公开房间列表
  async function fetchPublicRooms() {
    publicRooms.value = await roomApi.list()
  }
  
  return {
    currentRoom,
    users,
    videoState,
    publicRooms,
    userCount,
    createRoom,
    joinRoom,
    leaveRoom,
    updateVideoState,
    addUser,
    removeUser,
    fetchPublicRooms
  }
})
```

**Step 3: 创建聊天状态**

```javascript
// frontend/src/stores/chat.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { roomApi } from '@/services/api'

export const useChatStore = defineStore('chat', () => {
  const messages = ref([])
  const loading = ref(false)
  
  const sortedMessages = computed(() => {
    return [...messages.value].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    )
  })
  
  // 添加消息
  function addMessage(msg) {
    messages.value.push({
      id: msg.id || Date.now(),
      content: msg.content,
      type: msg.type || 'text',
      senderId: msg.senderId,
      senderNickname: msg.senderNickname,
      timestamp: msg.timestamp || new Date().toISOString(),
      createdAt: msg.createdAt
    })
  }
  
  // 添加系统消息
  function addSystemMessage(text) {
    messages.value.push({
      id: Date.now(),
      type: 'system',
      content: text,
      timestamp: new Date().toISOString()
    })
  }
  
  // 加载历史消息
  async function loadHistory(roomId, page = 1) {
    loading.value = true
    try {
      const data = await roomApi.getMessages(roomId, page)
      const historicalMessages = data.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        type: msg.messageType,
        senderId: msg.sessionId,
        senderNickname: msg.senderNickname,
        timestamp: msg.timestamp,
        createdAt: msg.createdAt
      }))
      
      if (page === 1) {
        messages.value = historicalMessages
      } else {
        messages.value = [...historicalMessages, ...messages.value]
      }
    } finally {
      loading.value = false
    }
  }
  
  // 清空消息
  function clearMessages() {
    messages.value = []
  }
  
  return {
    messages,
    loading,
    sortedMessages,
    addMessage,
    addSystemMessage,
    loadHistory,
    clearMessages
  }
})
```

**Step 4: Commit**

```bash
git add src/stores/
git commit -m "feat: add Pinia stores for user, room, chat"
```

---

### Task 6: 首页开发

**Files:**
- Modify: `frontend/src/views/HomeView.vue`

**Step 1: 更新 HomeView.vue**

```vue
<template>
  <div class="home">
    <header class="home-header">
      <h1 class="logo">一起看</h1>
      <p class="tagline">和朋友同步观影，实时聊天</p>
    </header>
    
    <main class="home-main">
      <div class="action-buttons">
        <router-link to="/create" class="btn btn-primary btn-large">
          <span class="btn-icon">🎬</span>
          创建房间
        </router-link>
        <router-link to="/join" class="btn btn-secondary btn-large">
          <span class="btn-icon">🚪</span>
          加入房间
        </router-link>
      </div>
      
      <section class="rooms-section" v-if="publicRooms.length > 0">
        <h2 class="section-title">公开房间</h2>
        <div class="rooms-grid">
          <div 
            v-for="room in publicRooms" 
            :key="room.id" 
            class="room-card"
            @click="goToRoom(room.id)"
          >
            <div class="room-info">
              <h3 class="room-name">{{ room.name || '房间 ' + room.id }}</h3>
              <p class="room-meta">
                <span class="room-users">{{ room.userCount }}/{{ room.maxUsers }}</span>
                <span class="room-creator">by {{ room.creatorNickname }}</span>
              </p>
            </div>
            <button class="btn btn-join">加入</button>
          </div>
        </div>
      </section>
    </main>
    
    <nav class="home-nav">
      <router-link to="/history" class="nav-item">
        <span class="nav-icon">📋</span>
        历史
      </router-link>
      <router-link to="/profile" class="nav-item">
        <span class="nav-icon">👤</span>
        个人
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/room'

const router = useRouter()
const roomStore = useRoomStore()
const { publicRooms } = storeToRefs(roomStore)

onMounted(() => {
  roomStore.fetchPublicRooms()
})

function goToRoom(roomId) {
  router.push(`/join/${roomId}`)
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: 
    radial-gradient(ellipse at 20% 20%, rgba(167, 195, 166, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(196, 130, 74, 0.1) 0%, transparent 50%),
    linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

.home-header {
  text-align: center;
  padding: 60px 24px 40px;
}

.logo {
  font-family: var(--font-display);
  font-size: 3.5rem;
  color: var(--accent-caramel);
  margin-bottom: 8px;
  letter-spacing: 0.1em;
}

.tagline {
  color: var(--text-secondary);
  font-size: 1.125rem;
}

.home-main {
  flex: 1;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 24px;
}

.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 48px;
}

.btn-large {
  padding: 20px 56px;
  font-size: 1.25rem;
}

.btn-icon {
  margin-right: 10px;
}

.rooms-section {
  margin-top: 32px;
}

.section-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 20px;
  text-align: center;
}

.rooms-grid {
  display: grid;
  gap: 16px;
}

.room-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  border: 2px solid transparent;
}

.room-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--accent-primary);
}

.room-name {
  font-family: var(--font-display);
  font-size: 1.125rem;
  margin-bottom: 4px;
}

.room-meta {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.room-users {
  margin-right: 12px;
  color: var(--accent-primary);
  font-weight: 600;
}

.btn-join {
  padding: 8px 20px;
  background: var(--accent-primary);
  color: white;
  border-radius: var(--radius-sm);
  font-weight: 500;
  transition: all var(--transition-base);
}

.btn-join:hover {
  background: var(--accent-secondary);
}

.home-nav {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 24px;
  border-top: 1px solid var(--bg-tertiary);
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-weight: 500;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.nav-item:hover,
.nav-item.router-link-active {
  color: var(--accent-caramel);
  background: var(--bg-tertiary);
}

.nav-icon {
  font-size: 1.125rem;
}
</style>
```

**Step 2: Commit**

```bash
git commit -m "feat: implement HomeView with public rooms"
```

---

### Task 7: 创建房间页

**Files:**
- Modify: `frontend/src/views/CreateRoomView.vue`
- Create: `frontend/src/components/room/RoomForm.vue`

**Step 1: 创建 RoomForm 组件**

```vue
<!-- frontend/src/components/room/RoomForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="room-form">
    <div class="form-group">
      <label class="form-label">你的昵称</label>
      <input 
        v-model="form.nickname"
        type="text" 
        class="input"
        placeholder="输入昵称"
        required
        maxlength="20"
      />
    </div>
    
    <div class="form-group">
      <label class="form-label">房间名称 <span class="optional">(可选)</span></label>
      <input 
        v-model="form.name"
        type="text" 
        class="input"
        placeholder="默认：房间 + 编号"
        maxlength="50"
      />
    </div>
    
    <div class="form-group">
      <label class="form-label">最大人数: {{ form.maxUsers }}人</label>
      <input 
        v-model.number="form.maxUsers"
        type="range" 
        class="range-slider"
        min="2"
        max="10"
        step="1"
      />
      <div class="range-labels">
        <span>2人</span>
        <span>10人</span>
      </div>
    </div>
    
    <div class="form-group">
      <label class="toggle-label">
        <span>公开房间</span>
        <input 
          v-model="form.isPublic"
          type="checkbox" 
          class="toggle-input"
        />
        <span class="toggle-switch"></span>
      </label>
      <p class="form-hint">公开房间会显示在首页列表中</p>
    </div>
    
    <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
      {{ loading ? '创建中...' : '创建房间' }}
    </button>
  </form>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useRoomStore } from '@/stores/room'

const emit = defineEmits(['success'])
const router = useRouter()
const userStore = useUserStore()
const roomStore = useRoomStore()

const loading = ref(false)
const form = reactive({
  nickname: userStore.nickname || '',
  name: '',
  maxUsers: 5,
  isPublic: true
})

async function handleSubmit() {
  loading.value = true
  try {
    // 确保有会话
    if (!userStore.sessionId) {
      await userStore.createSession(form.nickname)
    }
    
    // 创建房间
    const room = await roomStore.createRoom({
      name: form.name,
      maxUsers: form.maxUsers,
      isPublic: form.isPublic,
      creatorSessionId: userStore.sessionId,
      creatorNickname: userStore.nickname
    })
    
    emit('success', room)
    router.push(`/room/${room.id}`)
  } catch (error) {
    alert(error.message || '创建房间失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.room-form {
  max-width: 480px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.optional {
  font-weight: 400;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.range-slider {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  background: var(--bg-tertiary);
  border-radius: 4px;
  outline: none;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  background: var(--accent-primary);
  border-radius: 50%;
  cursor: pointer;
  transition: transform var(--transition-base);
}

.range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.range-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.toggle-input {
  display: none;
}

.toggle-switch {
  width: 52px;
  height: 28px;
  background: var(--bg-tertiary);
  border-radius: 14px;
  position: relative;
  transition: background var(--transition-base);
}

.toggle-switch::after {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  background: white;
  border-radius: 50%;
  top: 3px;
  left: 3px;
  transition: transform var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.toggle-input:checked + .toggle-switch {
  background: var(--accent-primary);
}

.toggle-input:checked + .toggle-switch::after {
  transform: translateX(24px);
}

.form-hint {
  margin-top: 8px;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.btn-block {
  width: 100%;
  margin-top: 32px;
  padding: 16px;
}
</style>
```

**Step 2: 更新 CreateRoomView**

```vue
<!-- frontend/src/views/CreateRoomView.vue -->
<template>
  <div class="page-create">
    <header class="page-header">
      <router-link to="/" class="back-link">← 返回</router-link>
      <h1 class="page-title">创建房间</h1>
    </header>
    
    <main class="page-content">
      <RoomForm />
    </main>
  </div>
</template>

<script setup>
import RoomForm from '@/components/room/RoomForm.vue'
</script>

<style scoped>
.page-create {
  min-height: 100vh;
  background: 
    radial-gradient(ellipse at 30% 30%, rgba(167, 195, 166, 0.1) 0%, transparent 50%),
    var(--bg-primary);
}

.page-header {
  padding: 24px;
  text-align: center;
}

.back-link {
  display: inline-block;
  margin-bottom: 16px;
  color: var(--text-secondary);
}

.page-title {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--text-primary);
}

.page-content {
  padding: 24px;
}
</style>
```

**Step 3: Commit**

```bash
git add src/views/CreateRoomView.vue src/components/room/
git commit -m "feat: implement CreateRoomView"
```

---

### Task 8: 加入房间页

**Files:**
- Modify: `frontend/src/views/JoinRoomView.vue`

**Step 1: 创建 JoinRoomView**

```vue
<template>
  <div class="page-join">
    <header class="page-header">
      <router-link to="/" class="back-link">← 返回</router-link>
      <h1 class="page-title">加入房间</h1>
    </header>
    
    <main class="page-content">
      <form @submit.prevent="handleJoin" class="join-form">
        <div class="form-group">
          <label class="form-label">你的昵称</label>
          <input 
            v-model="nickname"
            type="text" 
            class="input"
            placeholder="输入昵称"
            required
            maxlength="20"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">房间号</label>
          <input 
            v-model="roomId"
            type="text" 
            class="input input-large"
            placeholder="输入6位房间号"
            required
            pattern="[A-Za-z0-9]{6}"
            maxlength="6"
          />
        </div>
        
        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? '加入中...' : '加入房间' }}
        </button>
      </form>
      
      <div class="divider">
        <span>或</span>
      </div>
      
      <div class="invite-section" v-if="inviteLink">
        <p class="invite-label">邀请链接</p>
        <div class="invite-link-box">
          <input 
            :value="inviteLink" 
            type="text" 
            class="input" 
            readonly 
            ref="linkInput"
          />
          <button @click="copyLink" class="btn btn-copy">
            {{ copied ? '已复制' : '复制' }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useRoomStore } from '@/stores/room'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const roomStore = useRoomStore()

const nickname = ref(userStore.nickname || '')
const roomId = ref('')
const loading = ref(false)
const copied = ref(false)
const linkInput = ref(null)

// 从URL参数获取房间号
onMounted(() => {
  if (route.params.roomId) {
    roomId.value = route.params.roomId.toUpperCase()
  }
  
  // 解析邀请链接
  const urlParams = new URLSearchParams(window.location.search)
  const roomFromUrl = urlParams.get('room')
  if (roomFromUrl) {
    roomId.value = roomFromUrl.toUpperCase()
  }
})

const inviteLink = computed(() => {
  if (!roomId.value) return ''
  return `${window.location.origin}/join/${roomId.value}`
})

async function handleJoin() {
  if (!nickname.value.trim()) {
    alert('请输入昵称')
    return
  }
  
  loading.value = true
  try {
    // 确保有会话
    if (!userStore.sessionId) {
      await userStore.createSession(nickname.value)
    }
    
    // 加入房间
    await roomStore.joinRoom(roomId.value)
    router.push(`/room/${roomId.value}`)
  } catch (error) {
    alert(error.message || '加入房间失败')
  } finally {
    loading.value = false
  }
}

function copyLink() {
  linkInput.value?.select()
  document.execCommand('copy')
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}
</script>

<style scoped>
.page-join {
  min-height: 100vh;
  background: 
    radial-gradient(ellipse at 70% 70%, rgba(196, 130, 74, 0.1) 0%, transparent 50%),
    var(--bg-primary);
}

.page-header {
  padding: 24px;
  text-align: center;
}

.back-link {
  display: inline-block;
  margin-bottom: 16px;
  color: var(--text-secondary);
}

.page-title {
  font-family: var(--font-display);
  font-size: 2rem;
}

.page-content {
  max-width: 480px;
  margin: 0 auto;
  padding: 24px;
}

.join-form {
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
}

.input-large {
  font-size: 1.25rem;
  text-align: center;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.btn-block {
  width: 100%;
  padding: 16px;
}

.divider {
  text-align: center;
  margin: 32px 0;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: var(--bg-tertiary);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider span {
  background: var(--bg-primary);
  padding: 0 16px;
  color: var(--text-muted);
}

.invite-section {
  text-align: center;
}

.invite-label {
  font-weight: 600;
  margin-bottom: 12px;
}

.invite-link-box {
  display: flex;
  gap: 12px;
}

.invite-link-box .input {
  flex: 1;
  font-size: 0.875rem;
}

.btn-copy {
  padding: 12px 20px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all var(--transition-base);
}

.btn-copy:hover {
  background: var(--accent-primary);
  color: white;
}
</style>
```

**Step 2: Commit**

```bash
git commit -m "feat: implement JoinRoomView"
```

---

### Task 9: 房间页面 - 视频播放器

**Files:**
- Create: `frontend/src/components/video/VideoPlayer.vue`
- Create: `frontend/src/components/video/VideoControls.vue`

**Step 1: 创建 VideoPlayer 组件**

```vue
<!-- frontend/src/components/video/VideoPlayer.vue -->
<template>
  <div class="video-player-wrapper">
    <div class="video-container" ref="videoContainer">
      <video 
        ref="videoRef"
        class="video-element"
        :src="videoUrl"
        @timeupdate="handleTimeUpdate"
        @loadedmetadata="handleMetadataLoaded"
        @play="handlePlay"
        @pause="handlePause"
        @ended="handleEnded"
      ></video>
      
      <div class="video-overlay" v-if="!videoUrl">
        <div class="no-video">
          <span class="no-video-icon">🎬</span>
          <p>等待视频...</p>
        </div>
      </div>
    </div>
    
    <VideoControls 
      :currentTime="currentTime"
      :duration="duration"
      :isPlaying="isPlaying"
      :volume="volume"
      @play="play"
      @pause="pause"
      @seek="seek"
      @volume-change="setVolume"
      @fullscreen="toggleFullscreen"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoomStore } from '@/stores/room'
import { socketService } from '@/services/socket'
import VideoControls from './VideoControls.vue'

const roomStore = useRoomStore()
const videoRef = ref(null)
const videoContainer = ref(null)
const currentTime = ref(0)
const duration = ref(0)
const isPlaying = ref(false)
const volume = ref(1)
const isSyncing = ref(false)

const videoUrl = computed(() => roomStore.videoState.url)

// Socket 事件监听
function setupSocketListeners() {
  socketService.onVideoSyncPlay((data) => {
    isSyncing.value = true
    videoRef.value.currentTime = data.time
    videoRef.value.play()
    isPlaying.value = true
    setTimeout(() => isSyncing.value = false, 100)
  })
  
  socketService.onVideoSyncPause(() => {
    isSyncing.value = true
    videoRef.value.pause()
    isPlaying.value = false
    setTimeout(() => isSyncing.value = false, 100)
  })
  
  socketService.onVideoSyncSeek((data) => {
    isSyncing.value = true
    videoRef.value.currentTime = data.time
    currentTime.value = data.time
    setTimeout(() => isSyncing.value = false, 100)
  })
  
  socketService.onVideoSyncUrlChange((data) => {
    roomStore.updateVideoState({ url: data.url, currentTime: 0, isPlaying: false })
    videoRef.value.load()
  })
}

// 本地事件处理
function handleTimeUpdate() {
  if (!isSyncing.value) {
    currentTime.value = videoRef.value.currentTime
    roomStore.updateVideoState({ currentTime: currentTime.value })
  }
}

function handleMetadataLoaded() {
  duration.value = videoRef.value.duration
  roomStore.updateVideoState({ duration: duration.value })
}

function handlePlay() {
  if (!isSyncing.value) {
    isPlaying.value = true
    roomStore.updateVideoState({ isPlaying: true })
    socketService.emitVideoPlay(roomStore.currentRoom.id, currentTime.value)
  }
}

function handlePause() {
  if (!isSyncing.value) {
    isPlaying.value = false
    roomStore.updateVideoState({ isPlaying: false })
    socketService.emitVideoPause(roomStore.currentRoom.id)
  }
}

function handleEnded() {
  isPlaying.value = false
  roomStore.updateVideoState({ isPlaying: false })
}

// 控制方法
function play() {
  videoRef.value?.play()
}

function pause() {
  videoRef.value?.pause()
}

function seek(time) {
  videoRef.value.currentTime = time
  currentTime.value = time
  if (!isPlaying.value) {
    videoRef.value.play()
  }
  socketService.emitVideoSeek(roomStore.currentRoom.id, time)
}

function setVolume(val) {
  volume.value = val
  videoRef.value.volume = val
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    videoContainer.value.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

// 公开给父组件
defineExpose({
  play,
  pause,
  seek,
  setVideoUrl: (url) => {
    roomStore.updateVideoState({ url, currentTime: 0, isPlaying: false })
  }
})

onMounted(() => {
  setupSocketListeners()
  
  // 恢复视频状态
  if (roomStore.videoState.url) {
    videoUrl.value = roomStore.videoState.url
  }
})
</script>

<style scoped>
.video-player-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #000;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.video-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
}

.no-video {
  text-align: center;
  color: var(--text-muted);
}

.no-video-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 16px;
}
</style>
```

**Step 2: 创建 VideoControls 组件**

```vue
<!-- frontend/src/components/video/VideoControls.vue -->
<template>
  <div class="video-controls">
    <div class="progress-bar" @click="handleProgressClick">
      <div class="progress-track">
        <div 
          class="progress-fill" 
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
    </div>
    
    <div class="controls-row">
      <div class="controls-left">
        <button class="control-btn" @click="isPlaying ? $emit('pause') : $emit('play')">
          {{ isPlaying ? '⏸' : '▶' }}
        </button>
        
        <span class="time-display">
          {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
        </span>
      </div>
      
      <div class="controls-right">
        <div class="volume-control">
          <button class="control-btn" @click="toggleMute">
            {{ volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊' }}
          </button>
          <input 
            type="range"
            class="volume-slider"
            min="0"
            max="1"
            step="0.1"
            :value="volume"
            @input="$emit('volume-change', +$event.target.value)"
          />
        </div>
        
        <button class="control-btn" @click="$emit('fullscreen')">⛶</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  currentTime: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  isPlaying: { type: Boolean, default: false },
  volume: { type: Number, default: 1 }
})

const emit = defineEmits(['play', 'pause', 'seek', 'volume-change', 'fullscreen'])

const progressPercent = computed(() => {
  if (!props.duration) return 0
  return (props.currentTime / props.duration) * 100
})

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function handleProgressClick(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  emit('seek', percent * props.duration)
}

function toggleMute() {
  if (props.volume > 0) {
    emit('volume-change', 0)
  } else {
    emit('volume-change', 1)
  }
}
</script>

<style scoped>
.video-controls {
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 40px 16px 16px;
}

.progress-bar {
  padding: 8px 0;
  cursor: pointer;
}

.progress-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-caramel);
  border-radius: 2px;
  transition: width 0.1s linear;
}

.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-btn {
  background: none;
  color: white;
  font-size: 1.25rem;
  padding: 8px;
  opacity: 0.9;
  transition: opacity var(--transition-fast);
}

.control-btn:hover {
  opacity: 1;
}

.time-display {
  color: white;
  font-size: 0.875rem;
  font-family: var(--font-mono);
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-slider {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
}
</style>
```

**Step 3: Commit**

```bash
git add src/components/video/
git commit -m "feat: add video player components"
```

---

### Task 10: 房间页面 - 聊天面板

**Files:**
- Create: `frontend/src/components/chat/ChatPanel.vue`
- Create: `frontend/src/components/chat/MessageList.vue`
- Create: `frontend/src/components/chat/MessageInput.vue`

**Step 1: 创建 ChatPanel 组件**

```vue
<!-- frontend/src/components/chat/ChatPanel.vue -->
<template>
  <div class="chat-panel">
    <div class="chat-header">
      <div class="room-info">
        <h3 class="room-name">{{ roomStore.currentRoom?.name || '房间' }}</h3>
        <span class="room-id">{{ roomStore.currentRoom?.id }}</span>
      </div>
      <button class="btn-copy-link" @click="copyInviteLink">
        复制邀请链接
      </button>
    </div>
    
    <div class="chat-users">
      <h4 class="users-title">在线 ({{ roomStore.userCount }})</h4>
      <div class="users-list">
        <div 
          v-for="user in roomStore.users" 
          :key="user.sessionId"
          class="user-item"
        >
          <span class="user-avatar">{{ user.avatar }}</span>
          <span class="user-name">{{ user.nickname }}</span>
          <span class="user-status" :class="{ online: user.isOnline }"></span>
        </div>
      </div>
    </div>
    
    <MessageList :messages="chatStore.sortedMessages" />
    
    <MessageInput @send="handleSend" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoomStore } from '@/stores/room'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { socketService } from '@/services/socket'
import MessageList from './MessageList.vue'
import MessageInput from './MessageInput.vue'

const roomStore = useRoomStore()
const chatStore = useChatStore()
const userStore = useUserStore()

function setupSocketListeners() {
  socketService.onChatMessage((msg) => {
    chatStore.addMessage(msg)
  })
  
  socketService.onSystemMessage((msg) => {
    chatStore.addSystemMessage(msg.content)
  })
  
  socketService.onUserJoined((user) => {
    roomStore.addUser(user)
    chatStore.addSystemMessage(`${user.nickname} 加入了房间`)
  })
  
  socketService.onUserLeft((user) => {
    roomStore.removeUser(user.sessionId)
    chatStore.addSystemMessage(`${user.nickname} 离开了房间`)
  })
}

function handleSend(content, type = 'text') {
  if (!content.trim()) return
  
  socketService.emitChatMessage(
    roomStore.currentRoom.id,
    content,
    type,
    userStore.sessionId,
    userStore.nickname
  )
  
  // 本地立即显示
  chatStore.addMessage({
    content,
    type,
    senderId: userStore.sessionId,
    senderNickname: userStore.nickname,
    timestamp: new Date().toISOString()
  })
}

function copyInviteLink() {
  const link = `${window.location.origin}/join/${roomStore.currentRoom.id}`
  navigator.clipboard.writeText(link)
  alert('邀请链接已复制')
}

onMounted(async () => {
  setupSocketListeners()
  
  // 加入Socket房间
  socketService.joinRoom(roomStore.currentRoom.id, userStore.sessionId)
  
  // 加载历史消息
  await chatStore.loadHistory(roomStore.currentRoom.id)
})
</script>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: white;
  border-bottom: 1px solid var(--bg-tertiary);
}

.room-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.room-name {
  font-family: var(--font-display);
  font-size: 1.125rem;
}

.room-id {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.btn-copy-link {
  padding: 6px 12px;
  font-size: 0.75rem;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  transition: all var(--transition-base);
}

.btn-copy-link:hover {
  background: var(--accent-primary);
  color: white;
}

.chat-users {
  padding: 12px 16px;
  border-bottom: 1px solid var(--bg-tertiary);
}

.users-title {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.users-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--bg-tertiary);
  border-radius: 20px;
  font-size: 0.875rem;
}

.user-avatar {
  font-size: 1rem;
}

.user-name {
  color: var(--text-primary);
}

.user-status {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
}

.user-status.online {
  background: var(--online);
}
</style>
```

**Step 2: 创建 MessageList 组件**

```vue
<!-- frontend/src/components/chat/MessageList.vue -->
<template>
  <div class="message-list" ref="listRef">
    <div v-if="messages.length === 0" class="empty-messages">
      暂无消息，快来聊天吧
    </div>
    
    <div 
      v-for="msg in messages" 
      :key="msg.id"
      class="message"
      :class="{ 
        'message-self': msg.senderId === userStore.sessionId,
        'message-system': msg.type === 'system'
      }"
    >
      <div v-if="msg.type === 'system'" class="system-message">
        {{ msg.content }}
      </div>
      
      <div v-else class="message-content">
        <span class="message-sender">{{ msg.senderNickname }}</span>
        <div class="message-bubble">
          <img 
            v-if="msg.type === 'image'" 
            :src="msg.content" 
            class="message-image" 
          />
          <span v-else>{{ msg.content }}</span>
        </div>
        <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  messages: { type: Array, default: () => [] }
})

const userStore = useUserStore()
const listRef = ref(null)

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 自动滚动到底部
watch(() => props.messages.length, async () => {
  await nextTick()
  listRef.value?.scrollTo({ top: listRef.value.scrollHeight, behavior: 'smooth' })
})
</script>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-messages {
  text-align: center;
  color: var(--text-muted);
  padding: 40px;
}

.message {
  display: flex;
}

.message-self {
  justify-content: flex-end;
}

.message-system {
  justify-content: center;
}

.system-message {
  font-size: 0.75rem;
  color: var(--text-muted);
  padding: 4px 12px;
  background: var(--bg-tertiary);
  border-radius: 12px;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-self .message-content {
  align-items: flex-end;
}

.message-sender {
  font-size: 0.75rem;
  color: var(--text-muted);
  padding: 0 8px;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 18px;
  background: white;
  box-shadow: var(--shadow-sm);
  word-break: break-word;
}

.message-self .message-bubble {
  background: var(--accent-primary);
  color: white;
}

.message-image {
  max-width: 200px;
  border-radius: 12px;
}

.message-time {
  font-size: 0.625rem;
  color: var(--text-muted);
  padding: 0 8px;
}
</style>
```

**Step 3: 创建 MessageInput 组件**

```vue
<!-- frontend/src/components/chat/MessageInput.vue -->
<template>
  <div class="message-input-wrapper">
    <div class="input-container">
      <button class="btn-emoji" @click="showEmojiPicker = !showEmojiPicker">
        😀
      </button>
      
      <input 
        v-model="message"
        type="text"
        class="input-field"
        placeholder="发送消息..."
        @keyup.enter="send"
      />
      
      <button 
        class="btn-send" 
        @click="send"
        :disabled="!message.trim()"
      >
        发送
      </button>
    </div>
    
    <div v-if="showEmojiPicker" class="emoji-picker">
      <div class="emoji-grid">
        <button 
          v-for="emoji in emojis" 
          :key="emoji"
          class="emoji-btn"
          @click="insertEmoji(emoji)"
        >
          {{ emoji }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['send'])
const message = ref('')
const showEmojiPicker = ref(false)

const emojis = [
  '😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '🤔',
  '😎', '🥳', '😢', '😭', '😤', '😱', '🤯', '👍',
  '👏', '🙌', '🤝', '❤️', '🎉', '🔥', '💯', '✨'
]

function send() {
  if (!message.value.trim()) return
  emit('send', message.value.trim())
  message.value = ''
}

function insertEmoji(emoji) {
  message.value += emoji
  showEmojiPicker.value = false
}
</script>

<style scoped>
.message-input-wrapper {
  position: relative;
  padding: 12px 16px;
  background: white;
  border-top: 1px solid var(--bg-tertiary);
}

.input-container {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-secondary);
  border-radius: 24px;
  padding: 4px;
}

.btn-emoji {
  padding: 8px 12px;
  background: none;
  font-size: 1.25rem;
  opacity: 0.7;
  transition: opacity var(--transition-fast);
}

.btn-emoji:hover {
  opacity: 1;
}

.input-field {
  flex: 1;
  padding: 10px;
  background: none;
  font-size: 0.9375rem;
}

.btn-send {
  padding: 10px 20px;
  background: var(--accent-primary);
  color: white;
  border-radius: 20px;
  font-weight: 600;
  transition: all var(--transition-base);
}

.btn-send:hover:not(:disabled) {
  background: var(--accent-secondary);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.emoji-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 12px;
  margin-bottom: 8px;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.emoji-btn {
  padding: 8px;
  font-size: 1.5rem;
  background: none;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.emoji-btn:hover {
  background: var(--bg-tertiary);
}
</style>
```

**Step 4: Commit**

```bash
git add src/components/chat/
git commit -m "feat: add chat panel components"
```

---

### Task 11: 房间页面整合

**Files:**
- Modify: `frontend/src/views/RoomView.vue`

**Step 1: 创建 RoomView**

```vue
<template>
  <div class="page-room">
    <div class="room-layout">
      <main class="video-section">
        <VideoPlayer ref="videoPlayer" />
        
        <div class="video-source-bar">
          <div class="source-tabs">
            <button 
              :class="{ active: videoSource === 'url' }"
              @click="videoSource = 'url'"
            >
              URL
            </button>
            <button 
              :class="{ active: videoSource === 'upload' }"
              @click="videoSource = 'upload'"
            >
              上传
            </button>
            <button 
              :class="{ active: videoSource === 'samples' }"
              @click="videoSource = 'samples'"
            >
              示例
            </button>
          </div>
          
          <div class="source-input" v-if="videoSource === 'url'">
            <input 
              v-model="videoUrlInput"
              type="text"
              class="input"
              placeholder="输入视频URL..."
              @keyup.enter="changeVideoUrl"
            />
            <button class="btn btn-primary" @click="changeVideoUrl">
              加载
            </button>
          </div>
          
          <div class="source-input" v-if="videoSource === 'upload'">
            <input 
              type="file"
              accept="video/mp4,video/webm,video/ogg"
              @change="handleVideoUpload"
            />
          </div>
        </div>
      </main>
      
      <aside class="chat-section">
        <ChatPanel />
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/room'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { socketService } from '@/services/socket'
import VideoPlayer from '@/components/video/VideoPlayer.vue'
import ChatPanel from '@/components/chat/ChatPanel.vue'

const route = useRoute()
const router = useRouter()
const roomStore = useRoomStore()
const chatStore = useChatStore()
const userStore = useUserStore()

const videoPlayer = ref(null)
const videoSource = ref('url')
const videoUrlInput = ref('')

onMounted(async () => {
  const roomId = route.params.roomId
  
  try {
    // 如果没有会话，先创建
    if (!userStore.sessionId) {
      const nickname = `游客${Math.floor(Math.random() * 10000)}`
      await userStore.createSession(nickname)
    }
    
    // 加入房间
    await roomStore.joinRoom(roomId)
  } catch (error) {
    alert('加入房间失败: ' + error.message)
    router.push('/')
  }
})

onUnmounted(() => {
  roomStore.leaveRoom()
  chatStore.clearMessages()
})

function changeVideoUrl() {
  if (!videoUrlInput.value.trim()) return
  
  socketService.emitVideoUrlChange(roomStore.currentRoom.id, videoUrlInput.value)
  videoUrlInput.value = ''
}

function handleVideoUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  
  const url = URL.createObjectURL(file)
  socketService.emitVideoUrlChange(roomStore.currentRoom.id, url)
}
</script>

<style scoped>
.page-room {
  min-height: 100vh;
  background: var(--bg-primary);
}

.room-layout {
  display: flex;
  height: 100vh;
}

.video-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  padding-right: 8px;
}

.video-section .video-player-wrapper {
  flex: 1;
}

.video-source-bar {
  margin-top: 16px;
  background: white;
  border-radius: var(--radius-md);
  padding: 12px;
}

.source-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.source-tabs button {
  padding: 8px 16px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  font-weight: 500;
  transition: all var(--transition-base);
}

.source-tabs button.active {
  background: var(--accent-primary);
  color: white;
}

.source-input {
  display: flex;
  gap: 8px;
}

.source-input .input {
  flex: 1;
}

.chat-section {
  width: 360px;
  padding: 16px;
  padding-left: 8px;
}

@media (max-width: 900px) {
  .room-layout {
    flex-direction: column;
    height: auto;
  }
  
  .video-section {
    padding-right: 16px;
  }
  
  .chat-section {
    width: 100%;
    height: 50vh;
  }
}
</style>
```

**Step 2: Commit**

```bash
git add src/views/RoomView.vue
git commit -m "feat: implement RoomView with video and chat"
```

---

## Phase 3: 增强功能

### Task 12: 历史页面

**Files:**
- Modify: `frontend/src/views/HistoryView.vue`

### Task 13: 个人中心

**Files:**
- Modify: `frontend/src/views/ProfileView.vue`

### Task 14: 表情选择器增强

**Files:**
- Modify: `frontend/src/components/chat/MessageInput.vue`

---

## Phase 4: 优化

### Task 15: 性能优化

### Task 16: 部署配置

---

## 执行建议

1. **按 Phase 顺序开发**：基础设施 → 核心功能 → 增强功能 → 优化
2. **每个 Task 完成后测试**：确保基本功能可用后再继续
3. **前后端联调**：Phase 2 核心功能需要后端 API 配合
4. **组件复用**：创建的基础组件（如按钮、输入框）可在多处复用

---

**Plan version**: v1.0  
**Created**: 2026-02-28
