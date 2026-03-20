import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRoomStore } from '@/stores/room'

// 模拟 API 服务
vi.mock('@/services/api', () => ({
  RoomApi: {
    createRoom: vi.fn(),
    getRoom: vi.fn(),
    getPublicRooms: vi.fn()
  },
  SessionApi: {
    joinRoom: vi.fn()
  }
}))

// 模拟 socket 服务
vi.mock('@/services/socket', () => ({
  socketService: {
    connect: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn()
  }
}))

describe('Room Store', () => {
  let roomStore

  beforeEach(() => {
    setActivePinia(createPinia())
    roomStore = useRoomStore()
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      expect(roomStore.currentRoom).toBeNull()
      expect(roomStore.users).toEqual([])
      expect(roomStore.videoState).toEqual({
        url: '',
        isPlaying: false,
        currentTime: 0,
        duration: 0
      })
      expect(roomStore.publicRooms).toEqual([])
    })

    it('应该正确计算用户数量', () => {
      expect(roomStore.userCount).toBe(0)
      
      roomStore.users = [
        { sessionId: '1', username: 'user1' },
        { sessionId: '2', username: 'user2' }
      ]
      
      expect(roomStore.userCount).toBe(2)
    })
  })

  describe('createRoom', () => {
    it('应该成功创建房间', async () => {
      const mockRoom = {
        id: 'room_123',
        code: 'ABC123',
        name: '测试房间',
        ownerId: 'user_123'
      }
      
      const { RoomApi, SessionApi } = await import('@/services/api')
      RoomApi.createRoom.mockResolvedValue({ data: mockRoom })
      SessionApi.joinRoom.mockResolvedValue({})
      
      const result = await roomStore.createRoom({
        name: '测试房间',
        description: '测试描述',
        creatorSessionId: 'session_123'
      })
      
      expect(RoomApi.createRoom).toHaveBeenCalledWith({
        name: '测试房间',
        description: '测试描述',
        creatorSessionId: 'session_123'
      })
      expect(SessionApi.joinRoom).toHaveBeenCalledWith('session_123', 'room_123')
      expect(result).toEqual(mockRoom)
    })

    it('应该处理创建房间失败', async () => {
      const { RoomApi } = await import('@/services/api')
      RoomApi.createRoom.mockRejectedValue(new Error('创建失败'))
      
      await expect(roomStore.createRoom({ name: '测试房间' }))
        .rejects.toThrow('创建失败')
    })
  })

  describe('joinRoom', () => {
    it('应该成功加入房间', async () => {
      const mockRoom = {
        id: 'room_123',
        name: '测试房间',
        users: []
      }
      
      const { RoomApi, SessionApi } = await import('@/services/api')
      const { socketService } = await import('@/services/socket')
      
      RoomApi.getRoom.mockResolvedValue({ data: mockRoom })
      SessionApi.joinRoom.mockResolvedValue({})
      
      const result = await roomStore.joinRoom('room_123')
      
      expect(RoomApi.getRoom).toHaveBeenCalledWith('room_123', { sessionId: null })
      expect(socketService.connect).toHaveBeenCalled()
      expect(roomStore.currentRoom).toEqual(mockRoom)
      expect(result).toEqual(mockRoom)
    })

    it('应该在有 sessionId 时加入 socket 房间并记录历史', async () => {
      const mockRoom = { id: 'room_123', code: 'ABC123', name: '测试房间' }
      const sessionId = 'session_123'
      
      const { RoomApi, SessionApi } = await import('@/services/api')
      const { socketService } = await import('@/services/socket')
      
      RoomApi.getRoom.mockResolvedValue({ data: mockRoom })
      SessionApi.joinRoom.mockResolvedValue({})
      
      const joinPromise = roomStore.joinRoom('room_123', sessionId)
      
      // 等待 joinRoom 完成
      await joinPromise
      
      // 验证历史记录API被调用（使用roomId）
      expect(SessionApi.joinRoom).toHaveBeenCalledWith(sessionId, 'room_123')
      
      // 等待 setTimeout 执行 (500 ms)
      await new Promise(resolve => setTimeout(resolve, 600))
      
      // socket.joinRoom 使用 room.code
      expect(socketService.joinRoom).toHaveBeenCalledWith('ABC123', sessionId)
    })

    it('应该处理加入房间失败', async () => {
      const { RoomApi } = await import('@/services/api')
      RoomApi.getRoom.mockRejectedValue(new Error('房间不存在'))
      
      await expect(roomStore.joinRoom('room_123'))
        .rejects.toThrow('房间不存在')
    })
  })

  describe('leaveRoom', () => {
    it('应该成功离开房间', async () => {
      const { socketService } = await import('@/services/socket')
      
      // 先加入房间
      roomStore.currentRoom = { id: 'room_123', code: 'ABC123', name: '测试房间' }
      roomStore.users = [
        { sessionId: '1', username: 'user1' },
        { sessionId: '2', username: 'user2' }
      ]
      roomStore.videoState = {
        url: 'http://example.com/video.mp4',
        isPlaying: true,
        currentTime: 100,
        duration: 3600
      }
      
      roomStore.leaveRoom()
      
      expect(socketService.leaveRoom).toHaveBeenCalledWith('room_123')
      expect(roomStore.currentRoom).toBeNull()
      expect(roomStore.users).toEqual([])
      expect(roomStore.videoState).toEqual({
        url: '',
        isPlaying: false,
        currentTime: 0,
        duration: 0
      })
    })

    it('应该在没有当前房间时正常执行', () => {
      roomStore.currentRoom = null
      
      expect(() => roomStore.leaveRoom()).not.toThrow()
    })
  })

  describe('updateVideoState', () => {
    it('应该更新视频状态', () => {
      roomStore.updateVideoState({
        isPlaying: true,
        currentTime: 100
      })
      
      expect(roomStore.videoState.isPlaying).toBe(true)
      expect(roomStore.videoState.currentTime).toBe(100)
      expect(roomStore.videoState.url).toBe('')
      expect(roomStore.videoState.duration).toBe(0)
    })

    it('应该部分更新视频状态', () => {
      roomStore.videoState = {
        url: 'http://example.com/video.mp4',
        isPlaying: false,
        currentTime: 0,
        duration: 3600
      }
      
      roomStore.updateVideoState({ currentTime: 500 })
      
      expect(roomStore.videoState.url).toBe('http://example.com/video.mp4')
      expect(roomStore.videoState.isPlaying).toBe(false)
      expect(roomStore.videoState.currentTime).toBe(500)
      expect(roomStore.videoState.duration).toBe(3600)
    })
  })

  describe('用户管理', () => {
    it('应该添加用户', () => {
      const user1 = { sessionId: '1', username: 'user1' }
      const user2 = { sessionId: '2', username: 'user2' }
      
      roomStore.addUser(user1)
      roomStore.addUser(user2)
      
      expect(roomStore.users).toHaveLength(2)
      expect(roomStore.users).toContainEqual(user1)
      expect(roomStore.users).toContainEqual(user2)
    })

    it('不应该添加重复的用户', () => {
      const user1 = { sessionId: '1', username: 'user1' }
      
      roomStore.addUser(user1)
      roomStore.addUser(user1)
      
      expect(roomStore.users).toHaveLength(1)
    })

    it('应该移除用户', () => {
      const user1 = { sessionId: '1', username: 'user1' }
      const user2 = { sessionId: '2', username: 'user2' }
      
      roomStore.addUser(user1)
      roomStore.addUser(user2)
      roomStore.removeUser('1')
      
      expect(roomStore.users).toHaveLength(1)
      expect(roomStore.users).toContainEqual(user2)
      expect(roomStore.users).not.toContainEqual(user1)
    })

    it('应该处理移除不存在的用户', () => {
      roomStore.addUser({ sessionId: '1', username: 'user1' })
      
      roomStore.removeUser('999')
      
      expect(roomStore.users).toHaveLength(1)
    })
  })

  describe('fetchPublicRooms', () => {
    it('应该获取公开房间列表', async () => {
      const mockRooms = [
        { id: '1', name: '房间1' },
        { id: '2', name: '房间2' }
      ]
      
      const { RoomApi } = await import('@/services/api')
      RoomApi.getPublicRooms.mockResolvedValue({ data: mockRooms })
      
      await roomStore.fetchPublicRooms()
      
      expect(RoomApi.getPublicRooms).toHaveBeenCalled()
      expect(roomStore.publicRooms).toEqual(mockRooms)
    })

    it('应该处理获取失败', async () => {
      const { RoomApi } = await import('@/services/api')
      RoomApi.getPublicRooms.mockRejectedValue(new Error('网络错误'))
      
      // fetchPublicRooms 会捕获错误并设置 publicRoomsError
      await roomStore.fetchPublicRooms()
      
      expect(roomStore.publicRoomsError).not.toBeNull()
      expect(roomStore.publicRooms).toEqual([])
    })
  })
})