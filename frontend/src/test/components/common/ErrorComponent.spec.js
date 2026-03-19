import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ErrorComponent from '@/components/common/ErrorComponent.vue'

describe('ErrorComponent', () => {
  beforeEach(() => {
    // Mock window.location.reload
    delete window.location
    window.location = { reload: vi.fn() }
  })

  it('应该渲染错误组件', () => {
    const error = new Error('测试错误')
    const wrapper = mount(ErrorComponent, {
      props: { error }
    })

    expect(wrapper.find('.error-component').exists()).toBe(true)
    expect(wrapper.find('.error-icon').exists()).toBe(true)
    expect(wrapper.find('.error-title').exists()).toBe(true)
    expect(wrapper.find('.error-message').exists()).toBe(true)
    expect(wrapper.find('.btn-retry').exists()).toBe(true)
  })

  it('应该显示错误消息', () => {
    const error = new Error('网络连接失败')
    const wrapper = mount(ErrorComponent, {
      props: { error }
    })

    expect(wrapper.text()).toContain('网络连接失败')
  })

  it('应该显示默认标题', () => {
    const error = new Error('测试')
    const wrapper = mount(ErrorComponent, {
      props: { error }
    })

    expect(wrapper.find('.error-title').text()).toBe('加载失败')
  })

  it('应该有重试按钮', () => {
    const error = new Error('测试')
    const wrapper = mount(ErrorComponent, {
      props: { error }
    })

    const button = wrapper.find('.btn-retry')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('重试')
  })

  it('点击重试按钮应该调用 window.location.reload', async () => {
    const error = new Error('测试')
    const wrapper = mount(ErrorComponent, {
      props: { error }
    })

    await wrapper.find('.btn-retry').trigger('click')

    expect(window.location.reload).toHaveBeenCalled()
  })

  it('应该显示错误图标', () => {
    const error = new Error('测试')
    const wrapper = mount(ErrorComponent, {
      props: { error }
    })

    expect(wrapper.find('.error-icon').text()).toContain('❌')
  })

  it('应该处理没有 message 的 error 对象', () => {
    const error = new Error()
    const wrapper = mount(ErrorComponent, {
      props: { error }
    })

    // 应该显示默认错误消息
    expect(wrapper.find('.error-message').text()).toBe('加载组件时发生错误')
  })

  it('应该处理 error 为 null 的情况', () => {
    const error = new Error()
    error.message = null
    const wrapper = mount(ErrorComponent, {
      props: { error }
    })

    expect(wrapper.find('.error-message').text()).toBe('加载组件时发生错误')
  })
})
