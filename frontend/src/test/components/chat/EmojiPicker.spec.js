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
})
