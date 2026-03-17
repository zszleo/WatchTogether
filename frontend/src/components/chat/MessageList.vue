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