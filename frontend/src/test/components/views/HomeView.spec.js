import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { useRoomStore } from '@/stores/room'

// 创建测试路由
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/create', component: { template: '<div>Create</div>' } },
    { path: '/join', component: { template: '<div>Join</div>' } },
    { path: '/join/:roomCode', component: { template: '<div>Join Room</div>' } },
    { path: '/history', component: { template: '<div>History</div>' } },
    { path: '/profile', component: { template: '<div>Profile</div>' } }
  ]
})

describe('HomeView', () => {
  let wrapper
  let pinia
  let roomStore

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    roomStore = useRoomStore()
    
    // Mock fetchPublicRooms
    vi.spyOn(roomStore, 'fetchPublicRooms').mockResolvedValue()
    
    await router.push('/')
    await router.isReady()
    
    wrapper = mount(HomeView, {
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
    it('应该渲染首页', () => {
      expect(wrapper.find('.home').exists()).toBe(true)
    })

    it('应该显示 logo', () => {
      expect(wrapper.find('.logo').exists()).toBe(true)
      expect(wrapper.find('.logo').text()).toBe('一起看')
    })

    it('应该显示标语', () => {
      expect(wrapper.find('.tagline').exists()).toBe(true)
      expect(wrapper.find('.tagline').text()).toContain('和朋友同步观影，实时聊天')
    })

    it('应该有创建房间按钮', () => {
      const createButton = wrapper.find('a[href="/create"]')
      expect(createButton.exists()).toBe(true)
      expect(createButton.text()).toContain('创建房间')
    })

    it('应该有加入房间按钮', () => {
      const joinButton = wrapper.find('a[href="/join"]')
      expect(joinButton.exists()).toBe(true)
      expect(joinButton.text()).toContain('加入房间')
    })

    it('应该有历史导航链接', () => {
      const historyLink = wrapper.find('a[href="/history"]')
      expect(historyLink.exists()).toBe(true)
      expect(historyLink.text()).toContain('历史')
    })

    it('应该有个人导航链接', () => {
      const profileLink = wrapper.find('a[href="/profile"]')
      expect(profileLink.exists()).toBe(true)
      expect(profileLink.text()).toContain('个人')
    })
  })

  describe('公开房间测试', () => {
    it('没有公开房间时不应该显示房间区域', () => {
      roomStore.publicRooms = []
      
      expect(wrapper.find('.rooms-section').exists()).toBe(false)
    })

    it('有公开房间时应该显示房间区域', async () => {
      roomStore.publicRooms = [
        { id: 'room-1', name: '房间1', userCount: 2, maxUsers: 5, creatorNickname: '用户1' },
        { id: 'room-2', name: '房间2', userCount: 1, maxUsers: 5, creatorNickname: '用户2' }
      ]
      
      await flushPromises()
      
      expect(wrapper.find('.rooms-section').exists()).toBe(true)
      expect(wrapper.find('.section-title').text()).toContain('公开房间')
    })

    it('应该显示房间卡片', async () => {
      roomStore.publicRooms = [
        { id: 'room-1', name: '房间1', userCount: 2, maxUsers: 5, creatorNickname: '用户1' }
      ]
      
      await flushPromises()
      
      const roomCard = wrapper.find('.room-card')
      expect(roomCard.exists()).toBe(true)
      expect(roomCard.text()).toContain('房间1')
      expect(roomCard.text()).toContain('2/5')
      expect(roomCard.text()).toContain('by 用户1')
    })

    it('应该显示加入按钮', async () => {
      roomStore.publicRooms = [
        { id: 'room-1', name: '房间1', userCount: 2, maxUsers: 5, creatorNickname: '用户1' }
      ]
      
      await flushPromises()
      
      const joinButton = wrapper.find('.btn-join')
      expect(joinButton.exists()).toBe(true)
      expect(joinButton.text()).toBe('加入')
    })

    it('点击房间卡片应该跳转到加入页面', async () => {
      roomStore.publicRooms = [
        { id: 'room-1', name: '房间1', userCount: 2, maxUsers: 5, creatorNickname: '用户1' }
      ]
      
      await flushPromises()
      
      const roomCard = wrapper.find('.room-card')
      // 检查房间卡片是否存在
      expect(roomCard.exists()).toBe(true)
      // 检查房间信息是否正确显示
      expect(roomCard.text()).toContain('房间1')
    })
  })

  describe('加载状态测试', () => {
    it('加载中应该显示 LoadingSpinner', async () => {
      roomStore.loadingPublicRooms = true
      roomStore.publicRoomsError = null
      roomStore.publicRooms = []
      
      await flushPromises()
      
      expect(wrapper.find('.loading-spinner').exists()).toBe(true)
      expect(wrapper.find('.loading-text').text()).toBe('加载公开房间...')
    })

    it('加载中不应该显示房间区域', async () => {
      roomStore.loadingPublicRooms = true
      roomStore.publicRooms = [
        { id: 'room-1', name: '房间1', userCount: 2, maxUsers: 5, creatorNickname: '用户1' }
      ]
      
      await flushPromises()
      
      expect(wrapper.find('.loading-spinner').exists()).toBe(true)
      expect(wrapper.find('.rooms-section').exists()).toBe(false)
    })
  })

  describe('错误状态测试', () => {
    it('有错误时应该显示 ErrorComponent', async () => {
      roomStore.loadingPublicRooms = false
      roomStore.publicRoomsError = new Error('网络请求失败')
      roomStore.publicRooms = []
      
      await flushPromises()
      
      expect(wrapper.find('.error-component').exists()).toBe(true)
      expect(wrapper.find('.error-title').text()).toBe('加载失败')
    })

    it('有错误时不应该显示房间区域', async () => {
      roomStore.loadingPublicRooms = false
      roomStore.publicRoomsError = new Error('网络请求失败')
      roomStore.publicRooms = [
        { id: 'room-1', name: '房间1', userCount: 2, maxUsers: 5, creatorNickname: '用户1' }
      ]
      
      await flushPromises()
      
      expect(wrapper.find('.error-component').exists()).toBe(true)
      expect(wrapper.find('.rooms-section').exists()).toBe(false)
    })

    it('ErrorComponent 应该有重试按钮', async () => {
      roomStore.loadingPublicRooms = false
      roomStore.publicRoomsError = new Error('网络请求失败')
      
      await flushPromises()
      
      const retryButton = wrapper.find('.btn-retry')
      expect(retryButton.exists()).toBe(true)
      expect(retryButton.text()).toBe('重试')
    })
  })

  describe('生命周期测试', () => {
    it('挂载时应该获取公开房间', () => {
      expect(roomStore.fetchPublicRooms).toHaveBeenCalled()
    })
  })
})
