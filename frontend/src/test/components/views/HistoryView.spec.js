import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import HistoryView from '@/views/HistoryView.vue'
import { useUserStore } from '@/stores/user'
import { SessionApi } from '@/services/api'

vi.mock('@/services/api', () => ({
  SessionApi: {
    getHistory: vi.fn()
  }
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/join/:roomId', component: { template: '<div>Join Room</div>' } }
  ]
})

describe('HistoryView', () => {
  let wrapper
  let pinia
  let userStore

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    userStore = useUserStore()
    userStore.sessionId = 'test-session-123'
    userStore.nickname = '测试用户'

    await router.push('/history')
    await router.isReady()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.restoreAllMocks()
  })

  describe('渲染测试', () => {
    it('应该渲染历史页面', () => {
      wrapper = mount(HistoryView, {
        global: {
          plugins: [pinia, router]
        }
      })
      expect(wrapper.find('.page-history').exists()).toBe(true)
    })

    it('应该显示返回链接', () => {
      wrapper = mount(HistoryView, {
        global: {
          plugins: [pinia, router]
        }
      })
      expect(wrapper.find('.back-link').exists()).toBe(true)
    })

    it('应该显示页面标题', () => {
      wrapper = mount(HistoryView, {
        global: {
          plugins: [pinia, router]
        }
      })
      expect(wrapper.find('.page-title').text()).toBe('历史记录')
    })
  })

  describe('加载状态测试', () => {
    it('加载中应该显示加载提示', async () => {
      SessionApi.getHistory.mockImplementation(() => new Promise(() => {}))
      
      wrapper = mount(HistoryView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      expect(wrapper.find('.loading').exists()).toBe(true)
      expect(wrapper.find('.loading').text()).toBe('加载中...')
    })
  })

  describe('空状态测试', () => {
    it('没有历史记录时应该显示空状态', async () => {
      SessionApi.getHistory.mockResolvedValue({ rooms: [] })
      
      wrapper = mount(HistoryView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      expect(wrapper.find('.empty-history').exists()).toBe(true)
      expect(wrapper.find('.empty-icon').text()).toBe('📜')
      expect(wrapper.find('.empty-history p').text()).toBe('暂无历史记录')
    })

    it('空状态应该有去首页创建房间链接', async () => {
      SessionApi.getHistory.mockResolvedValue({ rooms: [] })
      
      wrapper = mount(HistoryView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      const link = wrapper.find('.empty-history .btn-primary')
      expect(link.exists()).toBe(true)
      expect(link.text()).toBe('去首页创建房间')
    })

    it('请求失败时应该显示空状态', async () => {
      SessionApi.getHistory.mockRejectedValue(new Error('Network Error'))
      
      wrapper = mount(HistoryView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      expect(wrapper.find('.empty-history').exists()).toBe(true)
    })
  })

  describe('有历史记录测试', () => {
    it('有历史记录时应该显示历史列表', async () => {
      const mockHistory = [
        {
          roomId: 'room-1',
          roomName: '测试房间1',
          joinedAt: '2024-01-15T10:00:00Z',
          userCount: 3
        },
        {
          roomId: 'room-2',
          roomName: '测试房间2',
          joinedAt: '2024-01-16T14:30:00Z',
          userCount: 2
        }
      ]
      SessionApi.getHistory.mockResolvedValue({ rooms: mockHistory })
      
      wrapper = mount(HistoryView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      expect(wrapper.find('.history-list').exists()).toBe(true)
      expect(wrapper.findAll('.history-card').length).toBe(2)
    })

    it('应该显示房间名称', async () => {
      SessionApi.getHistory.mockResolvedValue({
        rooms: [{ roomId: 'room-1', roomName: '测试房间', joinedAt: '2024-01-15T10:00:00Z' }]
      })
      
      wrapper = mount(HistoryView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      expect(wrapper.find('.room-name').text()).toBe('测试房间')
    })

    it('应该显示房间ID', async () => {
      SessionApi.getHistory.mockResolvedValue({
        rooms: [{ roomId: 'room-123', roomName: '测试房间', joinedAt: '2024-01-15T10:00:00Z' }]
      })
      
      wrapper = mount(HistoryView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      expect(wrapper.find('.room-id').text()).toBe('房间号: room-123')
    })

    it('应该显示用户数量', async () => {
      SessionApi.getHistory.mockResolvedValue({
        rooms: [{ roomId: 'room-1', roomName: '测试房间', joinedAt: '2024-01-15T10:00:00Z', userCount: 5 }]
      })
      
      wrapper = mount(HistoryView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      const statItems = wrapper.findAll('.stat-item')
      expect(statItems[0].text()).toBe('👥 5人')
    })

    it('应该显示重新加入按钮', async () => {
      SessionApi.getHistory.mockResolvedValue({
        rooms: [{ roomId: 'room-1', roomName: '测试房间', joinedAt: '2024-01-15T10:00:00Z' }]
      })
      
      wrapper = mount(HistoryView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      expect(wrapper.find('.btn-join').text()).toBe('重新加入')
    })

    it('点击历史卡片应该跳转到加入页面', async () => {
      SessionApi.getHistory.mockResolvedValue({
        rooms: [{ roomId: 'room-1', roomName: '测试房间', joinedAt: '2024-01-15T10:00:00Z' }]
      })
      
      wrapper = mount(HistoryView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      await wrapper.find('.history-card').trigger('click')
      await flushPromises()
      
      expect(router.currentRoute.value.path).toBe('/join/room-1')
    })
  })

  describe('时间格式化测试', () => {
    it('应该格式化时间戳', async () => {
      SessionApi.getHistory.mockResolvedValue({
        rooms: [{ roomId: 'room-1', roomName: '测试', joinedAt: '2024-01-15T10:30:00Z' }]
      })
      
      wrapper = mount(HistoryView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      const timeEl = wrapper.find('.room-time')
      expect(timeEl.exists()).toBe(true)
    })

    it('应该处理无时间戳', async () => {
      SessionApi.getHistory.mockResolvedValue({
        rooms: [{ roomId: 'room-1', roomName: '测试', joinedAt: null }]
      })
      
      wrapper = mount(HistoryView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      expect(wrapper.find('.room-time').text()).toBe('加入时间:')
    })
  })

  describe('日期格式化测试', () => {
    it('今天应该显示今天', async () => {
      const today = new Date()
      SessionApi.getHistory.mockResolvedValue({
        rooms: [{ roomId: 'room-1', roomName: '测试', joinedAt: today.toISOString() }]
      })
      
      wrapper = mount(HistoryView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      const statItems = wrapper.findAll('.stat-item')
      expect(statItems[statItems.length - 1].text()).toBe('📅 今天')
    })

    it('昨天应该显示昨天', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      SessionApi.getHistory.mockResolvedValue({
        rooms: [{ roomId: 'room-1', roomName: '测试', joinedAt: yesterday.toISOString() }]
      })
      
      wrapper = mount(HistoryView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      const statItems = wrapper.findAll('.stat-item')
      expect(statItems[statItems.length - 1].text()).toBe('📅 昨天')
    })

    it('7天内应该显示天数', async () => {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      SessionApi.getHistory.mockResolvedValue({
        rooms: [{ roomId: 'room-1', roomName: '测试', joinedAt: threeDaysAgo.toISOString() }]
      })
      
      wrapper = mount(HistoryView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      const statItems = wrapper.findAll('.stat-item')
      expect(statItems[statItems.length - 1].text()).toBe('📅 3天前')
    })

    it('超过7天应该显示日期', async () => {
      const tenDaysAgo = new Date()
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
      SessionApi.getHistory.mockResolvedValue({
        rooms: [{ roomId: 'room-1', roomName: '测试', joinedAt: tenDaysAgo.toISOString() }]
      })
      
      wrapper = mount(HistoryView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      const statItems = wrapper.findAll('.stat-item')
      const dateEl = statItems[statItems.length - 1]
      expect(dateEl.text()).toMatch(/📅 \d+月\d+日/)
    })
  })

  describe('未登录状态测试', () => {
    it('没有 sessionId 时不应该加载历史', async () => {
      userStore.sessionId = null
      SessionApi.getHistory.mockResolvedValue({ rooms: [] })
      
      wrapper = mount(HistoryView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      expect(SessionApi.getHistory).not.toHaveBeenCalled()
    })
  })
})
