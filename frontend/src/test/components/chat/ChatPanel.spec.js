import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock message module - must be before other imports
vi.mock('@/utils/message', () => {
  const mockMessage = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }
  return {
    message: mockMessage,
    default: mockMessage
  }
})

import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ChatPanel from '@/components/chat/ChatPanel.vue'
import { useRoomStore } from '@/stores/room'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { socketService } from '@/services/socket'
import { message } from '@/utils/message'

vi.mock('@/services/api', () => ({
  RoomApi: {
    getChatMessages: vi.fn().mockResolvedValue({ messages: [] }),
    getInviteLink: vi.fn().mockResolvedValue({ link: 'http://test.com' })
  }
}))

// Mock socket service
vi.mock('@/services/socket', () => ({
  socketService: {
    onChatMessage: vi.fn(),
    onSystemMessage: vi.fn(),
    onUserJoined: vi.fn(),
    onUserLeft: vi.fn(),
    off: vi.fn(),
    joinRoom: vi.fn(),
    emitChatMessage: vi.fn(),
    listeners: new Map()
  }
}))

describe('ChatPanel', () => {
  let wrapper
  let pinia
  let roomStore
  let chatStore
  let userStore

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    roomStore = useRoomStore()
    chatStore = useChatStore()
    userStore = useUserStore()
    
    // 设置初始状态
    roomStore.currentRoom = { id: 'test-room-123', code: 'ABC123', name: '测试房间' }
    roomStore.users = []
    roomStore.userCount = 0
    userStore.sessionId = 'session-123'
    userStore.nickname = '测试用户'
    
    // 预加载历史消息为空
    chatStore.messages = []
    chatStore.sortedMessages = []
    
    // Mock store methods
    vi.spyOn(chatStore, 'addMessage').mockImplementation((msg) => {
      chatStore.messages.push(msg)
    })
    vi.spyOn(chatStore, 'addSystemMessage').mockImplementation((content) => {
      chatStore.messages.push({
        id: Date.now(),
        content,
        senderId: 'system',
        type: 'system',
        timestamp: new Date().toISOString()
      })
    })
    vi.spyOn(chatStore, 'loadHistory').mockResolvedValue()
    vi.spyOn(roomStore, 'addUser').mockImplementation((user) => {
      roomStore.users.push(user)
      roomStore.userCount = roomStore.users.length
    })
    vi.spyOn(roomStore, 'removeUser').mockImplementation((sessionId) => {
      roomStore.users = roomStore.users.filter(u => u.sessionId !== sessionId)
      roomStore.userCount = roomStore.users.length
    })
    
    // Mock socket service methods
    vi.spyOn(socketService, 'onChatMessage').mockImplementation((callback) => {
      socketService._onChatMessage = callback
    })
    vi.spyOn(socketService, 'onSystemMessage').mockImplementation((callback) => {
      socketService._onSystemMessage = callback
    })
    vi.spyOn(socketService, 'onUserJoined').mockImplementation((callback) => {
      socketService._onUserJoined = callback
    })
    vi.spyOn(socketService, 'onUserLeft').mockImplementation((callback) => {
      socketService._onUserLeft = callback
    })
    vi.spyOn(socketService, 'off').mockImplementation(() => {})
    vi.spyOn(socketService, 'joinRoom').mockImplementation(() => {})
    vi.spyOn(socketService, 'emitChatMessage').mockImplementation(() => {})
    
    // Mock DOM APIs
    Element.prototype.scrollTo = vi.fn()
    
    // Mock clipboard API
    global.navigator.clipboard = {
      writeText: vi.fn().mockResolvedValue()
    }
    
    // Mock window.location
    vi.stubGlobal('location', {
      origin: 'http://localhost:3000'
    })
    
    wrapper = mount(ChatPanel, {
      global: {
        plugins: [pinia]
      }
    })
    await flushPromises()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.restoreAllMocks()
    
    // Restore global mocks
    if (Element.prototype.scrollTo && Element.prototype.scrollTo.mockRestore) {
      Element.prototype.scrollTo.mockRestore()
    } else {
      delete Element.prototype.scrollTo
    }
    
    if (global.navigator.clipboard && global.navigator.clipboard.writeText.mockRestore) {
      global.navigator.clipboard.writeText.mockRestore()
    } else {
      delete global.navigator.clipboard
    }
    
    // window.location is restored automatically by vi.stubGlobal
  })

  describe('渲染测试', () => {
    it('应该渲染聊天面板', () => {
      expect(wrapper.find('.chat-panel').exists()).toBe(true)
    })

    it('应该显示房间名称', () => {
      expect(wrapper.find('.room-name').text()).toContain('测试房间')
    })

    it('应该显示房间ID', () => {
      expect(wrapper.find('.room-id').text()).toContain('ABC123')
    })

    it('应该显示在线用户数量', () => {
      expect(wrapper.find('.users-title').text()).toContain('在线')
    })

    it('应该渲染用户列表', () => {
      expect(wrapper.find('.users-list').exists()).toBe(true)
    })

    it('应该渲染消息列表组件', () => {
      expect(wrapper.findComponent({ name: 'MessageList' }).exists()).toBe(true)
    })

    it('应该渲染消息输入组件', () => {
      expect(wrapper.findComponent({ name: 'MessageInput' }).exists()).toBe(true)
    })

    it('应该有复制邀请链接按钮', () => {
      expect(wrapper.find('.btn-copy-link').exists()).toBe(true)
      expect(wrapper.find('.btn-copy-link').text()).toContain('复制邀请链接')
    })
  })

  describe('用户列表测试', () => {
    it('应该显示用户头像和昵称', async () => {
      roomStore.users = [
        { sessionId: 'session-1', nickname: '用户1', avatar: '😀', isOnline: true },
        { sessionId: 'session-2', nickname: '用户2', avatar: '😎', isOnline: true }
      ]
      
      await flushPromises()
      
      const userItems = wrapper.findAll('.user-item')
      expect(userItems.length).toBe(2)
      expect(userItems[0].text()).toContain('用户1')
      expect(userItems[1].text()).toContain('用户2')
    })

    it('应该显示用户在线状态', async () => {
      roomStore.users = [
        { sessionId: 'session-1', nickname: '用户1', avatar: '😀', isOnline: true }
      ]
      
      await flushPromises()
      
      const userStatus = wrapper.find('.user-status')
      expect(userStatus.classes()).toContain('online')
    })
  })

  describe('消息测试', () => {
    it('应该传递消息列表给 MessageList', async () => {
      chatStore.messages = [
        { id: 1, content: '你好', senderId: 'session-1', type: 'text' },
        { id: 2, content: '世界', senderId: 'session-2', type: 'text' }
      ]
      
      await flushPromises()
      
      const messageList = wrapper.findComponent({ name: 'MessageList' })
      expect(messageList.props('messages').length).toBe(2)
    })
  })

  describe('Socket 监听器测试', () => {
    it('挂载时应该设置 socket 监听器', () => {
      expect(socketService.onChatMessage).toHaveBeenCalled()
      expect(socketService.onSystemMessage).toHaveBeenCalled()
      expect(socketService.onUserJoined).toHaveBeenCalled()
      expect(socketService.onUserLeft).toHaveBeenCalled()
    })

    it('挂载时应该加入 socket 房间', () => {
      expect(socketService.joinRoom).toHaveBeenCalledWith('ABC123', 'session-123')
    })

    it('挂载时应该加载历史消息', () => {
      expect(chatStore.loadHistory).toHaveBeenCalledWith('ABC123')
    })

    it('卸载时应该清理 socket 监听器', () => {
      wrapper.unmount()
      expect(socketService.off).toHaveBeenCalledTimes(4)
    })
  })

  describe('消息发送测试', () => {
    it('应该发送聊天消息', async () => {
      const messageInput = wrapper.findComponent({ name: 'MessageInput' })
      
      await messageInput.vm.$emit('send', '测试消息', 'text')
      
      expect(socketService.emitChatMessage).toHaveBeenCalledWith(
        'ABC123',
        '测试消息',
        'text',
        'session-123',
        '测试用户'
      )
    })

    it('发送空消息不应该触发发送', async () => {
      const messageInput = wrapper.findComponent({ name: 'MessageInput' })
      
      await messageInput.vm.$emit('send', '', 'text')
      
      expect(socketService.emitChatMessage).not.toHaveBeenCalled()
    })

    it('发送只有空格的消息不应该触发发送', async () => {
      const messageInput = wrapper.findComponent({ name: 'MessageInput' })
      
      await messageInput.vm.$emit('send', '   ', 'text')
      
      expect(socketService.emitChatMessage).not.toHaveBeenCalled()
    })

    it('应该发送图片类型消息', async () => {
      const messageInput = wrapper.findComponent({ name: 'MessageInput' })
      
      await messageInput.vm.$emit('send', 'http://test.com/image.jpg', 'image')
      
      expect(socketService.emitChatMessage).toHaveBeenCalledWith(
        'ABC123',
        'http://test.com/image.jpg',
        'image',
        'session-123',
        '测试用户'
      )
    })
  })

  describe('Socket 事件处理测试', () => {
    it('应该处理聊天消息事件', () => {
      const testMessage = {
        content: '测试消息',
        type: 'text',
        senderId: 'session-456',
        senderNickname: '其他用户',
        timestamp: '2024-01-15T10:00:00Z'
      }
      
      socketService._onChatMessage(testMessage)
      
      expect(chatStore.addMessage).toHaveBeenCalledWith(testMessage)
    })

    it('应该处理系统消息事件', () => {
      // Reset mock call count
      chatStore.addSystemMessage.mockClear()
      
      expect(chatStore.addSystemMessage).not.toHaveBeenCalled()
      socketService._onSystemMessage({ content: '用户加入了房间' })
      
      expect(chatStore.addSystemMessage).toHaveBeenCalledWith('用户加入了房间')
    })

    it('应该处理用户加入事件', () => {
      const testUser = {
        sessionId: 'session-456',
        nickname: '新用户',
        avatar: '😀',
        isOnline: true
      }
      
      socketService._onUserJoined(testUser)
      
      expect(roomStore.addUser).toHaveBeenCalledWith(testUser)
    })

    it('应该处理用户离开事件', () => {
      const testUser = {
        sessionId: 'session-456',
        nickname: '离开用户',
        avatar: '😀',
        isOnline: false
      }
      roomStore.users = [testUser]
      
      socketService._onUserLeft(testUser)
      
      expect(roomStore.removeUser).toHaveBeenCalledWith('session-456')
    })
  })

  describe('邀请链接测试', () => {
    beforeEach(() => {
      vi.stubGlobal('alert', vi.fn())
      vi.stubGlobal('navigator', {
        clipboard: {
          writeText: vi.fn().mockResolvedValue()
        }
      })
    })

    afterEach(() => {
      vi.stubGlobal('alert', vi.fn())
      vi.stubGlobal('navigator', {
        clipboard: {
          writeText: vi.fn().mockResolvedValue()
        }
      })
    })

    it('点击复制按钮应该复制邀请链接', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:3000'
        },
        writable: true
      })
      
      const copyButton = wrapper.find('.btn-copy-link')
      await copyButton.trigger('click')
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'http://localhost:3000/join/ABC123'
      )
      expect(message.success).toHaveBeenCalledWith('邀请链接已复制')
    })

    it('复制失败时应该处理错误', async () => {
      const clipboardError = new Error('Clipboard error')
      vi.stubGlobal('navigator', {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(clipboardError)
        }
      })
      
      const copyButton = wrapper.find('.btn-copy-link')
      await copyButton.trigger('click')
      await flushPromises()
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'http://localhost:3000/join/ABC123'
      )
      expect(message.error).toHaveBeenCalledWith('复制失败，请手动复制链接')
    })
  })

  describe('监听器重复设置测试', () => {
    it('不应该重复设置监听器', () => {
      // 重置调用计数
      socketService.onChatMessage.mockClear()
      socketService.onSystemMessage.mockClear()
      socketService.onUserJoined.mockClear()
      socketService.onUserLeft.mockClear()
      
      // 再次调用 setupSocketListeners
      wrapper.vm.setupSocketListeners()
      
      // 监听器不应该被再次设置
      expect(socketService.onChatMessage).not.toHaveBeenCalled()
      expect(socketService.onSystemMessage).not.toHaveBeenCalled()
      expect(socketService.onUserJoined).not.toHaveBeenCalled()
      expect(socketService.onUserLeft).not.toHaveBeenCalled()
    })
  })
})
