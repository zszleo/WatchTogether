import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import RoomView from '@/views/RoomView.vue'
import { useRoomStore } from '@/stores/room'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'

vi.mock('@/services/api', () => ({
  RoomApi: {
    getChatMessages: vi.fn().mockResolvedValue({ messages: [] }),
    getInviteLink: vi.fn().mockResolvedValue({ link: 'http://test.com' })
  }
}))

// 创建测试路由
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/room/:roomId', component: RoomView }
  ]
})

describe('RoomView', () => {
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
    
    // Mock window.alert
    window.alert = vi.fn()
    
    // 设置初始状态
    userStore.sessionId = 'session-123'
    userStore.nickname = '测试用户'
    roomStore.currentRoom = { id: 'room-123', name: '测试房间' }
    chatStore.messages = []
    
    await router.push('/room/room-123')
    await router.isReady()
    
    wrapper = mount(RoomView, {
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
    it('应该渲染房间页面', () => {
      expect(wrapper.find('.page-room').exists()).toBe(true)
    })

    it('应该有视频区域', () => {
      expect(wrapper.find('.video-section').exists()).toBe(true)
    })

    it('应该有聊天区域', () => {
      expect(wrapper.find('.chat-section').exists()).toBe(true)
    })

    it('应该渲染 VideoPlayer 组件', () => {
      expect(wrapper.findComponent({ name: 'VideoPlayer' }).exists()).toBe(true)
    })

    it('应该渲染 ChatPanel 组件', () => {
      expect(wrapper.findComponent({ name: 'ChatPanel' }).exists()).toBe(true)
    })
  })

  describe('视频源切换测试', () => {
    it('应该有视频源切换标签', () => {
      expect(wrapper.find('.source-tabs').exists()).toBe(true)
    })

    it('应该有 URL 输入标签', () => {
      const buttons = wrapper.findAll('.source-tabs button')
      expect(buttons[0].text()).toBe('URL')
      expect(buttons[0].classes()).toContain('active')
    })

    it('应该有上传标签', () => {
      const buttons = wrapper.findAll('.source-tabs button')
      expect(buttons[1].text()).toBe('上传')
    })

    it('应该有示例标签', () => {
      const buttons = wrapper.findAll('.source-tabs button')
      expect(buttons[2].text()).toBe('示例')
    })

    it('点击上传标签应该切换激活状态', async () => {
      const uploadButton = wrapper.findAll('.source-tabs button')[1]
      await uploadButton.trigger('click')
      
      expect(uploadButton.classes()).toContain('active')
      expect(wrapper.findAll('.source-tabs button')[0].classes()).not.toContain('active')
    })

    it('点击示例标签应该切换激活状态', async () => {
      const samplesButton = wrapper.findAll('.source-tabs button')[2]
      await samplesButton.trigger('click')
      
      expect(samplesButton.classes()).toContain('active')
    })
  })

  describe('URL 输入测试', () => {
    it('应该显示 URL 输入框', () => {
      expect(wrapper.find('.source-input input').exists()).toBe(true)
      expect(wrapper.find('.source-input input').attributes('placeholder')).toBe('输入视频URL...')
    })

    it('应该有加载按钮', () => {
      expect(wrapper.find('.source-input button').exists()).toBe(true)
      expect(wrapper.find('.source-input button').text()).toBe('加载')
    })

    it('切换到上传标签时应该隐藏 URL 输入框', async () => {
      const uploadButton = wrapper.findAll('.source-tabs button')[1]
      await uploadButton.trigger('click')
      await flushPromises()
      
      // URL输入框应该有v-if隐藏，v-show不会改变exists()
      const urlInputWrapper = wrapper.findAll('.source-input').find(
        el => el.isVisible() === false || !el.find('input[type="text"]').exists()
      )
      expect(urlInputWrapper).toBeTruthy()
    })
  })

  describe('文件上传测试', () => {
    it('切换到上传标签时应该显示文件输入', async () => {
      const uploadButton = wrapper.findAll('.source-tabs button')[1]
      await uploadButton.trigger('click')
      
      expect(wrapper.find('input[type="file"]').exists()).toBe(true)
    })

    it('文件输入应该只接受视频格式', async () => {
      const uploadButton = wrapper.findAll('.source-tabs button')[1]
      await uploadButton.trigger('click')
      
      const fileInput = wrapper.find('input[type="file"]')
      expect(fileInput.attributes('accept')).toBe('video/mp4,video/webm,video/ogg')
    })
  })

  describe('组件集成测试', () => {
    it('VideoPlayer 应该有 ref', () => {
      expect(wrapper.vm.videoPlayer).toBeDefined()
    })

    it('应该有 videoSource 状态', () => {
      expect(wrapper.vm.videoSource).toBe('url')
    })

    it('应该有 videoUrlInput 状态', () => {
      expect(wrapper.vm.videoUrlInput).toBe('')
    })
  })

  describe('方法测试', () => {
    it('应该有 changeVideoUrl 方法', () => {
      expect(wrapper.vm.changeVideoUrl).toBeDefined()
      expect(typeof wrapper.vm.changeVideoUrl).toBe('function')
    })

    it('应该有 handleVideoUpload 方法', () => {
      expect(wrapper.vm.handleVideoUpload).toBeDefined()
      expect(typeof wrapper.vm.handleVideoUpload).toBe('function')
    })
  })

  describe('响应式布局测试', () => {
    it('应该有响应式样式', () => {
      // 检查是否有媒体查询相关的类
      expect(wrapper.find('.room-layout').exists()).toBe(true)
    })
  })
})
