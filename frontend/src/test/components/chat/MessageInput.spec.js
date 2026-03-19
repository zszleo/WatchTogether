import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MessageInput from '@/components/chat/MessageInput.vue'

describe('MessageInput', () => {
  let wrapper
  let pinia

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    
    wrapper = mount(MessageInput, {
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
    it('应该渲染消息输入组件', () => {
      expect(wrapper.find('.message-input-wrapper').exists()).toBe(true)
      expect(wrapper.find('.input-container').exists()).toBe(true)
    })

    it('应该有表情按钮', () => {
      expect(wrapper.find('.btn-emoji').exists()).toBe(true)
      expect(wrapper.find('.btn-emoji').text()).toContain('😀')
    })

    it('应该有输入框', () => {
      expect(wrapper.find('.input-field').exists()).toBe(true)
      expect(wrapper.find('.input-field').attributes('placeholder')).toBe('发送消息...')
    })

    it('应该有发送按钮', () => {
      expect(wrapper.find('.btn-send').exists()).toBe(true)
      expect(wrapper.find('.btn-send').text()).toBe('发送')
    })

    it('发送按钮应该默认禁用', () => {
      expect(wrapper.find('.btn-send').attributes('disabled')).toBeDefined()
    })
  })

  describe('输入测试', () => {
    it('输入文字后发送按钮应该启用', async () => {
      const input = wrapper.find('.input-field')
      await input.setValue('测试消息')
      
      expect(wrapper.find('.btn-send').attributes('disabled')).toBeUndefined()
    })

    it('清空输入后发送按钮应该禁用', async () => {
      const input = wrapper.find('.input-field')
      await input.setValue('测试消息')
      await input.setValue('')
      
      expect(wrapper.find('.btn-send').attributes('disabled')).toBeDefined()
    })
  })

  describe('发送消息测试', () => {
    it('点击发送按钮应该触发 send 事件', async () => {
      const input = wrapper.find('.input-field')
      await input.setValue('测试消息')
      await wrapper.find('.btn-send').trigger('click')
      
      expect(wrapper.emitted('send')).toBeTruthy()
      expect(wrapper.emitted('send')[0][0]).toBe('测试消息')
    })

    it('按回车键应该触发 send 事件', async () => {
      const input = wrapper.find('.input-field')
      await input.setValue('测试消息')
      await input.trigger('keyup.enter')
      
      expect(wrapper.emitted('send')).toBeTruthy()
      expect(wrapper.emitted('send')[0][0]).toBe('测试消息')
    })

    it('发送后应该清空输入框', async () => {
      const input = wrapper.find('.input-field')
      await input.setValue('测试消息')
      await wrapper.find('.btn-send').trigger('click')
      
      expect(input.element.value).toBe('')
    })

    it('不应该发送空白消息', async () => {
      const input = wrapper.find('.input-field')
      await input.setValue('   ')
      await wrapper.find('.btn-send').trigger('click')
      
      expect(wrapper.emitted('send')).toBeFalsy()
    })

    it('应该去除消息首尾空白', async () => {
      const input = wrapper.find('.input-field')
      await input.setValue('  测试消息  ')
      await wrapper.find('.btn-send').trigger('click')
      
      expect(wrapper.emitted('send')[0][0]).toBe('测试消息')
    })
  })

  describe('表情选择器测试', () => {
    it('点击表情按钮应该显示表情选择器', async () => {
      await wrapper.find('.btn-emoji').trigger('click')
      
      expect(wrapper.find('.emoji-picker-enhanced-wrapper').exists()).toBe(true)
    })

    it('再次点击表情按钮应该隐藏表情选择器', async () => {
      await wrapper.find('.btn-emoji').trigger('click')
      await wrapper.find('.btn-emoji').trigger('click')
      
      expect(wrapper.find('.emoji-picker-enhanced-wrapper').exists()).toBe(false)
    })

    it('选择表情应该插入到输入框', async () => {
      await wrapper.find('.btn-emoji').trigger('click')
      
      const emojiPicker = wrapper.findComponent({ name: 'EmojiPicker' })
      emojiPicker.vm.$emit('select', '😀')
      
      await flushPromises()
      
      expect(wrapper.find('.input-field').element.value).toContain('😀')
    })

    it('选择表情后应该隐藏表情选择器', async () => {
      await wrapper.find('.btn-emoji').trigger('click')
      
      const emojiPicker = wrapper.findComponent({ name: 'EmojiPicker' })
      emojiPicker.vm.$emit('select', '😀')
      
      await flushPromises()
      
      expect(wrapper.find('.emoji-picker-enhanced-wrapper').exists()).toBe(false)
    })
  })
})
