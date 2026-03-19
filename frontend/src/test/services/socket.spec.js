import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { socketService } from '@/services/socket'

// 设置测试环境变量
import.meta.env.VITE_SOCKET_URL = 'http://localhost:19090'

describe('Socket Service', () => {
  beforeEach(() => {
    // 重置 socketService 状态
    socketService.disconnect()
    socketService.listeners.clear()
  })

  afterEach(() => {
    socketService.disconnect()
  })

  describe('connect', () => {
    it('应该创建 socket 连接', async () => {
      socketService.connect()
      
      expect(socketService.socket).toBeDefined()
    })

    it('不应该重复连接', () => {
      socketService.connect()
      const firstSocket = socketService.socket
      
      socketService.connect()
      
      expect(socketService.socket).toBe(firstSocket)
    })

    it('应该在连接成功时设置 connected 状态', async () => {
      socketService.connect()
      
      // 等待连接建立
      await new Promise(resolve => {
        socketService.socket.on('connect', resolve)
      })
      
      expect(socketService.connected.value).toBe(true)
    }, 10000)

    it('应该在断开连接时设置 connected 状态', async () => {
      socketService.connect()
      
      // 等待连接建立
      await new Promise(resolve => {
        socketService.socket.on('connect', resolve)
      })
      
      socketService.disconnect()
      
      expect(socketService.connected.value).toBe(false)
    }, 10000)
  })

  describe('disconnect', () => {
    it('应该断开 socket 连接', async () => {
      socketService.connect()
      
      // 等待连接建立
      await new Promise(resolve => {
        socketService.socket.on('connect', resolve)
      })
      
      socketService.disconnect()
      
      expect(socketService.socket).toBeNull()
      expect(socketService.connected.value).toBe(false)
    }, 10000)

    it('应该在没有连接时正常执行', () => {
      expect(() => socketService.disconnect()).not.toThrow()
    })
  })

  describe('joinRoom', () => {
    it('应该发送加入房间事件', async () => {
      socketService.connect()
      
      // 等待连接建立
      await new Promise(resolve => {
        socketService.socket.on('connect', resolve)
      })
      
      const roomId = 'room_123'
      const sessionId = 'session_123'
      
      socketService.joinRoom(roomId, sessionId)
      
      expect(socketService.currentRoom.value).toEqual({ roomId, sessionId })
    }, 10000)
  })

  describe('leaveRoom', () => {
    it('应该发送离开房间事件', async () => {
      socketService.connect()
      
      // 等待连接建立
      await new Promise(resolve => {
        socketService.socket.on('connect', resolve)
      })
      
      socketService.currentRoom.value = { roomId: 'room_123', sessionId: 'session_123' }
      
      socketService.leaveRoom('room_123')
      
      expect(socketService.currentRoom.value).toBeNull()
    }, 10000)
  })

  describe('视频控制事件', () => {
    beforeEach(async () => {
      socketService.connect()
      // 等待连接建立
      await new Promise(resolve => {
        socketService.socket.on('connect', resolve)
      })
    }, 10000)

    it('应该发送视频播放事件', () => {
      expect(() => {
        socketService.emitVideoPlay('room_123', 100)
      }).not.toThrow()
    })

    it('应该发送视频暂停事件', () => {
      expect(() => {
        socketService.emitVideoPause('room_123')
      }).not.toThrow()
    })

    it('应该发送视频跳转事件', () => {
      expect(() => {
        socketService.emitVideoSeek('room_123', 200)
      }).not.toThrow()
    })

    it('应该发送视频 URL 变更事件', () => {
      const newUrl = 'http://example.com/new-video.mp4'
      
      expect(() => {
        socketService.emitVideoUrlChange('room_123', newUrl)
      }).not.toThrow()
    })
  })

  describe('聊天事件', () => {
    beforeEach(async () => {
      socketService.connect()
      // 等待连接建立
      await new Promise(resolve => {
        socketService.socket.on('connect', resolve)
      })
    }, 10000)

    it('应该发送聊天消息', () => {
      const roomId = 'room_123'
      const content = '测试消息'
      const senderId = 'user_123'
      const senderNickname = '测试用户'
      
      expect(() => {
        socketService.emitChatMessage(roomId, content, 'text', senderId, senderNickname)
      }).not.toThrow()
    })

    it('应该支持自定义消息类型', () => {
      expect(() => {
        socketService.emitChatMessage('room_123', '图片消息', 'image', 'user_123', '测试用户')
      }).not.toThrow()
    })
  })

  describe('事件监听', () => {
    beforeEach(async () => {
      socketService.connect()
      // 等待连接建立
      await new Promise(resolve => {
        socketService.socket.on('connect', resolve)
      })
    }, 10000)

    it('应该注册事件监听器', () => {
      const callback = vi.fn()
      
      socketService.on('test-event', callback)
      
      expect(socketService.listeners.get('test-event')).toBe(callback)
    })

    it('应该移除事件监听器', () => {
      const callback = vi.fn()
      socketService.on('test-event', callback)
      
      socketService.off('test-event')
      
      expect(socketService.listeners.has('test-event')).toBe(false)
    })

    it('应该注册用户加入事件监听器', () => {
      const callback = vi.fn()
      
      socketService.onUserJoined(callback)
      
      expect(socketService.listeners.get('user-joined')).toBe(callback)
    })

    it('应该注册用户离开事件监听器', () => {
      const callback = vi.fn()
      
      socketService.onUserLeft(callback)
      
      expect(socketService.listeners.get('user-left')).toBe(callback)
    })

    it('应该注册房间状态事件监听器', () => {
      const callback = vi.fn()
      
      socketService.onRoomState(callback)
      
      expect(socketService.listeners.get('room-state')).toBe(callback)
    })

    it('应该注册视频同步播放事件监听器', () => {
      const callback = vi.fn()
      
      socketService.onVideoSyncPlay(callback)
      
      expect(socketService.listeners.get('video:sync-play')).toBe(callback)
    })

    it('应该注册视频同步暂停事件监听器', () => {
      const callback = vi.fn()
      
      socketService.onVideoSyncPause(callback)
      
      expect(socketService.listeners.get('video:sync-pause')).toBe(callback)
    })

    it('应该注册视频同步跳转事件监听器', () => {
      const callback = vi.fn()
      
      socketService.onVideoSyncSeek(callback)
      
      expect(socketService.listeners.get('video:sync-seek')).toBe(callback)
    })

    it('应该注册视频同步 URL 变更事件监听器', () => {
      const callback = vi.fn()
      
      socketService.onVideoSyncUrlChange(callback)
      
      expect(socketService.listeners.get('video:sync-url-change')).toBe(callback)
    })

    it('应该注册聊天消息事件监听器', () => {
      const callback = vi.fn()
      
      socketService.onChatMessage(callback)
      
      expect(socketService.listeners.get('chat:message')).toBe(callback)
    })

    it('应该注册系统消息事件监听器', () => {
      const callback = vi.fn()
      
      socketService.onSystemMessage(callback)
      
      expect(socketService.listeners.get('system:message')).toBe(callback)
    })
  })

  describe('重新连接', () => {
    it('应该在重新连接时自动加入房间', async () => {
      socketService.connect()
      
      // 等待连接建立
      await new Promise(resolve => {
        socketService.socket.on('connect', resolve)
      })
      
      socketService.joinRoom('room_123', 'session_123')
      
      // 模拟重新连接
      socketService.disconnect()
      socketService.connect()
      
      // 等待重新连接
      await new Promise(resolve => {
        socketService.socket.on('connect', resolve)
      })
      
      // 应该自动重新加入房间
      expect(socketService.currentRoom.value).toEqual({
        roomId: 'room_123',
        sessionId: 'session_123'
      })
    }, 15000)
  })
})