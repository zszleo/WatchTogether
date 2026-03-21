// frontend/src/stores/room.js
import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'
import { RoomApi, SessionApi } from '@/services/api'
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
  const loadingPublicRooms = ref(false)
  const publicRoomsError = ref(null)
  
  const userCount = computed(() => users.value.length)
  
  // 创建房间
  async function createRoom(data) {
    const resp = await RoomApi.createRoom(data)
    
    // 记录创建历史
    if (data.creatorSessionId) {
      try {
        await SessionApi.joinRoom(data.creatorSessionId, resp.data.code)
      } catch (error) {
        console.warn('Failed to record create history:', error)
      }
    }
    
    // 先连接Socket，再设置currentRoom
    console.log('[RoomStore] Connecting socket...')
    await socketService.connect()
    console.log('[RoomStore] Socket connected')
    
    // 设置currentRoom，这会触发ChatPanel的watch
    currentRoom.value = resp.data
    
    return resp.data
  }
  
  // 加入房间
  async function joinRoom(roomCode, sessionId = null) {
    // 如果已经在目标房间中，直接返回
    if (currentRoom.value?.code === roomCode) {
      return currentRoom.value
    }
    
    const resp = await RoomApi.getRoom(roomCode, { sessionId })
    const room = resp.data
    
    // 记录加入历史
    if (sessionId) {
      try {
        await SessionApi.joinRoom(sessionId, room.code)
      } catch (error) {
        console.warn('Failed to record join history:', error)
      }
    }
    
    // 先连接Socket，再设置currentRoom
    // 这样ChatPanel触发时socket已经连接
    console.log('[RoomStore] Connecting socket...')
    await socketService.connect()
    console.log('[RoomStore] Socket connected')
    
    // 设置currentRoom，这会触发ChatPanel的watch
    currentRoom.value = room
    
    return room
  }
  
  // 离开房间
  function leaveRoom() {
    if (currentRoom.value) {
      socketService.leaveRoom(currentRoom.value.code)
    }
    currentRoom.value = null
    users.value = []
    videoState.value = { url: '', isPlaying: false, currentTime: 0, duration: 0 }
  }
  
  // 更新视频状态
  function updateVideoState(state) {
    videoState.value = { ...videoState.value, ...state }
  }
  
  // 添加或更新用户（upsert）
  function addUser(user) {
    console.log('[RoomStore] Adding/updating user:', user)
    const existingIndex = users.value.findIndex(u => u.sessionId === user.sessionId)
    if (existingIndex === -1) {
      users.value.push(user)
      console.log('[RoomStore] User added, total users:', users.value.length)
    } else {
      // 合并现有用户信息和新信息，优先使用新数据
      users.value[existingIndex] = { ...users.value[existingIndex], ...user }
      console.log('[RoomStore] User updated, total users:', users.value.length)
    }
  }
  
  // 移除用户
  function removeUser(sessionId) {
    users.value = users.value.filter(u => u.sessionId !== sessionId)
  }
  
  // 获取公开房间列表
  async function fetchPublicRooms() {
    loadingPublicRooms.value = true
    publicRoomsError.value = null
    try {
      const resp = await RoomApi.getPublicRooms()
      publicRooms.value = resp.data
    } catch (error) {
      publicRoomsError.value = error
      publicRooms.value = []
    } finally {
      loadingPublicRooms.value = false
    }
  }
  
  return {
    currentRoom,
    users,
    videoState,
    publicRooms,
    loadingPublicRooms,
    publicRoomsError,
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