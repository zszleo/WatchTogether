// frontend/src/test/integration/component-store.integration.spec.js
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
    { path: '/join/:roomId', component: { template: '<div>Join Room</div>' } },
    { path: '/history', component: { template: '<div>History</div>' } },
    { path: '/profile', component: { template: '<div>Profile</div>' } }
  ]
})

describe('组件-Store 集成测试', () => {
  let wrapper
  let pinia
  let roomStore

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    roomStore = useRoomStore()
    
    // 设置初始 store 状态
    roomStore.publicRooms = []
    
    await router.push('/')
    await router.isReady()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.restoreAllMocks()
  })

  describe('HomeView 与 RoomStore 集成', () => {
    it('组件挂载时应该调用 fetchPublicRooms', async () => {
      const fetchSpy = vi.spyOn(roomStore, 'fetchPublicRooms').mockResolvedValue()
      
      wrapper = mount(HomeView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('store 状态更新时应该显示公开房间列表', async () => {
      // 模拟公开房间数据
      const mockRooms = [
        {
          id: 'room-1',
          name: '测试房间1',
          userCount: 3,
          maxUsers: 5,
          creatorNickname: '用户1'
        },
        {
          id: 'room-2',
          name: '测试房间2',
          userCount: 2,
          maxUsers: 10,
          creatorNickname: '用户2'
        }
      ]
      
      // 设置 store 状态
      roomStore.publicRooms = mockRooms
      
      wrapper = mount(HomeView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      // 验证房间列表显示
      expect(wrapper.text()).toContain('公开房间')
      expect(wrapper.find('.rooms-section').exists()).toBe(true)
      
      // 验证房间卡片数量
      const roomCards = wrapper.findAll('.room-card')
      expect(roomCards).toHaveLength(2)
      
      // 验证房间信息
      expect(wrapper.text()).toContain('测试房间1')
      expect(wrapper.text()).toContain('3/5')
      expect(wrapper.text()).toContain('用户1')
    })

    it('点击房间卡片应该跳转到加入页面', async () => {
      const mockRooms = [
        {
          id: 'room-123',
          name: '点击测试房间',
          userCount: 1,
          maxUsers: 5,
          creatorNickname: '测试用户'
        }
      ]
      
      roomStore.publicRooms = mockRooms
      
      const pushSpy = vi.spyOn(router, 'push')
      
      wrapper = mount(HomeView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      // 点击房间卡片
      const roomCard = wrapper.find('.room-card')
      await roomCard.trigger('click')
      
      expect(pushSpy).toHaveBeenCalledWith('/join/room-123')
    })

    it('没有公开房间时不显示房间区域', async () => {
      roomStore.publicRooms = []
      
      wrapper = mount(HomeView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      expect(wrapper.find('.rooms-section').exists()).toBe(false)
    })
  })
})