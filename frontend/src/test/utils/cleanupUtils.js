import { vi } from 'vitest'

/**
 * 数据清理工具
 * 用于清理测试产生的数据，确保测试独立性
 */

/**
 * 清理所有存储的状态
 * @param {Object} store - Pinia store 实例
 */
export function clearStoreState(store) {
  if (store.$reset) {
    store.$reset()
  } else {
    // 手动重置所有状态
    const initialState = store.$state
    Object.keys(initialState).forEach(key => {
      if (Array.isArray(initialState[key])) {
        store[key] = []
      } else if (typeof initialState[key] === 'object' && initialState[key] !== null) {
        store[key] = {}
      } else if (typeof initialState[key] === 'string') {
        store[key] = ''
      } else if (typeof initialState[key] === 'number') {
        store[key] = 0
      } else if (typeof initialState[key] === 'boolean') {
        store[key] = false
      } else {
        store[key] = null
      }
    })
  }
}

/**
 * 清理本地存储
 */
export function clearLocalStorage() {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
}

/**
 * 清理会话存储
 */
export function clearSessionStorage() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear()
  }
}

/**
 * 清理所有存储
 */
export function clearAllStorage() {
  clearLocalStorage()
  clearSessionStorage()
}

/**
 * 清理所有 mock 函数
 * @param {Object} mocks - mock 函数对象
 */
export function clearMocks(mocks) {
  Object.values(mocks).forEach(mock => {
    if (typeof mock === 'function' && mock.mockClear) {
      mock.mockClear()
    }
  })
}

/**
 * 重置所有 mock 函数
 * @param {Object} mocks - mock 函数对象
 */
export function resetMocks(mocks) {
  Object.values(mocks).forEach(mock => {
    if (typeof mock === 'function' && mock.mockReset) {
      mock.mockReset()
    }
  })
}

/**
 * 清理定时器
 */
export function clearAllTimers() {
  vi.clearAllTimers()
}

/**
 * 清理所有测试副作用
 * @param {Object} options - 清理选项
 */
export function cleanupTestSideEffects(options = {}) {
  const {
    clearStorage = true,
    clearTimers = true,
    clearMocks: shouldClearMocks = true,
    mocks = {}
  } = options

  if (clearStorage) {
    clearAllStorage()
  }

  if (clearTimers) {
    clearAllTimers()
  }

  if (shouldClearMocks && Object.keys(mocks).length > 0) {
    clearMocks(mocks)
  }
}

/**
 * 创建数据清理函数
 * @param {Function} cleanupFn - 自定义清理函数
 * @returns {Function} 清理函数
 */
export function createCleanupFunction(cleanupFn) {
  return () => {
    cleanupFn()
    cleanupTestSideEffects()
  }
}

/**
 * 数据库清理工具（需要后端支持）
 */
export const dbCleanup = {
  /**
   * 清理测试用户
   * @param {Function} apiCall - API 调用函数
   * @returns {Promise<void>}
   */
  async clearTestUsers(apiCall) {
    try {
      await apiCall('/api/test/clear-users', { method: 'POST' })
    } catch (error) {
      console.warn('清理测试用户失败:', error)
    }
  },

  /**
   * 清理测试房间
   * @param {Function} apiCall - API 调用函数
   * @returns {Promise<void>}
   */
  async clearTestRooms(apiCall) {
    try {
      await apiCall('/api/test/clear-rooms', { method: 'POST' })
    } catch (error) {
      console.warn('清理测试房间失败:', error)
    }
  },

  /**
   * 清理测试消息
   * @param {Function} apiCall - API 调用函数
   * @returns {Promise<void>}
   */
  async clearTestMessages(apiCall) {
    try {
      await apiCall('/api/test/clear-messages', { method: 'POST' })
    } catch (error) {
      console.warn('清理测试消息失败:', error)
    }
  },

  /**
   * 清理所有测试数据
   * @param {Function} apiCall - API 调用函数
   * @returns {Promise<void>}
   */
  async clearAllTestData(apiCall) {
    await Promise.all([
      this.clearTestUsers(apiCall),
      this.clearTestRooms(apiCall),
      this.clearTestMessages(apiCall)
    ])
  }
}