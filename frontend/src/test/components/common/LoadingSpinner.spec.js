import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

describe('LoadingSpinner', () => {
  it('应该渲染加载组件', () => {
    const wrapper = mount(LoadingSpinner)

    expect(wrapper.find('.loading-spinner').exists()).toBe(true)
    expect(wrapper.find('.spinner').exists()).toBe(true)
    expect(wrapper.find('.loading-text').exists()).toBe(true)
  })

  it('应该显示默认加载文本', () => {
    const wrapper = mount(LoadingSpinner)

    expect(wrapper.find('.loading-text').text()).toBe('加载中...')
  })

  it('应该显示自定义加载文本', () => {
    const wrapper = mount(LoadingSpinner, {
      props: { text: '请稍候...' }
    })

    expect(wrapper.find('.loading-text').text()).toBe('请稍候...')
  })

  it('应该有 spinner 动画元素', () => {
    const wrapper = mount(LoadingSpinner)

    const spinner = wrapper.find('.spinner')
    expect(spinner.exists()).toBe(true)
  })

  it('应该处理空文本 prop', () => {
    const wrapper = mount(LoadingSpinner, {
      props: { text: '' }
    })

    expect(wrapper.find('.loading-text').text()).toBe('')
  })

  it('应该处理长文本 prop', () => {
    const longText = '正在加载视频数据，请稍候片刻...'
    const wrapper = mount(LoadingSpinner, {
      props: { text: longText }
    })

    expect(wrapper.find('.loading-text').text()).toBe(longText)
  })

  it('应该有正确的 CSS 类', () => {
    const wrapper = mount(LoadingSpinner)

    expect(wrapper.classes()).toContain('loading-spinner')
  })

  it('文本应该有正确的 CSS 类', () => {
    const wrapper = mount(LoadingSpinner)

    expect(wrapper.find('.loading-text').exists()).toBe(true)
  })
})
