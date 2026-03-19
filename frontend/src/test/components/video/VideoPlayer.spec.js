import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import VideoPlayer from '@/components/video/VideoPlayer.vue'
import { useRoomStore } from '@/stores/room'

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
})
