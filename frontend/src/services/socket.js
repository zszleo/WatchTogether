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
    // 如果 socket 已存在且已连接，直接返回
    if (this.socket && this.socket.connected) {
      console.log('[Socket] Already connected')
      return Promise.resolve()
    }
    
    // 如果 socket 存在但未连接，先断开
    if (this.socket) {
      console.log('[Socket] Socket exists but not connected, reconnecting...')
      this.socket.disconnect()
      this.socket = null
      // 注意：不清除 listeners，保留它们用于重连时重新注册
    }
    
    return new Promise((resolve) => {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:19090'
      console.log('[Socket] Connecting to:', socketUrl)
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      })
      
      this.socket.on('connect', () => {
        console.log('[Socket] Connected successfully')
        this.connected.value = true
        
        // 重新注册所有监听器（在重连后）
        this.reregisterListeners()
        
        resolve()
      })
      
      this.socket.on('disconnect', () => {
        console.log('[Socket] Disconnected')
        this.connected.value = false
      })
      
      this.socket.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error)
      })
    })
  }
  
  disconnect() {
    this.socket?.disconnect()
    this.socket = null
    this.connected.value = false
    this.currentRoom.value = null
    this.listeners.clear()
  }

  resetRoomState() {
    console.log('[Socket] Resetting room state')
    this.currentRoom.value = null
  }
  
  joinRoom(roomCode, sessionId) {
    // 幂等性检查：如果已经在目标房间，跳过
    if (this.currentRoom.value?.roomCode === roomCode) {
      return
    }
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
  emitChatMessage(roomCode, content, type = 'text', senderId, senderNickname, color = null) {
    const data = {
      roomCode,
      message: content,
      sender: senderNickname,
      type,
      senderId,
      timestamp: new Date().toISOString()
    }
    if (color) {
      data.color = color
    }
    this.socket?.emit('chat:message', data)
  }
  
  // 事件监听
  on(event, callback) {
    console.log(`[Socket] Registering listener for event: ${event}`)
    // 先移除旧的监听器，避免重复
    const existingCallback = this.listeners.get(event)
    if (existingCallback) {
      this.socket?.off(event, existingCallback)
    }
    this.socket?.on(event, callback)
    this.listeners.set(event, callback)
    console.log(`[Socket] Listener registered for event: ${event}, socket connected: ${this.socket?.connected}`)
  }
  
  off(event) {
    const callback = this.listeners.get(event)
    if (callback) {
      this.socket?.off(event, callback)
      this.listeners.delete(event)
    }
  }

  // 重新注册所有监听器（用于重连后）
  reregisterListeners() {
    if (!this.socket) return
    
    console.log('[Socket] Reregistering', this.listeners.size, 'listeners')
    for (const [event, callback] of this.listeners) {
      this.socket.off(event, callback) // 先移除旧的
      this.socket.on(event, callback)  // 再注册新的
      console.log('[Socket] Reregistered listener for:', event)
    }
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