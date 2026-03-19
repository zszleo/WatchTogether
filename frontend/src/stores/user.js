// frontend/src/stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { SessionApi } from '@/services/api'

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
    const nicknameToUse = nick || `游客${Math.floor(Math.random() * 10000)}`
    const data = await SessionApi.createSession({ nickname: nicknameToUse })
    
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
    
    const updated = await SessionApi.updateProfile(sessionId.value, data)
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