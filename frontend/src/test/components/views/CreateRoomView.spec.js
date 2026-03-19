import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import CreateRoomView from '@/views/CreateRoomView.vue'

// 创建测试路由
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/create', component: CreateRoomView }
  ]
})

describe('CreateRoomView', () => {
  let wrapper
  let pinia

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    
    await router.push('/create')
    await router.isReady()
    
    wrapper = mount(CreateRoomView, {
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
  })

  describe('渲染测试', () => {
    it('应该渲染创建房间页面', () => {
      expect(wrapper.find('.page-create').exists()).toBe(true)
    })

    it('应该有页面标题', () => {
      expect(wrapper.find('.page-title').exists()).toBe(true)
      expect(wrapper.find('.page-title').text()).toBe('创建房间')
    })

    it('应该有返回链接', () => {
      const backLink = wrapper.find('.back-link')
      expect(backLink.exists()).toBe(true)
      expect(backLink.text()).toContain('← 返回')
      expect(backLink.attributes('href')).toBe('/')
    })

    it('应该渲染 RoomForm 组件', () => {
      expect(wrapper.findComponent({ name: 'RoomForm' }).exists()).toBe(true)
    })
  })

  describe('导航测试', () => {
    it('返回链接应该指向首页', () => {
      const backLink = wrapper.find('.back-link')
      expect(backLink.attributes('href')).toBe('/')
    })
  })
})
