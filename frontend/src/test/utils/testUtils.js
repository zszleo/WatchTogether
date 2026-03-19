import { vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

/**
 * 测试工具函数集合
 */

/**
 * 创建测试用的 Pinia 实例
 * @returns {Pinia} Pinia 实例
 */
export function createTestPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/**
 * 等待指定时间
 * @param {number} ms - 毫秒数
 * @returns {Promise<void>}
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 等待下一个 tick
 * @returns {Promise<void>}
 */
export function nextTick() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * 模拟延迟响应
 * @param {any} data - 响应数据
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Promise<any>}
 */
export function delayedResponse(data, delay = 100) {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), delay)
  })
}

/**
 * 创建 mock 函数并设置返回值
 * @param {any} returnValue - 返回值
 * @returns {Function} mock 函数
 */
export function createMock(returnValue) {
  return vi.fn().mockResolvedValue(returnValue)
}

/**
 * 深度克隆对象
 * @param {Object} obj - 要克隆的对象
 * @returns {Object} 克隆后的对象
 */
export function deepClone(obj) {
  if (obj === undefined) return undefined
  return JSON.parse(JSON.stringify(obj))
}

/**
 * 生成随机字符串
 * @param {number} length - 字符串长度
 * @returns {string} 随机字符串
 */
export function randomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 生成随机数字
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机数字
 */
export function randomNumber(min = 0, max = 100) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 生成随机邮箱
 * @returns {string} 随机邮箱
 */
export function randomEmail() {
  return `test_${randomString(5)}@example.com`
}

/**
 * 生成随机用户 ID
 * @returns {string} 随机用户 ID
 */
export function randomUserId() {
  return `user_${randomString(8)}`
}

/**
 * 生成随机房间 ID
 * @returns {string} 随机房间 ID
 */
export function randomRoomId() {
  return `room_${randomString(10)}`
}

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 检查对象是否为空
 * @param {Object} obj - 要检查的对象
 * @returns {boolean} 是否为空
 */
export function isEmptyObject(obj) {
  return Object.keys(obj).length === 0
}

/**
 * 安全的 JSON 解析
 * @param {string} jsonString - JSON 字符串
 * @param {any} defaultValue - 默认值
 * @returns {any} 解析结果或默认值
 */
export function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString)
  } catch {
    return defaultValue
  }
}