// frontend/src/stores/room.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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
    currentRoom.value = resp.data
    
    // 记录创建历史
    if (data.creatorSessionId) {
      try {
        await SessionApi.joinRoom(data.creatorSessionId, resp.data.code)
      } catch (error) {
        console.warn('Failed to record create history:', error)
      }
    }
    
    socketService.connect()
    setTimeout(() => {
      // 使用 room.code 而不是 room.id
      socketService.joinRoom(resp.data.code, data.creatorSessionId)
    }, 500)
    
    return resp.data
  }
  
  // 加入房间
  async function joinRoom(roomCode, sessionId = null) {
    const resp = await RoomApi.getRoomByCode(roomCode, { sessionId })
    const room = resp.data
    currentRoom.value = room
    
    // 记录加入历史
    if (sessionId) {
      try {
        await SessionApi.joinRoom(sessionId, room.code)
      } catch (error) {
        console.warn('Failed to record join history:', error)
      }
    }
    
    // 连接Socket并加入
    socketService.connect()
    
    // 如果有sessionId，加入socket房间（使用 room.code）
    if (sessionId) {
      setTimeout(() => {
        socketService.joinRoom(room.code, sessionId)
      }, 500)
    }
    
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