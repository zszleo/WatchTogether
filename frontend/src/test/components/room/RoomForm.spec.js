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
import RoomForm from '@/components/room/RoomForm.vue'
import { useUserStore } from '@/stores/user'
import { useRoomStore } from '@/stores/room'
import { message } from '@/utils/message'

// 创建测试路由
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/room/:id', component: { template: '<div>Room</div>' } }
  ]
})

describe('RoomForm', () => {
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
    
    wrapper = mount(RoomForm, {
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
    it('应该渲染房间表单', () => {
      expect(wrapper.find('.room-form').exists()).toBe(true)
    })

    it('应该有昵称输入框', () => {
      expect(wrapper.find('input[placeholder="输入昵称"]').exists()).toBe(true)
    })

    it('应该有房间名称输入框', () => {
      expect(wrapper.find('input[placeholder="默认：房间 + 编号"]').exists()).toBe(true)
    })

    it('应该有最大人数滑块', () => {
      expect(wrapper.find('.range-slider').exists()).toBe(true)
    })

    it('应该有公开房间开关', () => {
      expect(wrapper.find('.toggle-input').exists()).toBe(true)
    })

    it('应该有提交按钮', () => {
      expect(wrapper.find('button[type="submit"]').exists()).true
      expect(wrapper.find('button[type="submit"]').text()).toContain('创建房间')
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

    it('房间名称最大长度应该是50', () => {
      const roomNameInput = wrapper.find('input[placeholder="默认：房间 + 编号"]')
      expect(roomNameInput.attributes('maxlength')).toBe('50')
    })

    it('最大人数范围应该是2-10', () => {
      const slider = wrapper.find('.range-slider')
      expect(slider.attributes('min')).toBe('2')
      expect(slider.attributes('max')).toBe('10')
    })

    it('默认最大人数应该是5', () => {
      const slider = wrapper.find('.range-slider')
      expect(slider.element.value).toBe('5')
    })

    it('公开房间默认应该是开启', () => {
      const toggle = wrapper.find('.toggle-input')
      expect(toggle.element.checked).toBe(true)
    })
  })

  describe('表单交互测试', () => {
    it('应该能输入昵称', async () => {
      const input = wrapper.find('input[placeholder="输入昵称"]')
      await input.setValue('测试用户')
      
      expect(input.element.value).toBe('测试用户')
    })

    it('应该能输入房间名称', async () => {
      const input = wrapper.find('input[placeholder="默认：房间 + 编号"]')
      await input.setValue('我的房间')
      
      expect(input.element.value).toBe('我的房间')
    })

    it('应该能调整最大人数', async () => {
      const slider = wrapper.find('.range-slider')
      await slider.setValue(8)
      
      expect(wrapper.text()).toContain('8人')
    })

    it('应该能切换公开房间开关', async () => {
      const toggle = wrapper.find('.toggle-input')
      await toggle.setChecked(false)
      
      expect(toggle.element.checked).toBe(false)
    })
  })

  describe('表单验证测试', () => {
    it('应该显示范围标签', () => {
      expect(wrapper.text()).toContain('2人')
      expect(wrapper.text()).toContain('10人')
    })

    it('应该显示公开房间提示', () => {
      expect(wrapper.text()).toContain('公开房间会显示在首页列表中')
    })
  })

  describe('表单提交测试', () => {
    it('提交表单应该调用 userStore.createSession', async () => {
      const createSessionSpy = vi.spyOn(userStore, 'createSession').mockResolvedValue()
      const createRoomSpy = vi.spyOn(roomStore, 'createRoom').mockResolvedValue({ id: 'room-123' })
      
      const nicknameInput = wrapper.find('input[placeholder="输入昵称"]')
      await nicknameInput.setValue('测试用户')
      
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      
      expect(createSessionSpy).toHaveBeenCalled()
    })

    it('提交表单应该调用 roomStore.createRoom', async () => {
      userStore.sessionId = 'session-123'
      
      const createRoomSpy = vi.spyOn(roomStore, 'createRoom').mockResolvedValue({ id: 'room-123' })
      
      const nicknameInput = wrapper.find('input[placeholder="输入昵称"]')
      await nicknameInput.setValue('测试用户')
      
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      
      expect(createRoomSpy).toHaveBeenCalled()
    })

    it('提交时应该显示加载状态', async () => {
      vi.spyOn(roomStore, 'createRoom').mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      const nicknameInput = wrapper.find('input[placeholder="输入昵称"]')
      await nicknameInput.setValue('测试用户')
      
      await wrapper.find('form').trigger('submit')
      
      expect(wrapper.find('button[type="submit"]').text()).toContain('创建中...')
      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    })

    it('创建成功后应该触发 success 事件', async () => {
      userStore.sessionId = 'session-123'
      
      const mockRoom = { id: 'room-123', name: '测试房间' }
      vi.spyOn(roomStore, 'createRoom').mockResolvedValue(mockRoom)
      
      const nicknameInput = wrapper.find('input[placeholder="输入昵称"]')
      await nicknameInput.setValue('测试用户')
      
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      
      expect(wrapper.emitted('success')).toBeTruthy()
      expect(wrapper.emitted('success')[0][0]).toEqual(mockRoom)
    })

    it('创建失败应该显示错误提示', async () => {
      userStore.sessionId = 'session-123'
      
      vi.spyOn(roomStore, 'createRoom').mockRejectedValue(new Error('创建失败'))
      
      const nicknameInput = wrapper.find('input[placeholder="输入昵称"]')
      await nicknameInput.setValue('测试用户')
      
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      
      expect(message.error).toHaveBeenCalledWith('创建失败')
    })
  })
})
