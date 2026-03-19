// frontend/src/stores/room.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { RoomApi } from '@/services/api'
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
    const result = await RoomApi.createRoom(data)
    return result
  }
  
  // 加入房间
  async function joinRoom(roomId, sessionId = null) {
    const room = await RoomApi.getRoom(roomId, { sessionId })
    currentRoom.value = room
    
    // 连接Socket并加入
    socketService.connect()
    
    // 如果有sessionId，加入socket房间
    if (sessionId) {
      setTimeout(() => {
        socketService.joinRoom(roomId, sessionId)
      }, 500)
    }
    
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
    publicRooms.value = await RoomApi.getPublicRooms()
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