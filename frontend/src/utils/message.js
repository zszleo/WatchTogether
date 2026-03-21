import { createApp, ref, h } from 'vue'
import MessageComponent from '@/components/common/Message.vue'

const instances = ref([])

/**
 * 显示消息提示
 * @param {Object} options - 消息配置
 * @param {string} options.type - 消息类型：success, error, warning, info
 * @param {string} options.message - 消息内容
 * @param {number} options.duration - 显示时长（毫秒），0表示不自动关闭
 * @param {boolean} options.showClose - 是否显示关闭按钮
 * @returns {Object} 消息实例控制对象
 */
function showMessage(options) {
  const { type = 'info', message, duration = 3000, showClose = false } = options
  
  if (!message) {
    console.warn('Message content is required')
    return null
  }
  
  const container = document.createElement('div')
  container.className = 'message-wrapper'
  document.body.appendChild(container)
  
  const close = () => {
    if (app) {
      app.unmount()
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
      const index = instances.value.indexOf(app)
      if (index > -1) {
        instances.value.splice(index, 1)
      }
    }
  }
  
  const app = createApp({
    render() {
      return h(MessageComponent, {
        type,
        message,
        duration,
        showClose,
        onClose: close
      })
    }
  })
  
  app.mount(container)
  instances.value.push(app)
  
  return {
    close,
    app
  }
}

/**
 * 消息提示API
 */
export const message = {
  /**
   * 成功消息
   * @param {string} msg - 消息内容
   * @param {number} duration - 显示时长（毫秒）
   * @returns {Object} 消息实例
   */
  success: (msg, duration = 3000) => showMessage({ 
    type: 'success', 
    message: msg, 
    duration 
  }),
  
  /**
   * 错误消息
   * @param {string} msg - 消息内容
   * @param {number} duration - 显示时长（毫秒）
   * @returns {Object} 消息实例
   */
  error: (msg, duration = 3000) => showMessage({ 
    type: 'error', 
    message: msg, 
    duration 
  }),
  
  /**
   * 警告消息
   * @param {string} msg - 消息内容
   * @param {number} duration - 显示时长（毫秒）
   * @returns {Object} 消息实例
   */
  warning: (msg, duration = 3000) => showMessage({ 
    type: 'warning', 
    message: msg, 
    duration 
  }),
  
  /**
   * 信息消息
   * @param {string} msg - 消息内容
   * @param {number} duration - 显示时长（毫秒）
   * @returns {Object} 消息实例
   */
  info: (msg, duration = 3000) => showMessage({ 
    type: 'info', 
    message: msg, 
    duration 
  })
}

/**
 * 关闭所有消息
 */
export function closeAll() {
  instances.value.forEach(app => {
    if (app) {
      app.unmount()
    }
  })
  instances.value = []
}

export default message
