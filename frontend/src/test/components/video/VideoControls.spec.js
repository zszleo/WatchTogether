import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import VideoControls from '@/components/video/VideoControls.vue'

describe('VideoControls', () => {
  const defaultProps = {
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    volume: 1
  }

  it('应该渲染视频控制组件', () => {
    const wrapper = mount(VideoControls, {
      props: defaultProps
    })

    expect(wrapper.find('.video-controls').exists()).toBe(true)
    expect(wrapper.find('.progress-bar').exists()).toBe(true)
    expect(wrapper.find('.controls-row').exists()).toBe(true)
  })

  it('应该显示播放按钮当 isPlaying 为 false', () => {
    const wrapper = mount(VideoControls, {
      props: { ...defaultProps, isPlaying: false }
    })

    const playButton = wrapper.find('.control-btn')
    expect(playButton.text()).toContain('▶')
  })

  it('应该显示暂停按钮当 isPlaying 为 true', () => {
    const wrapper = mount(VideoControls, {
      props: { ...defaultProps, isPlaying: true }
    })

    const playButton = wrapper.find('.control-btn')
    expect(playButton.text()).toContain('⏸')
  })

  it('点击播放按钮应该触发 play 事件', async () => {
    const wrapper = mount(VideoControls, {
      props: { ...defaultProps, isPlaying: false }
    })

    await wrapper.find('.control-btn').trigger('click')

    expect(wrapper.emitted('play')).toBeTruthy()
  })

  it('点击暂停按钮应该触发 pause 事件', async () => {
    const wrapper = mount(VideoControls, {
      props: { ...defaultProps, isPlaying: true }
    })

    await wrapper.find('.control-btn').trigger('click')

    expect(wrapper.emitted('pause')).toBeTruthy()
  })

  it('应该格式化时间显示', () => {
    const wrapper = mount(VideoControls, {
      props: { ...defaultProps, currentTime: 65, duration: 120 }
    })

    expect(wrapper.find('.time-display').text()).toContain('01:05')
    expect(wrapper.find('.time-display').text()).toContain('02:00')
  })

  it('应该处理零时间', () => {
    const wrapper = mount(VideoControls, {
      props: { ...defaultProps, currentTime: 0, duration: 0 }
    })

    expect(wrapper.find('.time-display').text()).toContain('00:00')
  })

  it('应该计算进度百分比', () => {
    const wrapper = mount(VideoControls, {
      props: { ...defaultProps, currentTime: 50, duration: 100 }
    })

    const progressFill = wrapper.find('.progress-fill')
    expect(progressFill.attributes('style')).toContain('width: 50%')
  })

  it('应该处理零 duration 的进度', () => {
    const wrapper = mount(VideoControls, {
      props: { ...defaultProps, currentTime: 0, duration: 0 }
    })

    const progressFill = wrapper.find('.progress-fill')
    expect(progressFill.attributes('style')).toContain('width: 0%')
  })

  it('点击进度条应该触发 seek 事件', async () => {
    const wrapper = mount(VideoControls, {
      props: { ...defaultProps, currentTime: 0, duration: 100 }
    })

    // Mock getBoundingClientRect
    const progressBar = wrapper.find('.progress-bar')
    progressBar.element.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      width: 100
    }))

    await progressBar.trigger('click', { clientX: 50 })

    expect(wrapper.emitted('seek')).toBeTruthy()
    expect(wrapper.emitted('seek')[0][0]).toBe(50)
  })

  it('应该显示音量控制', () => {
    const wrapper = mount(VideoControls, {
      props: defaultProps
    })

    expect(wrapper.find('.volume-control').exists()).toBe(true)
    expect(wrapper.find('.volume-slider').exists()).toBe(true)
  })

  it('应该显示高音量图标', () => {
    const wrapper = mount(VideoControls, {
      props: { ...defaultProps, volume: 0.8 }
    })

    const volumeButton = wrapper.findAll('.control-btn')[1]
    expect(volumeButton.text()).toContain('🔊')
  })

  it('应该显示低音量图标', () => {
    const wrapper = mount(VideoControls, {
      props: { ...defaultProps, volume: 0.3 }
    })

    const volumeButton = wrapper.findAll('.control-btn')[1]
    expect(volumeButton.text()).toContain('🔉')
  })

  it('应该显示静音图标', () => {
    const wrapper = mount(VideoControls, {
      props: { ...defaultProps, volume: 0 }
    })

    const volumeButton = wrapper.findAll('.control-btn')[1]
    expect(volumeButton.text()).toContain('🔇')
  })

  it('点击静音按钮应该触发 volume-change 事件', async () => {
    const wrapper = mount(VideoControls, {
      props: { ...defaultProps, volume: 0.5 }
    })

    const volumeButton = wrapper.findAll('.control-btn')[1]
    await volumeButton.trigger('click')

    expect(wrapper.emitted('volume-change')).toBeTruthy()
    expect(wrapper.emitted('volume-change')[0][0]).toBe(0)
  })

  it('点击取消静音按钮应该触发 volume-change 事件', async () => {
    const wrapper = mount(VideoControls, {
      props: { ...defaultProps, volume: 0 }
    })

    const volumeButton = wrapper.findAll('.control-btn')[1]
    await volumeButton.trigger('click')

    expect(wrapper.emitted('volume-change')).toBeTruthy()
    expect(wrapper.emitted('volume-change')[0][0]).toBe(1)
  })

  it('改变音量滑块应该触发 volume-change 事件', async () => {
    const wrapper = mount(VideoControls, {
      props: defaultProps
    })

    const volumeSlider = wrapper.find('.volume-slider')
    await volumeSlider.setValue(0.7)

    expect(wrapper.emitted('volume-change')).toBeTruthy()
    expect(wrapper.emitted('volume-change')[0][0]).toBe(0.7)
  })

  it('点击全屏按钮应该触发 fullscreen 事件', async () => {
    const wrapper = mount(VideoControls, {
      props: defaultProps
    })

    const fullscreenButton = wrapper.findAll('.control-btn')[2]
    await fullscreenButton.trigger('click')

    expect(wrapper.emitted('fullscreen')).toBeTruthy()
  })

  it('应该处理 NaN 时间', () => {
    const wrapper = mount(VideoControls, {
      props: { ...defaultProps, currentTime: NaN, duration: NaN }
    })

    expect(wrapper.find('.time-display').text()).toContain('00:00')
  })

  it('应该处理负数时间', () => {
    const wrapper = mount(VideoControls, {
      props: { ...defaultProps, currentTime: -10, duration: 100 }
    })

    // 负数时间会被格式化为负数显示
    expect(wrapper.find('.time-display').text()).toContain('-1:-10')
  })

  it('应该处理超大时间', () => {
    const wrapper = mount(VideoControls, {
      props: { ...defaultProps, currentTime: 3661, duration: 3661 }
    })

    // 3661 秒 = 1小时1分1秒
    expect(wrapper.find('.time-display').text()).toContain('61:01')
  })
})
