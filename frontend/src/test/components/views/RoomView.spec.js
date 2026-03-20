import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import RoomView from '@/views/RoomView.vue'
import { useRoomStore } from '@/stores/room'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { socketService } from '@/services/socket'

vi.mock('@/services/api', () => ({
  RoomApi: {
    getChatMessages: vi.fn().mockResolvedValue({ messages: [] }),
    getInviteLink: vi.fn().mockResolvedValue({ link: 'http://test.com' })
  }
}))

vi.mock('@/services/socket', () => ({
  socketService: {
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    onChatMessage: vi.fn(),
    onSystemMessage: vi.fn(),
    onUserJoined: vi.fn(),
    onUserLeft: vi.fn(),
    onVideoSyncPlay: vi.fn(),
    onVideoSyncPause: vi.fn(),
    onVideoSyncSeek: vi.fn(),
    onVideoSyncUrlChange: vi.fn(),
    off: vi.fn(),
    emitChatMessage: vi.fn(),
    emitVideoUrlChange: vi.fn(),
    emitVideoPlay: vi.fn(),
    emitVideoPause: vi.fn(),
    emitVideoSeek: vi.fn()
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
    
    // Mock chatStore.loadHistory to avoid API calls
    vi.spyOn(chatStore, 'loadHistory').mockResolvedValue()
    
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

  describe('会话创建测试', () => {
    it('没有 sessionId 时应该自动创建会话', async () => {
      // 创建新的 pinia 和 store
      const newPinia = createPinia()
      setActivePinia(newPinia)
      const newUserStore = useUserStore()
      const newRoomStore = useRoomStore()
      const newChatStore = useChatStore()
      
      // 设置没有 sessionId
      newUserStore.sessionId = null
      newRoomStore.currentRoom = { id: 'room-456', name: '测试房间' }
      
      // Mock createSession
      vi.spyOn(newUserStore, 'createSession').mockResolvedValue()
      vi.spyOn(newRoomStore, 'joinRoom').mockResolvedValue()
      vi.spyOn(newChatStore, 'loadHistory').mockResolvedValue()
      
      // 创建新路由
      const newRouter = createRouter({
        history: createWebHistory(),
        routes: [
          { path: '/', component: { template: '<div>Home</div>' } },
          { path: '/room/:roomId', component: RoomView }
        ]
      })
      
      await newRouter.push('/room/room-456')
      await newRouter.isReady()
      
      const newWrapper = mount(RoomView, {
        global: {
          plugins: [newPinia, newRouter]
        }
      })
      await flushPromises()
      
      // 应该调用 createSession
      expect(newUserStore.createSession).toHaveBeenCalled()
      newWrapper.unmount()
    })
  })

  describe('changeVideoUrl 测试', () => {
    it('输入有效 URL 后点击加载应该发送视频变更', async () => {
      socketService.emitVideoUrlChange.mockClear()
      
      const urlInput = wrapper.find('.source-input input[type="text"]')
      await urlInput.setValue('https://example.com/video.mp4')
      
      const loadButton = wrapper.find('.source-input button')
      await loadButton.trigger('click')
      
      expect(socketService.emitVideoUrlChange).toHaveBeenCalledWith(
        'room-123',
        'https://example.com/video.mp4'
      )
      // 输入框应该被清空
      expect(wrapper.vm.videoUrlInput).toBe('')
    })

    it('输入空 URL 时不应该发送视频变更', async () => {
      socketService.emitVideoUrlChange.mockClear()
      
      const urlInput = wrapper.find('.source-input input[type="text"]')
      await urlInput.setValue('   ')
      
      const loadButton = wrapper.find('.source-input button')
      await loadButton.trigger('click')
      
      expect(socketService.emitVideoUrlChange).not.toHaveBeenCalled()
    })

    it('按回车键应该触发视频变更', async () => {
      socketService.emitVideoUrlChange.mockClear()
      
      const urlInput = wrapper.find('.source-input input[type="text"]')
      await urlInput.setValue('https://example.com/video.mp4')
      await urlInput.trigger('keyup.enter')
      
      expect(socketService.emitVideoUrlChange).toHaveBeenCalledWith(
        'room-123',
        'https://example.com/video.mp4'
      )
    })
  })

  describe('handleVideoUpload 测试', () => {
    it('选择文件后应该发送视频 URL 变更', async () => {
      socketService.emitVideoUrlChange.mockClear()
      
      // 切换到上传标签
      const uploadButton = wrapper.findAll('.source-tabs button')[1]
      await uploadButton.trigger('click')
      
      // Mock URL.createObjectURL
      const mockUrl = 'blob:http://localhost/test-video'
      global.URL.createObjectURL = vi.fn().mockReturnValue(mockUrl)
      
      // 创建 mock 文件
      const mockFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
      
      // 模拟文件选择事件
      const fileInput = wrapper.find('input[type="file"]')
      Object.defineProperty(fileInput.element, 'files', {
        value: [mockFile]
      })
      
      await fileInput.trigger('change')
      
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockFile)
      expect(socketService.emitVideoUrlChange).toHaveBeenCalledWith('room-123', mockUrl)
    })

    it('没有选择文件时不应该发送视频变更', async () => {
      socketService.emitVideoUrlChange.mockClear()
      
      // 切换到上传标签
      const uploadButton = wrapper.findAll('.source-tabs button')[1]
      await uploadButton.trigger('click')
      
      // 模拟没有选择文件
      const fileInput = wrapper.find('input[type="file"]')
      Object.defineProperty(fileInput.element, 'files', {
        value: []
      })
      
      await fileInput.trigger('change')
      
      expect(socketService.emitVideoUrlChange).not.toHaveBeenCalled()
    })
  })

  describe('生命周期测试', () => {
    it('组件卸载时应该离开房间并清空消息', () => {
      // 使用新的 wrapper 进行测试
      const testWrapper = mount(RoomView, {
        global: {
          plugins: [pinia, router]
        }
      })
      flushPromises()
      
      const leaveRoomSpy = vi.spyOn(roomStore, 'leaveRoom')
      const clearMessagesSpy = vi.spyOn(chatStore, 'clearMessages')
      
      testWrapper.unmount()
      
      expect(leaveRoomSpy).toHaveBeenCalled()
      expect(clearMessagesSpy).toHaveBeenCalled()
    })
  })
})
