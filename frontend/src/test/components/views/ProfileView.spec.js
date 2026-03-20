import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import ProfileView from '@/views/ProfileView.vue'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/profile', component: ProfileView }
  ]
})

describe('ProfileView', () => {
  let wrapper
  let pinia
  let userStore

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    userStore = useUserStore()
    await router.push('/profile')
    await router.isReady()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.restoreAllMocks()
  })

  describe('渲染测试', () => {
    it('应该渲染个人中心页面', () => {
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      expect(wrapper.find('.page-profile').exists()).toBe(true)
    })

    it('应该显示返回链接', () => {
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      expect(wrapper.find('.back-link').exists()).toBe(true)
    })

    it('应该显示页面标题', () => {
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      expect(wrapper.find('.page-title').text()).toBe('个人中心')
    })
  })

  describe('未登录状态测试', () => {
    it('未登录时应该显示未登录提示', () => {
      userStore.sessionId = null
      
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      
      expect(wrapper.find('.not-logged-in').exists()).toBe(true)
      expect(wrapper.find('.not-logged-icon').text()).toBe('👤')
      expect(wrapper.find('.not-logged-in p').text()).toBe('未登录')
    })

    it('未登录时应该有返回首页链接', () => {
      userStore.sessionId = null
      
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      
      const link = wrapper.find('.not-logged-in .btn-primary')
      expect(link.exists()).toBe(true)
      expect(link.text()).toBe('返回首页')
    })

    it('未登录时不应该显示个人资料表单', () => {
      userStore.sessionId = null
      
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      
      expect(wrapper.find('.profile-container').exists()).toBe(false)
    })
  })

  describe('已登录状态测试', () => {
    beforeEach(() => {
      userStore.sessionId = 'test-session-123'
      userStore.nickname = '测试用户'
      userStore.avatar = '😀'
      userStore.createdAt = '2024-01-01T00:00:00Z'
      vi.spyOn(userStore, 'updateProfile').mockResolvedValue()
    })

    it('已登录时应该显示个人资料容器', () => {
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      
      expect(wrapper.find('.profile-container').exists()).toBe(true)
    })

    it('应该显示头像区域', () => {
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      
      expect(wrapper.find('.avatar-section').exists()).toBe(true)
    })

    it('应该显示当前头像', async () => {
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      expect(wrapper.find('.avatar-display .avatar-emoji').text()).toBe('😀')
    })

    it('应该显示头像选择网格', () => {
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      
      expect(wrapper.find('.avatar-grid').exists()).toBe(true)
      expect(wrapper.findAll('.avatar-option').length).toBe(12)
    })

    it('应该显示会话ID', async () => {
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      const infoItems = wrapper.findAll('.info-item')
      const sessionIdEl = infoItems[0].find('.info-value')
      expect(sessionIdEl.text()).toBe('test-session-123')
    })

    it('应该显示创建时间', () => {
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      
      const infoItems = wrapper.findAll('.info-item')
      expect(infoItems.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('表单操作测试', () => {
    beforeEach(() => {
      userStore.sessionId = 'test-session-123'
      userStore.nickname = '原始昵称'
      userStore.avatar = '👤'
      userStore.createdAt = '2024-01-01T00:00:00Z'
      vi.spyOn(userStore, 'updateProfile').mockResolvedValue()
    })

    it('表单初始值应该与store一致', async () => {
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      const nicknameInput = wrapper.find('input[type="text"]')
      expect(nicknameInput.element.value).toBe('原始昵称')
    })

    it('修改昵称后 isChanged 应该为 true', async () => {
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      
      const nicknameInput = wrapper.find('input[type="text"]')
      await nicknameInput.setValue('新昵称')
      
      const saveButton = wrapper.find('.btn-primary')
      expect(saveButton.attributes('disabled')).toBeUndefined()
    })

    it('点击保存按钮应该调用 updateProfile', async () => {
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      
      vi.spyOn(window, 'alert').mockImplementation(() => {})
      
      const nicknameInput = wrapper.find('input[type="text"]')
      await nicknameInput.setValue('新昵称')
      
      const saveButton = wrapper.find('.btn-primary')
      await saveButton.trigger('submit')
      
      await flushPromises()
      
      expect(userStore.updateProfile).toHaveBeenCalledWith({
        nickname: '新昵称',
        avatar: '👤'
      })
      
      window.alert.mockRestore()
    })

    it('保存成功后应该显示提示', async () => {
      vi.stubGlobal('alert', vi.fn())
      
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      
      const nicknameInput = wrapper.find('input[type="text"]')
      await nicknameInput.setValue('新昵称')
      
      const saveButton = wrapper.find('.btn-primary')
      await saveButton.trigger('submit')
      
      await flushPromises()
      
      expect(window.alert).toHaveBeenCalledWith('个人资料已更新')
      
      vi.stubGlobal('alert', vi.fn())
    })

    it('保存时应该禁用按钮', async () => {
      userStore.updateProfile.mockImplementation(() => new Promise(() => {}))
      
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      
      const nicknameInput = wrapper.find('input[type="text"]')
      await nicknameInput.setValue('新昵称')
      
      const saveButton = wrapper.find('.btn-primary')
      await saveButton.trigger('submit')
      
      expect(saveButton.attributes('disabled')).toBeDefined()
      expect(saveButton.text()).toBe('保存中...')
    })

    it('重置按钮应该在有更改时可用', async () => {
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      
      const nicknameInput = wrapper.find('input[type="text"]')
      await nicknameInput.setValue('新昵称')
      
      const resetButton = wrapper.find('.btn-secondary')
      expect(resetButton.attributes('disabled')).toBeUndefined()
    })

    it('点击重置按钮应该恢复原始值', async () => {
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      
      const nicknameInput = wrapper.find('input[type="text"]')
      await nicknameInput.setValue('新昵称')
      
      const resetButton = wrapper.find('.btn-secondary')
      await resetButton.trigger('click')
      
      expect(nicknameInput.element.value).toBe('原始昵称')
    })

    it('无更改时按钮应该禁用', async () => {
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      const saveButton = wrapper.find('.btn-primary')
      expect(saveButton.attributes('disabled')).toBeDefined()
      
      const resetButton = wrapper.find('.btn-secondary')
      expect(resetButton.attributes('disabled')).toBeDefined()
    })
  })

  describe('头像选择测试', () => {
    beforeEach(() => {
      userStore.sessionId = 'test-session-123'
      userStore.nickname = '测试用户'
      userStore.avatar = '👤'
      userStore.createdAt = '2024-01-01T00:00:00Z'
      vi.spyOn(userStore, 'updateProfile').mockResolvedValue()
    })

    it('点击头像选项应该选中该头像', async () => {
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      
      const avatarOptions = wrapper.findAll('.avatar-option')
      await avatarOptions[1].trigger('click')
      
      expect(wrapper.find('.avatar-display .avatar-emoji').text()).toBe('😀')
    })

    it('选中头像应该有 active 类', async () => {
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      
      const avatarOptions = wrapper.findAll('.avatar-option')
      await avatarOptions[1].trigger('click')
      
      expect(avatarOptions[1].classes()).toContain('active')
    })

    it('修改头像后保存应该发送新头像', async () => {
      vi.stubGlobal('alert', vi.fn())
      
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      
      const avatarOptions = wrapper.findAll('.avatar-option')
      await avatarOptions[2].trigger('click')
      
      const saveButton = wrapper.find('.btn-primary')
      await saveButton.trigger('submit')
      
      await flushPromises()
      
      expect(userStore.updateProfile).toHaveBeenCalledWith({
        nickname: '测试用户',
        avatar: '😎'
      })
      
      vi.stubGlobal('alert', vi.fn())
    })
  })

  describe('退出登录测试', () => {
    beforeEach(() => {
      userStore.sessionId = 'test-session-123'
      userStore.nickname = '测试用户'
      userStore.avatar = '👤'
      userStore.createdAt = '2024-01-01T00:00:00Z'
    })

    it('应该有退出登录按钮', () => {
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      
      const logoutButton = wrapper.find('.btn-logout')
      expect(logoutButton.exists()).toBe(true)
    })

    it('点击退出登录应该清空session并跳转', async () => {
      vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
      vi.spyOn(userStore, 'logout')
      
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      await flushPromises()
      
      const logoutButton = wrapper.find('.btn-logout')
      await logoutButton.trigger('click')
      await flushPromises()
      
      expect(userStore.logout).toHaveBeenCalled()
      expect(router.currentRoute.value.path).toBe('/')
    })

    it('取消退出登录不应该清空session', async () => {
      vi.stubGlobal('confirm', vi.fn().mockReturnValue(false))
      vi.spyOn(userStore, 'logout')
      
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      
      const logoutButton = wrapper.find('.btn-logout')
      await logoutButton.trigger('click')
      
      expect(userStore.logout).not.toHaveBeenCalled()
      
      confirm.mockRestore()
    })
  })

  describe('日期格式化测试', () => {
    beforeEach(() => {
      userStore.sessionId = 'test-session-123'
      userStore.nickname = '测试用户'
      userStore.avatar = '👤'
      userStore.createdAt = '2024-01-15T10:30:00Z'
      vi.spyOn(userStore, 'updateProfile').mockResolvedValue()
    })

    it('应该格式化日期', () => {
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      
      const dateEl = wrapper.findAll('.info-value').at(1)
      expect(dateEl.text()).toContain('2024')
    })

    it('没有创建时间应该显示未知', () => {
      userStore.createdAt = null
      
      wrapper = mount(ProfileView, {
        global: {
          plugins: [pinia, router]
        }
      })
      
      const dateEl = wrapper.findAll('.info-value').at(1)
      expect(dateEl.text()).toBe('未知')
    })
  })
})
