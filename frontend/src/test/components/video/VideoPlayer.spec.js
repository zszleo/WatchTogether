import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import VideoPlayer from '@/components/video/VideoPlayer.vue'
import { useRoomStore } from '@/stores/room'
import { socketService } from '@/services/socket'

describe('VideoPlayer', () => {
  let wrapper
  let pinia
  let roomStore

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    roomStore = useRoomStore()
    
    // 设置当前房间
    roomStore.currentRoom = { id: 'test-room-123', name: '测试房间' }
    roomStore.videoState = {
      url: '',
      currentTime: 0,
      isPlaying: false,
      duration: 0
    }
    vi.spyOn(roomStore, 'updateVideoState').mockImplementation((state) => {
      Object.assign(roomStore.videoState, state)
    })
    
    // Mock socket service
    vi.spyOn(socketService, 'onVideoSyncPlay').mockImplementation((callback) => {
      socketService._onVideoSyncPlay = callback
    })
    vi.spyOn(socketService, 'onVideoSyncPause').mockImplementation((callback) => {
      socketService._onVideoSyncPause = callback
    })
    vi.spyOn(socketService, 'onVideoSyncSeek').mockImplementation((callback) => {
      socketService._onVideoSyncSeek = callback
    })
    vi.spyOn(socketService, 'onVideoSyncUrlChange').mockImplementation((callback) => {
      socketService._onVideoSyncUrlChange = callback
    })
    vi.spyOn(socketService, 'emitVideoPlay').mockImplementation(() => {})
    vi.spyOn(socketService, 'emitVideoPause').mockImplementation(() => {})
    vi.spyOn(socketService, 'emitVideoSeek').mockImplementation(() => {})
    vi.spyOn(socketService, 'emitVideoUrlChange').mockImplementation(() => {})
    
    // Mock HTMLMediaElement methods
    global.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue()
    global.HTMLMediaElement.prototype.pause = vi.fn()
    global.HTMLMediaElement.prototype.load = vi.fn()
    
    // Mock fullscreen API
    global.Element.prototype.requestFullscreen = vi.fn().mockResolvedValue()
    global.document.exitFullscreen = vi.fn().mockResolvedValue()
    
    wrapper = mount(VideoPlayer, {
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
  })

  describe('渲染测试', () => {
    it('应该渲染视频播放器组件', () => {
      expect(wrapper.find('.video-player-wrapper').exists()).toBe(true)
      expect(wrapper.find('.video-container').exists()).toBe(true)
      expect(wrapper.find('.video-element').exists()).toBe(true)
    })

    it('应该显示等待视频提示当没有视频 URL', () => {
      expect(wrapper.find('.video-overlay').exists()).toBe(true)
      expect(wrapper.find('.no-video').exists()).toBe(true)
      expect(wrapper.text()).toContain('等待视频...')
    })

    it('应该渲染 VideoControls 组件', () => {
      expect(wrapper.findComponent({ name: 'VideoControls' }).exists()).toBe(true)
    })
  })

  describe('视频状态测试', () => {
    it('VideoControls 应该接收正确的初始 props', () => {
      const controls = wrapper.findComponent({ name: 'VideoControls' })
      expect(controls.props('currentTime')).toBe(0)
      expect(controls.props('duration')).toBe(0)
      expect(controls.props('isPlaying')).toBe(false)
      expect(controls.props('volume')).toBe(1)
    })
  })

  describe('方法暴露测试', () => {
    it('应该暴露 play 方法', () => {
      expect(wrapper.vm.play).toBeDefined()
      expect(typeof wrapper.vm.play).toBe('function')
    })

    it('应该暴露 pause 方法', () => {
      expect(wrapper.vm.pause).toBeDefined()
      expect(typeof wrapper.vm.pause).toBe('function')
    })

    it('应该暴露 seek 方法', () => {
      expect(wrapper.vm.seek).toBeDefined()
      expect(typeof wrapper.vm.seek).toBe('function')
    })

    it('应该暴露 setVideoUrl 方法', () => {
      expect(wrapper.vm.setVideoUrl).toBeDefined()
      expect(typeof wrapper.vm.setVideoUrl).toBe('function')
    })
  })

  describe('事件处理测试', () => {
    it('应该处理视频播放事件', async () => {
      const video = wrapper.find('.video-element')
      await video.trigger('play')

      expect(roomStore.videoState.isPlaying).toBe(true)
    })

    it('应该处理视频暂停事件', async () => {
      const video = wrapper.find('.video-element')
      await video.trigger('pause')

      expect(roomStore.videoState.isPlaying).toBe(false)
    })

    it('应该处理视频结束事件', async () => {
      const video = wrapper.find('.video-element')
      await video.trigger('ended')

      expect(roomStore.videoState.isPlaying).toBe(false)
    })
  })

  describe('Socket 同步测试', () => {
    it('应该处理视频同步播放事件', async () => {
      const video = wrapper.find('.video-element')
      const playSpy = vi.spyOn(video.element, 'play')
      
      // 触发同步播放事件
      socketService._onVideoSyncPlay({ time: 30 })
      
      expect(playSpy).toHaveBeenCalled()
      expect(video.element.currentTime).toBe(30)
    })

    it('应该处理视频同步暂停事件', async () => {
      const video = wrapper.find('.video-element')
      const pauseSpy = vi.spyOn(video.element, 'pause')
      
      socketService._onVideoSyncPause()
      
      expect(pauseSpy).toHaveBeenCalled()
    })

    it('应该处理视频同步跳转事件', async () => {
      const video = wrapper.find('.video-element')
      
      socketService._onVideoSyncSeek({ time: 45 })
      
      expect(video.element.currentTime).toBe(45)
    })

    it('应该处理视频 URL 变更事件', async () => {
      roomStore.updateVideoState = vi.fn()
      const video = wrapper.find('.video-element')
      const loadSpy = vi.spyOn(video.element, 'load')
      
      socketService._onVideoSyncUrlChange({ url: 'http://test.com/video.mp4' })
      
      expect(roomStore.updateVideoState).toHaveBeenCalledWith({ 
        url: 'http://test.com/video.mp4', 
        currentTime: 0, 
        isPlaying: false 
      })
      expect(loadSpy).toHaveBeenCalled()
    })
  })

  describe('视频控制方法测试', () => {
    it('play 方法应该播放视频', () => {
      const video = wrapper.find('.video-element')
      const playSpy = vi.spyOn(video.element, 'play')
      
      wrapper.vm.play()
      
      expect(playSpy).toHaveBeenCalled()
    })

    it('pause 方法应该暂停视频', () => {
      const video = wrapper.find('.video-element')
      const pauseSpy = vi.spyOn(video.element, 'pause')
      
      wrapper.vm.pause()
      
      expect(pauseSpy).toHaveBeenCalled()
    })

    it('seek 方法应该跳转到指定时间', () => {
      const video = wrapper.find('.video-element')
      
      wrapper.vm.seek(60)
      
      expect(video.element.currentTime).toBe(60)
      expect(socketService.emitVideoSeek).toHaveBeenCalledWith('test-room-123', 60)
    })

    it('seek 方法应该播放视频如果当前未播放', () => {
      const video = wrapper.find('.video-element')
      const playSpy = vi.spyOn(video.element, 'play')
      wrapper.vm.isPlaying = false
      
      wrapper.vm.seek(60)
      
      expect(playSpy).toHaveBeenCalled()
    })

    it('setVolume 方法应该设置音量', () => {
      const video = wrapper.find('.video-element')
      
      wrapper.vm.setVolume(0.5)
      
      expect(video.element.volume).toBe(0.5)
      expect(wrapper.vm.volume).toBe(0.5)
    })

    it('setVideoUrl 方法应该更新视频URL', () => {
      wrapper.vm.setVideoUrl('http://test.com/video.mp4')
      
      expect(roomStore.updateVideoState).toHaveBeenCalledWith({ 
        url: 'http://test.com/video.mp4', 
        currentTime: 0, 
        isPlaying: false 
      })
    })
  })

  describe('视频元数据测试', () => {
    it('应该处理视频元数据加载事件', async () => {
      const video = wrapper.find('.video-element')
      Object.defineProperty(video.element, 'duration', {
        value: 120,
        writable: true
      })
      roomStore.updateVideoState = vi.fn()
      
      await video.trigger('loadedmetadata')
      
      expect(roomStore.updateVideoState).toHaveBeenCalledWith({ duration: 120 })
    })

    it('应该处理视频时间更新事件', async () => {
      const video = wrapper.find('.video-element')
      video.element.currentTime = 30
      roomStore.updateVideoState = vi.fn()
      
      await video.trigger('timeupdate')
      
      expect(roomStore.updateVideoState).toHaveBeenCalledWith({ currentTime: 30 })
    })
  })

  describe('视频 URL 计算属性测试', () => {
    it('应该返回 roomStore 中的 videoState.url', () => {
      roomStore.videoState.url = 'http://test.com/video.mp4'
      
      expect(wrapper.vm.videoUrl).toBe('http://test.com/video.mp4')
    })
  })

  describe('isSyncing 逻辑测试', () => {
    it('同步播放时应该设置 isSyncing', async () => {
      const video = wrapper.find('.video-element')
      const playSpy = vi.spyOn(video.element, 'play')
      
      socketService._onVideoSyncPlay({ time: 30 })
      
      expect(wrapper.vm.isSyncing).toBe(true)
      // 等待100ms后isSyncing应该为false
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(wrapper.vm.isSyncing).toBe(false)
    })

    it('本地播放时不应该触发 socket 事件当 isSyncing 为 true', async () => {
      wrapper.vm.isSyncing = true
      const video = wrapper.find('.video-element')
      
      await video.trigger('play')
      
      expect(socketService.emitVideoPlay).not.toHaveBeenCalled()
    })

    it('本地暂停时不应该触发 socket 事件当 isSyncing 为 true', async () => {
      wrapper.vm.isSyncing = true
      const video = wrapper.find('.video-element')
      
      await video.trigger('pause')
      
      expect(socketService.emitVideoPause).not.toHaveBeenCalled()
    })
  })

  describe('全屏控制测试', () => {
    it('toggleFullscreen 方法应该进入全屏', () => {
      const videoContainer = wrapper.find('.video-container')
      const requestFullscreenSpy = vi.spyOn(videoContainer.element, 'requestFullscreen')
      
      wrapper.vm.toggleFullscreen()
      
      expect(requestFullscreenSpy).toHaveBeenCalled()
    })

    it('toggleFullscreen 方法应该退出全屏', () => {
      // Mock 全屏状态
      Object.defineProperty(document, 'fullscreenElement', {
        value: wrapper.find('.video-container').element,
        writable: true
      })
      const exitFullscreenSpy = vi.spyOn(document, 'exitFullscreen')
      
      wrapper.vm.toggleFullscreen()
      
      expect(exitFullscreenSpy).toHaveBeenCalled()
    })
  })
})
