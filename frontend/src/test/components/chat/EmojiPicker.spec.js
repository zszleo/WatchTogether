import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EmojiPicker from '@/components/chat/EmojiPicker.vue'

vi.mock('emoji-mart-vue-fast/data/all.json', () => ({
  default: {
    emojis: {},
    categories: []
  }
}))

vi.mock('emoji-mart-vue-fast/css/emoji-mart.css', () => {})

vi.mock('emoji-mart-vue-fast/src', () => ({
  Picker: {
    name: 'Picker',
    template: '<div class="emoji-mart"><slot /></div>',
    props: ['data', 'set', 'native', 'showPreview', 'showSkinTones', 'emojiSize']
  },
  EmojiIndex: vi.fn().mockImplementation(() => ({
    emojis: {}
  }))
}))

describe('EmojiPicker', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(EmojiPicker)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('渲染测试', () => {
    it('应该渲染表情选择器组件', () => {
      expect(wrapper.find('.emoji-mart').exists()).toBe(true)
    })
  })

  describe('表情选择测试', () => {
    it('应该触发 select 事件', async () => {
      const picker = wrapper.findComponent({ name: 'Picker' })
      await picker.vm.$emit('select', { native: '😀' })
      
      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')[0][0]).toBe('😀')
    })
  })
})