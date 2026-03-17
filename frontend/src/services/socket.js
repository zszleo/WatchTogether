// frontend/src/services/socket.js
import { io } from 'socket.io-client'
import { ref, readonly } from 'vue'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' // 从环境变量读取mock配置

// Mock Socket类
class MockSocket {
  constructor() {
    this.connected = false
    this.listeners = new Map()
    this.emitQueue = []
  }
  
  connect() {
    setTimeout(() => {
      this.connected = true
      const connectCallback = this.listeners.get('connect')
      if (connectCallback) {
        connectCallback()
      }
      console.log('[Mock] Socket connected')
    }, 200)
  }
  
  disconnect() {
    this.connected = false
    const disconnectCallback = this.listeners.get('disconnect')
    if (disconnectCallback) {
      disconnectCallback()
    }
    console.log('[Mock] Socket disconnected')
  }
  
  emit(event, data) {
    console.log(`[Mock] emit ${event}:`, data)
    this.emitQueue.push({ event, data })
    
    // 模拟服务器响应
    setTimeout(() => {
      this.handleMockEvent(event, data)
    }, 100)
  }
  
  on(event, callback) {
    this.listeners.set(event, callback)
  }
  
  off(event) {
    this.listeners.delete(event)
  }
  
  handleMockEvent(event, data) {
    switch (event) {
      case 'join-room':
        // 模拟用户加入
        setTimeout(() => {
          const userJoinedCallback = this.listeners.get('user-joined')
          if (userJoinedCallback) {
            userJoinedCallback({
              sessionId: 'mock-user-' + Math.random().toString(36).substring(2, 8),
              nickname: ['小明', '小红', '张三', '李四'][Math.floor(Math.random() * 4)],
              avatar: '😀',
              isOnline: true
            })
          }
          
          // 发送房间状态
          const roomStateCallback = this.listeners.get('room-state')
          if (roomStateCallback) {
            roomStateCallback({
              roomId: data.roomId,
              users: [
                { sessionId: data.sessionId, nickname: '当前用户', avatar: '👤', isOnline: true },
                { sessionId: 'mock-user-1', nickname: '小明', avatar: '😀', isOnline: true },
                { sessionId: 'mock-user-2', nickname: '小红', avatar: '😊', isOnline: true }
              ],
              videoState: {
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                isPlaying: false,
                currentTime: 0,
                duration: 596
              }
            })
          }
        }, 300)
        break
        
      case 'video:play':
        setTimeout(() => {
          const syncPlayCallback = this.listeners.get('video:sync-play')
          if (syncPlayCallback) {
            syncPlayCallback({ time: data.time })
          }
        }, 200)
        break
        
      case 'video:pause':
        setTimeout(() => {
          const syncPauseCallback = this.listeners.get('video:sync-pause')
          if (syncPauseCallback) {
            syncPauseCallback()
          }
        }, 200)
        break
        
      case 'video:seek':
        setTimeout(() => {
          const syncSeekCallback = this.listeners.get('video:sync-seek')
          if (syncSeekCallback) {
            syncSeekCallback({ time: data.time })
          }
        }, 200)
        break
        
      case 'chat:message':
        setTimeout(() => {
          const chatCallback = this.listeners.get('chat:message')
          if (chatCallback) {
            chatCallback({
              id: 'msg-' + Date.now(),
              content: data.content,
              type: data.type,
              senderId: data.senderId,
              senderNickname: data.senderNickname,
              timestamp: data.timestamp
            })
          }
        }, 150)
        break
    }
  }
}

class SocketService {
  constructor() {
    this.socket = null
    this.connected = ref(false)
    this.currentRoom = ref(null)
    this.listeners = new Map()
  }
  
  connect() {
    if (this.socket?.connected) return
    
    if (USE_MOCK) {
      this.socket = new MockSocket()
      this.socket.connect()
      
      this.socket.on('connect', () => {
        this.connected.value = true
        console.log('[Mock] Socket connected')
      })
      
      this.socket.on('disconnect', () => {
        this.connected.value = false
        console.log('[Mock] Socket disconnected')
      })
      
      // 重新加入房间
      this.socket.on('connect', () => {
        if (this.currentRoom.value) {
          this.joinRoom(this.currentRoom.value.roomId, this.currentRoom.value.sessionId)
        }
      })
    } else {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || '/'
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      })
      
      this.socket.on('connect', () => {
        this.connected.value = true
        console.log('Socket connected')
      })
      
      this.socket.on('disconnect', () => {
        this.connected.value = false
        console.log('Socket disconnected')
      })
      
      // 重新加入房间
      this.socket.on('connect', () => {
        if (this.currentRoom.value) {
          this.joinRoom(this.currentRoom.value.roomId, this.currentRoom.value.sessionId)
        }
      })
    }
  }
  
  disconnect() {
    this.socket?.disconnect()
    this.socket = null
    this.connected.value = false
  }
  
  joinRoom(roomId, sessionId) {
    this.currentRoom.value = { roomId, sessionId }
    this.socket?.emit('join-room', { roomId, sessionId })
  }
  
  leaveRoom(roomId) {
    this.socket?.emit('leave-room', { roomId })
    this.currentRoom.value = null
  }
  
  // 视频控制
  emitVideoPlay(roomId, time) {
    this.socket?.emit('video:play', { roomId, time })
  }
  
  emitVideoPause(roomId) {
    this.socket?.emit('video:pause', { roomId })
  }
  
  emitVideoSeek(roomId, time) {
    this.socket?.emit('video:seek', { roomId, time })
  }
  
  emitVideoUrlChange(roomId, url) {
    this.socket?.emit('video:url-change', { roomId, url })
  }
  
  // 聊天
  emitChatMessage(roomId, content, type = 'text', senderId, senderNickname) {
    this.socket?.emit('chat:message', {
      roomId,
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