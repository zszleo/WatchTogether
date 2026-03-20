import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import { EmojisApi } from '@/services/api'

vi.mock('@/services/api', () => ({
  EmojisApi: {
    getDefaultEmojis: vi.fn().mockResolvedValue([
      { id: 1, name: 'smile', unicode: '😀' },
      { id: 2, name: 'heart', unicode: '❤️' }
    ]),
    getEmojisByNickname: vi.fn().mockResolvedValue([
      { id: 1, name: 'custom', unicode: '😊' }
    ])
  }
}))

describe('EmojiPicker', () => {
  let wrapper
  let pinia
  let userStore
  let EmojiPicker

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    
    const emojiModule = await import('@/components/chat/EmojiPicker.vue')
    EmojiPicker = emojiModule.default
    
    pinia = createPinia()
    setActivePinia(pinia)
    userStore = useUserStore()
    userStore.nickname = 'testuser'
    
    wrapper = mount(EmojiPicker, {
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
    it('应该渲染表情选择器组件', () => {
      expect(wrapper.find('.emoji-picker-enhanced').exists()).toBe(true)
    })

    it('应该有表情内容区域', () => {
      expect(wrapper.find('.emoji-content').exists()).toBe(true)
    })

    it('应该有表情网格', () => {
      expect(wrapper.find('.emoji-grid').exists()).toBe(true)
    })

    it('应该有底部操作栏', () => {
      expect(wrapper.find('.emoji-footer').exists()).toBe(true)
    })

    it('应该有关闭按钮', () => {
      expect(wrapper.find('.btn-close').exists()).toBe(true)
      expect(wrapper.find('.btn-close').text()).toBe('关闭')
    })
  })

  describe('表情数据加载测试', () => {
    it('应该加载表情数据', async () => {
      await flushPromises()
      
      const emojiButtons = wrapper.findAll('.emoji-btn')
      expect(emojiButtons.length).toBeGreaterThan(0)
    }, 10000)

    it('表情按钮应该显示表情代码', async () => {
      await flushPromises()
      
      const emojiButton = wrapper.find('.emoji-btn')
      expect(emojiButton.exists()).toBe(true)
      expect(emojiButton.text()).toBeTruthy()
    }, 10000)

    it('表情按钮应该有 title 属性', async () => {
      await flushPromises()
      
      const emojiButton = wrapper.find('.emoji-btn')
      expect(emojiButton.attributes('title')).toBeTruthy()
    }, 10000)
  })

  describe('表情选择测试', () => {
    it('点击表情按钮应该触发 select 事件', async () => {
      await flushPromises()
      
      const emojiButton = wrapper.find('.emoji-btn')
      await emojiButton.trigger('click')
      
      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')[0][0]).toBeTruthy()
    })

    it('点击表情应该显示预览', async () => {
      await flushPromises()
      
      const emojiButton = wrapper.find('.emoji-btn')
      await emojiButton.trigger('click')

      await flushPromises()
      
      expect(wrapper.find('.emoji-preview').exists()).toBe(true)
    })

    it('预览应该显示表情代码和名称', async () => {
      await flushPromises()
      
      const emojiButton = wrapper.find('.emoji-btn')
      await emojiButton.trigger('click')

      await flushPromises()
      
      expect(wrapper.find('.emoji-preview-code').exists()).toBe(true)
      expect(wrapper.find('.emoji-preview-name').exists()).toBe(true)
    })
  })

  describe('鼠标悬停测试', () => {
    it('鼠标悬停应该更新预览', async () => {
      await flushPromises()
      
      const emojiButton = wrapper.find('.emoji-btn')
      await emojiButton.trigger('mouseover')

      await flushPromises()
      
      expect(wrapper.vm.previewEmoji).toBeTruthy()
    })
  })

  describe('关闭按钮测试', () => {
    it('点击关闭按钮应该触发 close 事件', async () => {
      await wrapper.find('.btn-close').trigger('click')
      
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('加载状态测试', () => {
    it('加载完成后应该移除加载样式', async () => {
      await flushPromises()
      
      expect(wrapper.find('.emoji-content').classes()).not.toContain('loading')
    })
  })

  describe('缓存测试', () => {
    it('应该支持重置全局缓存', async () => {
      // 先加载数据
      await flushPromises()
      expect(wrapper.findAll('.emoji-btn').length).toBeGreaterThan(0)
      
      // 调用 resetGlobalCache
      wrapper.vm.resetGlobalCache()
      
      // 创建新实例验证缓存已重置
      vi.resetModules()
      const emojiModule = await import('@/components/chat/EmojiPicker.vue')
      const NewEmojiPicker = emojiModule.default
      
      const callCountBefore = EmojisApi.getDefaultEmojis.mock.calls.length
      
      const newWrapper = mount(NewEmojiPicker, {
        global: {
          plugins: [pinia]
        }
      })
      await flushPromises()
      
      // 应该重新请求 API
      expect(EmojisApi.getDefaultEmojis.mock.calls.length).toBeGreaterThan(callCountBefore)
      newWrapper.unmount()
    })

    it('缓存已加载时应该直接返回', async () => {
      // 第一次加载
      await flushPromises()
      
      // 创建新实例，应该使用缓存
      const newWrapper = mount(EmojiPicker, {
        global: {
          plugins: [pinia]
        }
      })
      await flushPromises()
      
      expect(newWrapper.findAll('.emoji-btn').length).toBeGreaterThan(0)
      newWrapper.unmount()
    })

    it('默认表情为空时应该尝试获取用户表情', async () => {
      // 重置缓存
      wrapper.vm.resetGlobalCache()
      
      // Mock 默认表情返回空
      EmojisApi.getDefaultEmojis.mockResolvedValueOnce([])
      EmojisApi.getEmojisByNickname.mockResolvedValueOnce([
        { id: 1, name: 'custom1', unicode: '🎉' }
      ])
      
      // 重新加载数据
      await wrapper.vm.loadData()
      await flushPromises()
      
      // 验证调用了获取用户表情的 API
      expect(EmojisApi.getEmojisByNickname).toHaveBeenCalledWith('testuser')
    })
  })

  describe('边界情况测试', () => {
    it('loadData 缓存命中时应该直接返回', async () => {
      // 确保缓存已加载
      await flushPromises()
      
      // 再次调用 loadData
      await wrapper.vm.loadData()
      
      // 应该不会重复请求 API
      const callCount = EmojisApi.getDefaultEmojis.mock.calls.length
      await wrapper.vm.loadData()
      expect(EmojisApi.getDefaultEmojis.mock.calls.length).toBe(callCount)
    })

    it('preloadEmojiData 已加载时应该直接返回', async () => {
      // 确保缓存已加载
      await flushPromises()
      
      // 记录当前调用次数
      const callCountBefore = EmojisApi.getDefaultEmojis.mock.calls.length
      
      // 再次调用 preloadEmojiData，应该直接返回而不重新请求
      await wrapper.vm.preloadEmojiData()
      
      // API 不应该被再次调用
      expect(EmojisApi.getDefaultEmojis.mock.calls.length).toBe(callCountBefore)
    })

    it('表情没有 unicode 时应该显示 name', async () => {
      // 直接设置 emojis 来测试显示逻辑
      wrapper.vm.emojis = [{ id: 1, name: 'custom-emoji', unicode: null }]
      await flushPromises()
      
      const emojiButton = wrapper.find('.emoji-btn')
      expect(emojiButton.text()).toBe('custom-emoji')
    })

    it('preloadEmojiData 失败时 loadData 应该静默处理', async () => {
      // Mock API 失败
      EmojisApi.getDefaultEmojis.mockRejectedValueOnce(new Error('Network error'))
      
      // 重置模块
      vi.resetModules()
      
      const emojiModule = await import('@/components/chat/EmojiPicker.vue')
      const NewEmojiPicker = emojiModule.default
      
      const newWrapper = mount(NewEmojiPicker, {
        global: {
          plugins: [pinia]
        }
      })
      
      // 等待异步操作完成，不应该抛出错误
      await flushPromises()
      
      // 组件应该正常渲染，只是没有表情数据
      expect(newWrapper.find('.emoji-picker-enhanced').exists()).toBe(true)
      newWrapper.unmount()
    })
  })
})
