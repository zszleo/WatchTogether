// frontend/src/stores/chat.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { RoomApi } from '@/services/api'

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
    // 检查是否已存在相同内容、发送者和时间戳的消息（防止重复添加）
    const isDuplicate = messages.value.some(existingMsg => 
      existingMsg.content === msg.content &&
      existingMsg.senderId === msg.senderId &&
      existingMsg.timestamp === msg.timestamp
    )
    
    if (isDuplicate) {
      return
    }
    
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
  async function loadHistory(roomCode, page = 1) {
    loading.value = true
    try {
      const resp = await RoomApi.getChatMessages(roomCode, { page, size: 20 })
      const data = resp.data
      const historicalMessages = (data.messages || []).map(msg => ({
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