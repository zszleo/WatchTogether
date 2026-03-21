<!-- frontend/src/components/chat/ChatPanel.vue -->
<template>
  <div class="chat-panel">
    <div class="chat-users">
      <h4 class="users-title">在线 ({{ roomStore.userCount }})</h4>
      <div class="users-list">
        <div 
          v-for="user in roomStore.users" 
          :key="user.sessionId"
          class="user-item"
          :class="{ 'current-user': user.sessionId === userStore.sessionId }"
        >
          <span class="user-avatar">{{ user.avatar }}</span>
          <span class="user-name">{{ user.nickname }}</span>
        </div>
      </div>
    </div>
    
    <MessageList :messages="chatStore.sortedMessages" />
    
    <MessageInput @send="handleSend" />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoomStore } from '@/stores/room'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { socketService } from '@/services/socket'
import MessageList from './MessageList.vue'
import MessageInput from './MessageInput.vue'

const roomStore = useRoomStore()
const chatStore = useChatStore()
const userStore = useUserStore()

// 保存监听器回调以便清理
const chatMessageCallback = (msg) => {
  console.log('[ChatPanel] Received chat message:', msg)
  chatStore.addMessage(msg)
}
const systemMessageCallback = (msg) => {
  console.log('[ChatPanel] Received system message:', msg)
  chatStore.addSystemMessage(msg.content)
}
const userJoinedCallback = (user) => {
  roomStore.addUser(user)
}
const userLeftCallback = (user) => {
  roomStore.removeUser(user.sessionId)
}
const roomStateCallback = (state) => {
  console.log('[ChatPanel] Received room-state:', state)
  // 初始化用户列表
  if (state.userList && Array.isArray(state.userList)) {
    console.log('[ChatPanel] Setting user list:', state.userList)
    // 先清空现有用户列表，避免重复
    roomStore.users.value = []
    state.userList.forEach(user => roomStore.addUser(user))
  }
}

// 跟踪是否已设置监听器
const listenersSet = ref(false)

function setupSocketListeners() {
  if (listenersSet.value) return
  
  // 先清理可能存在的旧监听器
  cleanupSocketListeners()
  
  socketService.onChatMessage(chatMessageCallback)
  socketService.onSystemMessage(systemMessageCallback)
  socketService.onUserJoined(userJoinedCallback)
  socketService.onUserLeft(userLeftCallback)
  socketService.onRoomState(roomStateCallback)
  
  listenersSet.value = true
}

function cleanupSocketListeners() {
  if (!listenersSet.value) return
  
  socketService.off('chat:message', chatMessageCallback)
  socketService.off('system:message', systemMessageCallback)
  socketService.off('user-joined', userJoinedCallback)
  socketService.off('user-left', userLeftCallback)
  socketService.off('room-state', roomStateCallback)
  
  listenersSet.value = false
}

// 监听房间变化，自动加载历史消息
watch(() => roomStore.currentRoom?.code, async (roomCode, oldRoomCode) => {
  console.log('[ChatPanel] Room code changed:', roomCode, 'from:', oldRoomCode)
  
  // 如果房间变化了，重置监听器状态
  if (roomCode !== oldRoomCode) {
    console.log('[ChatPanel] Resetting listeners state')
    listenersSet.value = false
  }
  
  if (!roomCode) return
  
  console.log('[ChatPanel] Setting up socket listeners...')
  setupSocketListeners()
  console.log('[ChatPanel] Socket listeners set up')
  
  // 监听器设置完成后，发送 join-room 事件
  if (userStore.sessionId) {
    console.log('[ChatPanel] Emitting join-room for room:', roomCode)
    socketService.joinRoom(roomCode, userStore.sessionId)
    console.log('[ChatPanel] Join room emitted')
  }
  
  // 加载历史消息
  await chatStore.loadHistory(roomCode)
}, { immediate: true })

function handleSend(content, type = 'text') {
  if (!content.trim()) return
  if (!roomStore.currentRoom?.code) return
  
  socketService.emitChatMessage(
    roomStore.currentRoom.code,
    content,
    type,
    userStore.sessionId,
    userStore.nickname
  )
}

onUnmounted(() => {
  cleanupSocketListeners()
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

.user-item.current-user {
  background: var(--accent-secondary);
  box-shadow: 0 0 0 2px var(--accent-primary);
  font-weight: 600;
}
</style>