import { vi } from 'vitest'

/**
 * API 测试工具
 * 用于与真实后端服务进行集成测试
 */

// API 基础配置
const API_BASE_URL = 'http://localhost:18080'
const SOCKET_BASE_URL = 'http://localhost:19090'

/**
 * 创建 API 请求函数
 * @param {string} baseURL - 基础 URL
 * @returns {Function} 请求函数
 */
export function createApiClient(baseURL = API_BASE_URL) {
  /**
   * 发送 HTTP 请求
   * @param {string} endpoint - API 端点
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应数据
   */
  async function request(endpoint, options = {}) {
    const url = `${baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }
      
      return data
    } catch (error) {
      console.error(`API 请求失败: ${endpoint}`, error)
      throw error
    }
  }

  return {
    /**
     * GET 请求
     * @param {string} endpoint - API 端点
     * @param {Object} params - 查询参数
     * @returns {Promise<Object>} 响应数据
     */
    get: (endpoint, params = {}) => {
      const queryString = new URLSearchParams(params).toString()
      const url = queryString ? `${endpoint}?${queryString}` : endpoint
      return request(url, { method: 'GET' })
    },

    /**
     * POST 请求
     * @param {string} endpoint - API 端点
     * @param {Object} data - 请求数据
     * @returns {Promise<Object>} 响应数据
     */
    post: (endpoint, data = {}) => {
      return request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
      })
    },

    /**
     * PUT 请求
     * @param {string} endpoint - API 端点
     * @param {Object} data - 请求数据
     * @returns {Promise<Object>} 响应数据
     */
    put: (endpoint, data = {}) => {
      return request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
    },

    /**
     * DELETE 请求
     * @param {string} endpoint - API 端点
     * @returns {Promise<Object>} 响应数据
     */
    delete: (endpoint) => {
      return request(endpoint, { method: 'DELETE' })
    }
  }
}

/**
 * 创建测试 API 客户端
 */
export const testApi = createApiClient()

/**
 * 创建 Socket 测试工具
 * @returns {Object} Socket 测试工具
 */
export function createSocketTestHelper() {
  // 动态导入 socket.io-client
  let io = null
  let socket = null

  async function initSocket() {
    if (!io) {
      const socketModule = await import('socket.io-client')
      io = socketModule.default || socketModule
    }
    
    if (!socket) {
      socket = io(SOCKET_BASE_URL, {
        transports: ['websocket', 'polling'],
        timeout: 5000
      })
    }
    
    return socket
  }

  return {
    /**
     * 连接 Socket
     * @returns {Promise<Object>} Socket 实例
     */
    async connect() {
      const socketInstance = await initSocket()
      return new Promise((resolve, reject) => {
        socketInstance.on('connect', () => {
          resolve(socketInstance)
        })
        
        socketInstance.on('connect_error', (error) => {
          reject(error)
        })
        
        // 设置超时
        setTimeout(() => {
          reject(new Error('Socket 连接超时'))
        }, 5000)
      })
    },

    /**
     * 断开 Socket 连接
     */
    disconnect() {
      if (socket) {
        socket.disconnect()
        socket = null
      }
    },

    /**
     * 发送事件
     * @param {string} event - 事件名称
     * @param {any} data - 事件数据
     */
    emit(event, data) {
      if (socket) {
        socket.emit(event, data)
      }
    },

    /**
     * 监听事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
      if (socket) {
        socket.on(event, callback)
      }
    },

    /**
     * 移除事件监听
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
      if (socket) {
        socket.off(event, callback)
      }
    },

    /**
     * 获取 Socket 实例
     * @returns {Object} Socket 实例
     */
    getSocket() {
      return socket
    }
  }
}

/**
 * 测试数据清理 API
 */
export const testCleanupApi = {
  /**
   * 清理测试用户
   * @returns {Promise<Object>} 响应数据
   */
  clearUsers: () => testApi.post('/test/clear-users'),

  /**
   * 清理测试房间
   * @returns {Promise<Object>} 响应数据
   */
  clearRooms: () => testApi.post('/test/clear-rooms'),

  /**
   * 清理测试消息
   * @returns {Promise<Object>} 响应数据
   */
  clearMessages: () => testApi.post('/test/clear-messages'),

  /**
   * 清理所有测试数据
   * @returns {Promise<void>}
   */
  clearAll: async () => {
    await Promise.all([
      testCleanupApi.clearUsers(),
      testCleanupApi.clearRooms(),
      testCleanupApi.clearMessages()
    ])
  }
}

/**
 * 测试数据创建 API
 */
export const testCreateApi = {
  /**
   * 创建测试用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 创建的用户
   */
  createUser: (userData) => testApi.post('/test/create-user', userData),

  /**
   * 创建测试房间
   * @param {Object} roomData - 房间数据
   * @returns {Promise<Object>} 创建的房间
   */
  createRoom: (roomData) => testApi.post('/test/create-room', roomData),

  /**
   * 创建测试消息
   * @param {Object} messageData - 消息数据
   * @returns {Promise<Object>} 创建的消息
   */
  createMessage: (messageData) => testApi.post('/test/create-message', messageData)
}