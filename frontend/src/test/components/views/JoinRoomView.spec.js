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
import { createRouter, createWebHistory } from 'vue-router'
import JoinRoomView from '@/views/JoinRoomView.vue'
import { useUserStore } from '@/stores/user'
import { useRoomStore } from '@/stores/room'
import { message } from '@/utils/message'

// 创建测试路由
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/join', component: JoinRoomView },
    { path: '/join/:roomCode', component: JoinRoomView },
    { path: '/room/:roomCode', component: { template: '<div>Room</div>' } }
  ]
})

describe('JoinRoomView', () => {
  let wrapper
  let pinia
  let userStore
  let roomStore

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    userStore = useUserStore()
    roomStore = useRoomStore()
    
    // Mock window.alert
    window.alert = vi.fn()
    
    await router.push('/join')
    await router.isReady()
    
    wrapper = mount(JoinRoomView, {
      global: {
        plugins: [pinia, router]
      }
    })
    await flushPromises()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.restoreAllMocks()
  })

  describe('渲染测试', () => {
    it('应该渲染加入房间页面', () => {
      expect(wrapper.find('.page-join').exists()).toBe(true)
    })

    it('应该有页面标题', () => {
      expect(wrapper.find('.page-title').exists()).toBe(true)
      expect(wrapper.find('.page-title').text()).toBe('加入房间')
    })

    it('应该有返回链接', () => {
      const backLink = wrapper.find('.back-link')
      expect(backLink.exists()).toBe(true)
      expect(backLink.text()).toContain('← 返回')
      expect(backLink.attributes('href')).toBe('/')
    })

    it('应该有昵称输入框', () => {
      expect(wrapper.find('input[placeholder="输入昵称"]').exists()).toBe(true)
    })

    it('应该有房间号输入框', () => {
      expect(wrapper.find('input[placeholder="输入6位房间号"]').exists()).toBe(true)
    })

    it('应该有加入按钮', () => {
      const joinButton = wrapper.find('button[type="submit"]')
      expect(joinButton.exists()).toBe(true)
      expect(joinButton.text()).toContain('加入房间')
    })

    it('应该有分隔线', () => {
      expect(wrapper.find('.divider').exists()).toBe(true)
      expect(wrapper.find('.divider').text()).toContain('或')
    })
  })

  describe('表单字段测试', () => {
    it('昵称应该是必填项', () => {
      const nicknameInput = wrapper.find('input[placeholder="输入昵称"]')
      expect(nicknameInput.attributes('required')).toBeDefined()
    })

    it('昵称最大长度应该是20', () => {
      const nicknameInput = wrapper.find('input[placeholder="输入昵称"]')
      expect(nicknameInput.attributes('maxlength')).toBe('20')
    })

    it('房间号应该是必填项', () => {
      const roomIdInput = wrapper.find('input[placeholder="输入6位房间号"]')
      expect(roomIdInput.attributes('required')).toBeDefined()
    })

    it('房间号最大长度应该是6', () => {
      const roomIdInput = wrapper.find('input[placeholder="输入6位房间号"]')
      expect(roomIdInput.attributes('maxlength')).toBe('6')
    })

    it('房间号应该有大写样式', () => {
      const roomIdInput = wrapper.find('input[placeholder="输入6位房间号"]')
      expect(roomIdInput.classes()).toContain('input-large')
    })
  })

  describe('URL 参数测试', () => {
    it('应该从 URL 参数获取房间号', async () => {
      await router.push('/join/ABC123')
      await router.isReady()
      
      wrapper = mount(JoinRoomView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      const roomIdInput = wrapper.find('input[placeholder="输入6位房间号"]')
      expect(roomIdInput.element.value).toBe('ABC123')
    })
  })

  describe('邀请链接测试', () => {
    it('没有房间号时不显示邀请链接区域', () => {
      expect(wrapper.find('.invite-section').exists()).toBe(false)
    })

    it('有房间号时显示邀请链接区域', async () => {
      const roomIdInput = wrapper.find('input[placeholder="输入6位房间号"]')
      await roomIdInput.setValue('ABC123')
      
      await flushPromises()
      
      expect(wrapper.find('.invite-section').exists()).toBe(true)
    })

    it('应该显示邀请链接', async () => {
      const roomIdInput = wrapper.find('input[placeholder="输入6位房间号"]')
      await roomIdInput.setValue('ABC123')
      
      await flushPromises()
      
      const inviteInput = wrapper.find('.invite-link-box input')
      expect(inviteInput.exists()).toBe(true)
      expect(inviteInput.element.value).toContain('/join/ABC123')
    })

    it('应该有复制按钮', async () => {
      const roomIdInput = wrapper.find('input[placeholder="输入6位房间号"]')
      await roomIdInput.setValue('ABC123')
      
      await flushPromises()
      
      const copyButton = wrapper.find('.btn-copy')
      expect(copyButton.exists()).toBe(true)
      expect(copyButton.text()).toBe('复制')
    })
  })

  describe('表单提交测试', () => {
    it('提交表单应该调用 userStore.createSession', async () => {
      const createSessionSpy = vi.spyOn(userStore, 'createSession').mockResolvedValue()
      const joinRoomSpy = vi.spyOn(roomStore, 'joinRoom').mockResolvedValue()
      
      const nicknameInput = wrapper.find('input[placeholder="输入昵称"]')
      const roomIdInput = wrapper.find('input[placeholder="输入6位房间号"]')
      
      await nicknameInput.setValue('测试用户')
      await roomIdInput.setValue('ABC123')
      
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      
      expect(createSessionSpy).toHaveBeenCalled()
    })

    it('提交表单应该调用 roomStore.joinRoom', async () => {
      userStore.sessionId = 'session-123'
      
      const joinRoomSpy = vi.spyOn(roomStore, 'joinRoom').mockResolvedValue()
      
      const nicknameInput = wrapper.find('input[placeholder="输入昵称"]')
      const roomIdInput = wrapper.find('input[placeholder="输入6位房间号"]')
      
      await nicknameInput.setValue('测试用户')
      await roomIdInput.setValue('ABC123')
      
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      
      expect(joinRoomSpy).toHaveBeenCalledWith('ABC123', 'session-123')
    })

    it('提交时应该显示加载状态', async () => {
      vi.spyOn(roomStore, 'joinRoom').mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      const nicknameInput = wrapper.find('input[placeholder="输入昵称"]')
      const roomIdInput = wrapper.find('input[placeholder="输入6位房间号"]')
      
      await nicknameInput.setValue('测试用户')
      await roomIdInput.setValue('ABC123')
      
      await wrapper.find('form').trigger('submit')
      
      expect(wrapper.find('button[type="submit"]').text()).toContain('加入中...')
      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    })

    it('加入成功后应该跳转到房间页面', async () => {
      userStore.sessionId = 'session-123'
      
      vi.spyOn(roomStore, 'joinRoom').mockResolvedValue()
      
      const nicknameInput = wrapper.find('input[placeholder="输入昵称"]')
      const roomIdInput = wrapper.find('input[placeholder="输入6位房间号"]')
      
      await nicknameInput.setValue('测试用户')
      await roomIdInput.setValue('ABC123')
      
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      
      expect(router.currentRoute.value.path).toBe('/room/ABC123')
    })

    it('加入失败应该显示错误提示', async () => {
      userStore.sessionId = 'session-123'
      
      vi.spyOn(roomStore, 'joinRoom').mockRejectedValue(new Error('加入失败'))
      
      const nicknameInput = wrapper.find('input[placeholder="输入昵称"]')
      const roomIdInput = wrapper.find('input[placeholder="输入6位房间号"]')
      
      await nicknameInput.setValue('测试用户')
      await roomIdInput.setValue('ABC123')
      
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      
      expect(message.error).toHaveBeenCalledWith('加入失败')
    })
  })
})
