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
    if (this.socket) return
    
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:19090'
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })
    
    this.socket.on('connect', () => {
      this.connected.value = true
    })
    
    this.socket.on('disconnect', () => {
      this.connected.value = false
    })
    
    // 重新加入房间
    this.socket.on('connect', () => {
      if (this.currentRoom.value) {
        this.joinRoom(this.currentRoom.value.roomCode, this.currentRoom.value.sessionId)
      }
    })
  }
  
  disconnect() {
    this.socket?.disconnect()
    this.socket = null
    this.connected.value = false
  }
  
  joinRoom(roomCode, sessionId) {
    this.currentRoom.value = { roomCode, sessionId }
    this.socket?.emit('join-room', { roomCode, sessionId })
  }
  
  leaveRoom(roomCode) {
    this.socket?.emit('leave-room', { roomCode })
    this.currentRoom.value = null
  }
  
  // 视频控制
  emitVideoPlay(roomCode, time) {
    this.socket?.emit('video:play', { roomCode, time })
  }
  
  emitVideoPause(roomCode) {
    this.socket?.emit('video:pause', { roomCode })
  }
  
  emitVideoSeek(roomCode, time) {
    this.socket?.emit('video:seek', { roomCode, time })
  }
  
  emitVideoUrlChange(roomCode, url) {
    this.socket?.emit('video:url-change', { roomCode, url })
  }
  
  // 聊天
  emitChatMessage(roomCode, content, type = 'text', senderId, senderNickname) {
    this.socket?.emit('chat:message', {
      roomCode,
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