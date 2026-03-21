import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChatStore } from '@/stores/chat'

// 模拟 API 服务
vi.mock('@/services/api', () => ({
  RoomApi: {
    getChatMessages: vi.fn()
  }
}))

describe('Chat Store', () => {
  let chatStore

  beforeEach(() => {
    setActivePinia(createPinia())
    chatStore = useChatStore()
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      expect(chatStore.messages).toEqual([])
      expect(chatStore.loading).toBe(false)
    })

    it('应该正确计算排序后的消息', () => {
      const message1 = {
        id: 1,
        content: '消息1',
        timestamp: '2024-01-01T10:00:00Z'
      }
      const message2 = {
        id: 2,
        content: '消息2',
        timestamp: '2024-01-01T09:00:00Z'
      }
      const message3 = {
        id: 3,
        content: '消息3',
        timestamp: '2024-01-01T11:00:00Z'
      }

      chatStore.messages = [message1, message2, message3]

      expect(chatStore.sortedMessages).toEqual([message2, message1, message3])
    })
  })

  describe('addMessage', () => {
    it('应该添加新消息', () => {
      const message = {
        id: 1,
        content: '测试消息',
        senderId: 'user1',
        senderNickname: '用户1',
        timestamp: '2024-01-01T10:00:00Z'
      }

      chatStore.addMessage(message)

      expect(chatStore.messages).toHaveLength(1)
      expect(chatStore.messages[0]).toMatchObject({
        id: 1,
        content: '测试消息',
        type: 'text',
        senderId: 'user1',
        senderNickname: '用户1'
      })
    })

    it('应该为消息设置默认类型', () => {
      const message = {
        id: 1,
        content: '测试消息',
        senderId: 'user1'
      }

      chatStore.addMessage(message)

      expect(chatStore.messages[0].type).toBe('text')
    })

    it('应该为消息设置默认时间戳', () => {
      const message = {
        id: 1,
        content: '测试消息',
        senderId: 'user1'
      }

      const beforeTime = new Date().toISOString()
      chatStore.addMessage(message)
      const afterTime = new Date().toISOString()

      expect(chatStore.messages[0].timestamp).toBeDefined()
      expect(chatStore.messages[0].timestamp >= beforeTime).toBe(true)
      expect(chatStore.messages[0].timestamp <= afterTime).toBe(true)
    })

    it('应该为消息生成默认 ID', () => {
      const message = {
        content: '测试消息',
        senderId: 'user1'
      }

      chatStore.addMessage(message)

      expect(chatStore.messages[0].id).toBeDefined()
    })

    it('应该防止重复消息', () => {
      const message = {
        id: 1,
        content: '测试消息',
        senderId: 'user1',
        timestamp: '2024-01-01T10:00:00Z'
      }

      chatStore.addMessage(message)
      chatStore.addMessage(message)

      expect(chatStore.messages).toHaveLength(1)
    })

    it('应该允许不同时间戳的相同内容消息', () => {
      const message1 = {
        content: '测试消息',
        senderId: 'user1',
        timestamp: '2024-01-01T10:00:00Z'
      }
      const message2 = {
        content: '测试消息',
        senderId: 'user1',
        timestamp: '2024-01-01T10:01:00Z'
      }

      chatStore.addMessage(message1)
      chatStore.addMessage(message2)

      expect(chatStore.messages).toHaveLength(2)
    })
  })

  describe('addSystemMessage', () => {
    it('应该添加系统消息', () => {
      chatStore.addSystemMessage('系统通知')

      expect(chatStore.messages).toHaveLength(1)
      expect(chatStore.messages[0].type).toBe('system')
      expect(chatStore.messages[0].content).toBe('系统通知')
    })

    it('应该为系统消息设置时间戳', () => {
      const beforeTime = new Date().toISOString()
      chatStore.addSystemMessage('系统通知')
      const afterTime = new Date().toISOString()

      expect(chatStore.messages[0].timestamp).toBeDefined()
      expect(chatStore.messages[0].timestamp >= beforeTime).toBe(true)
      expect(chatStore.messages[0].timestamp <= afterTime).toBe(true)
    })

    it('应该为系统消息生成 ID', () => {
      chatStore.addSystemMessage('系统通知')

      expect(chatStore.messages[0].id).toBeDefined()
    })
  })

  describe('loadHistory', () => {
    it('应该加载历史消息', async () => {
const mockMessages = {
        data: {
          data: [
            { id: 1, content: '历史消息1', messageType: 'text', sessionId: 'user1' },
            { id: 2, content: '历史消息2', messageType: 'text', sessionId: 'user1' }
          ]
        }
      }

      const { RoomApi } = await import('@/services/api')
      RoomApi.getChatMessages.mockResolvedValue(mockMessages)

      await chatStore.loadHistory('room_123')

      expect(RoomApi.getChatMessages).toHaveBeenCalledWith('room_123', { page: 0, size: 20 })
      expect(chatStore.messages).toHaveLength(2)
      expect(chatStore.messages[0].content).toBe('历史消息1')
      expect(chatStore.messages[1].content).toBe('历史消息2')
    })

    it('应该在第一页时替换消息', async () => {
      chatStore.messages = [{ id: 999, content: '现有消息' }]

      const mockMessages = {
        data: {
          data: [
            { id: 1, content: '历史消息1', messageType: 'text', sessionId: 'user1' }
          ]
        }
      }

      const { RoomApi } = await import('@/services/api')
      RoomApi.getChatMessages.mockResolvedValue(mockMessages)

      await chatStore.loadHistory('room_123', 0)

      expect(chatStore.messages).toHaveLength(1)
      expect(chatStore.messages[0].content).toBe('历史消息1')
    })

    it('应该在非第一页时追加消息', async () => {
      chatStore.messages = [{ id: 999, content: '现有消息' }]

      const mockMessages = {
        data: {
          data: [
            { id: 1, content: '历史消息1', messageType: 'text', sessionId: 'user1' }
          ]
        }
      }

      const { RoomApi } = await import('@/services/api')
      RoomApi.getChatMessages.mockResolvedValue(mockMessages)

      await chatStore.loadHistory('room_123', 1)

      expect(chatStore.messages).toHaveLength(2)
      expect(chatStore.messages[0].content).toBe('历史消息1')
      expect(chatStore.messages[1].content).toBe('现有消息')
    })

    it('应该设置加载状态', async () => {
      const mockMessages = { data: { data: [] } }
      const { RoomApi } = await import('@/services/api')
      
      let resolvePromise
      RoomApi.getChatMessages.mockImplementation(() => {
        return new Promise(resolve => {
          resolvePromise = resolve
        })
      })

      const loadPromise = chatStore.loadHistory('room_123')

      expect(chatStore.loading).toBe(true)

      resolvePromise(mockMessages)
      await loadPromise

      expect(chatStore.loading).toBe(false)
    })

    it('应该处理加载失败', async () => {
      const { RoomApi } = await import('@/services/api')
      RoomApi.getChatMessages.mockRejectedValue(new Error('网络错误'))

      await expect(chatStore.loadHistory('room_123')).rejects.toThrow('网络错误')
      expect(chatStore.loading).toBe(false)
    })
  })

  describe('clearMessages', () => {
    it('应该清空所有消息', () => {
      chatStore.messages = [
        { id: 1, content: '消息1' },
        { id: 2, content: '消息2' }
      ]

      chatStore.clearMessages()

      expect(chatStore.messages).toEqual([])
    })

    it('应该在空消息时正常执行', () => {
      chatStore.messages = []

      expect(() => chatStore.clearMessages()).not.toThrow()
      expect(chatStore.messages).toEqual([])
    })
  })
})