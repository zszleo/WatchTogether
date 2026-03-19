import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MessageList from '@/components/chat/MessageList.vue'
import { useUserStore } from '@/stores/user'

describe('MessageList', () => {
  let wrapper
  let pinia
  let userStore

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    userStore = useUserStore()
    userStore.sessionId = 'session-123'
    
    wrapper = mount(MessageList, {
      global: {
        plugins: [pinia]
      },
      props: {
        messages: []
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
    it('应该渲染消息列表组件', () => {
      expect(wrapper.find('.message-list').exists()).toBe(true)
    })

    it('应该显示空消息提示', () => {
      expect(wrapper.find('.empty-messages').exists()).toBe(true)
      expect(wrapper.find('.empty-messages').text()).toContain('暂无消息，快来聊天吧')
    })

    it('有消息时不应该显示空消息提示', async () => {
      await wrapper.setProps({
        messages: [
          { id: 1, content: '你好', senderId: 'session-1', type: 'text' }
        ]
      })
      
      expect(wrapper.find('.empty-messages').exists()).toBe(false)
    })
  })

  describe('消息显示测试', () => {
    it('应该显示文本消息', async () => {
      await wrapper.setProps({
        messages: [
          { id: 1, content: '你好世界', senderId: 'session-1', senderNickname: '用户1', type: 'text', timestamp: '2024-01-01T10:00:00Z' }
        ]
      })
      
      const message = wrapper.find('.message')
      expect(message.exists()).toBe(true)
      expect(message.text()).toContain('你好世界')
      expect(message.text()).toContain('用户1')
    })

    it('应该显示图片消息', async () => {
      await wrapper.setProps({
        messages: [
          { id: 1, content: 'http://example.com/image.jpg', senderId: 'session-1', senderNickname: '用户1', type: 'image', timestamp: '2024-01-01T10:00:00Z' }
        ]
      })
      
      const image = wrapper.find('.message-image')
      expect(image.exists()).toBe(true)
      expect(image.attributes('src')).toBe('http://example.com/image.jpg')
    })

    it('应该显示系统消息', async () => {
      await wrapper.setProps({
        messages: [
          { id: 1, content: '用户加入了房间', senderId: 'system', type: 'system', timestamp: '2024-01-01T10:00:00Z' }
        ]
      })
      
      const systemMessage = wrapper.find('.system-message')
      expect(systemMessage.exists()).toBe(true)
      expect(systemMessage.text()).toContain('用户加入了房间')
    })

    it('应该显示多条消息', async () => {
      await wrapper.setProps({
        messages: [
          { id: 1, content: '消息1', senderId: 'session-1', senderNickname: '用户1', type: 'text', timestamp: '2024-01-01T10:00:00Z' },
          { id: 2, content: '消息2', senderId: 'session-2', senderNickname: '用户2', type: 'text', timestamp: '2024-01-01T10:01:00Z' }
        ]
      })
      
      const messages = wrapper.findAll('.message')
      expect(messages.length).toBe(2)
    })
  })

  describe('消息样式测试', () => {
    it('自己的消息应该有 message-self 类', async () => {
      await wrapper.setProps({
        messages: [
          { id: 1, content: '我的消息', senderId: 'session-123', senderNickname: '我', type: 'text', timestamp: '2024-01-01T10:00:00Z' }
        ]
      })
      
      const message = wrapper.find('.message')
      expect(message.classes()).toContain('message-self')
    })

    it('他人的消息不应该有 message-self 类', async () => {
      await wrapper.setProps({
        messages: [
          { id: 1, content: '他人消息', senderId: 'session-456', senderNickname: '他人', type: 'text', timestamp: '2024-01-01T10:00:00Z' }
        ]
      })
      
      const message = wrapper.find('.message')
      expect(message.classes()).not.toContain('message-self')
    })

    it('系统消息应该有 message-system 类', async () => {
      await wrapper.setProps({
        messages: [
          { id: 1, content: '系统消息', senderId: 'system', type: 'system', timestamp: '2024-01-01T10:00:00Z' }
        ]
      })
      
      const message = wrapper.find('.message')
      expect(message.classes()).toContain('message-system')
    })
  })

  describe('时间格式化测试', () => {
    it('应该格式化消息时间', async () => {
      await wrapper.setProps({
        messages: [
          { id: 1, content: '测试', senderId: 'session-1', senderNickname: '用户1', type: 'text', timestamp: '2024-01-01T10:30:00Z' }
        ]
      })
      
      const timeSpan = wrapper.find('.message-time')
      expect(timeSpan.exists()).toBe(true)
      // 时间格式应该是 HH:MM
      expect(timeSpan.text()).toMatch(/\d{2}:\d{2}/)
    })

    it('应该处理没有时间戳的消息', async () => {
      await wrapper.setProps({
        messages: [
          { id: 1, content: '测试', senderId: 'session-1', senderNickname: '用户1', type: 'text' }
        ]
      })
      
      const timeSpan = wrapper.find('.message-time')
      expect(timeSpan.text()).toBe('')
    })
  })
})
