<!-- frontend/src/components/chat/ChatPanel.vue -->
<template>
  <div class="chat-panel">
    <div class="chat-header">
      <div class="room-info">
        <h3 class="room-name">{{ roomStore.currentRoom?.name || '房间' }}</h3>
        <span class="room-id">{{ roomStore.currentRoom?.code }}</span>
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
import { onMounted, onUnmounted, ref } from 'vue'
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
const chatMessageCallback = (msg) => chatStore.addMessage(msg)
const systemMessageCallback = (msg) => chatStore.addSystemMessage(msg.content)
const userJoinedCallback = (user) => {
  roomStore.addUser(user)
  chatStore.addSystemMessage(`${user.nickname} 加入了房间`)
}
const userLeftCallback = (user) => {
  roomStore.removeUser(user.sessionId)
  chatStore.addSystemMessage(`${user.nickname} 离开了房间`)
}

// 跟踪是否已设置监听器
const listenersSet = ref(false)

function setupSocketListeners() {
  if (listenersSet.value) return
  
  socketService.onChatMessage(chatMessageCallback)
  socketService.onSystemMessage(systemMessageCallback)
  socketService.onUserJoined(userJoinedCallback)
  socketService.onUserLeft(userLeftCallback)
  
  listenersSet.value = true
}

function cleanupSocketListeners() {
  if (!listenersSet.value) return
  
  socketService.off('chat:message', chatMessageCallback)
  socketService.off('system:message', systemMessageCallback)
  socketService.off('user-joined', userJoinedCallback)
  socketService.off('user-left', userLeftCallback)
  
  listenersSet.value = false
}

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

async function copyInviteLink() {
  if (!roomStore.currentRoom?.code) return
  const link = `${window.location.origin}/join/${roomStore.currentRoom.code}`
  try {
    await navigator.clipboard.writeText(link)
    alert('邀请链接已复制')
  } catch (error) {
    alert('复制失败，请手动复制链接')
  }
}

onMounted(async () => {
  if (!roomStore.currentRoom?.code) return
  
  setupSocketListeners()
  
  // 加入Socket房间
  socketService.joinRoom(roomStore.currentRoom.code, userStore.sessionId)
  
  // 加载历史消息
  await chatStore.loadHistory(roomStore.currentRoom.code)
})

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