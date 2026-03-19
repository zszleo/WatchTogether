import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ChatPanel from '@/components/chat/ChatPanel.vue'
import { useRoomStore } from '@/stores/room'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'

vi.mock('@/services/api', () => ({
  RoomApi: {
    getChatMessages: vi.fn().mockResolvedValue({ messages: [] }),
    getInviteLink: vi.fn().mockResolvedValue({ link: 'http://test.com' })
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
    roomStore.currentRoom = { id: 'test-room-123', name: '测试房间' }
    userStore.sessionId = 'session-123'
    userStore.nickname = '测试用户'
    
    // 预加载历史消息为空
    chatStore.messages = []
    
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
  })

  describe('渲染测试', () => {
    it('应该渲染聊天面板', () => {
      expect(wrapper.find('.chat-panel').exists()).toBe(true)
    })

    it('应该显示房间名称', () => {
      expect(wrapper.find('.room-name').text()).toContain('测试房间')
    })

    it('应该显示房间ID', () => {
      expect(wrapper.find('.room-id').text()).toContain('test-room-123')
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
})
