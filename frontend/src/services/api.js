/**
 * API 调用函数
 * 由 OpenAPI 代码生成器自动生成
 * 生成时间: 2026-03-21T16:08:21.605Z
 */

import { request } from '../utils/request';

/**
 * SessionApi API
 */
export const SessionApi = {
  /**
 * 更新用户资料
 * 更新用户的昵称和头像
 * @param {string} sessionId - 会话ID
 * @param {Object} data - 请求体数据
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  updateProfile: async (sessionId, data, options = {}) => {
    const path = `/api/session/${sessionId}/profile`;
    return request(path, { method: 'PUT', data, ...options });
  },
  /**
 * 创建会话
 * 创建一个新的用户会话，返回会话ID和用户信息
 * @param {Object} data - 请求体数据
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  createSession: async (data, options = {}) => {
    const path = `/api/session`;
    return request(path, { method: 'POST', data, ...options });
  },
  /**
 * 离开房间历史记录
 * 记录用户离开房间的历史
 * @param {string} sessionId - 会话ID
 * @param {integer} historyId - 历史记录ID
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  leaveRoom: async (sessionId, historyId, options = {}) => {
    const path = `/api/session/${sessionId}/history/${historyId}/leave`;
    return request(path, { method: 'POST', ...options });
  },
  /**
 * 加入房间历史记录
 * 记录用户加入房间的历史
 * @param {string} sessionId - 会话ID
 * @param {string} roomCode - 房间码
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  joinRoom: async (sessionId, roomCode, options = {}) => {
    const path = `/api/session/${sessionId}/history/join/${roomCode}`;
    return request(path, { method: 'POST', ...options });
  },
  /**
 * 获取会话信息
 * 根据会话ID获取用户的会话详细信息
 * @param {string} sessionId - 会话ID
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  getSession: async (sessionId, options = {}) => {
    const path = `/api/session/${sessionId}`;
    return request(path, { method: 'GET', ...options });
  },
  /**
 * 删除会话
 * 删除指定会话ID的用户会话
 * @param {string} sessionId - 会话ID
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  deleteSession: async (sessionId, options = {}) => {
    const path = `/api/session/${sessionId}`;
    return request(path, { method: 'DELETE', ...options });
  },
  /**
 * 验证会话
 * 验证会话ID是否有效
 * @param {string} sessionId - 会话ID
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  validateSession: async (sessionId, options = {}) => {
    const path = `/api/session/${sessionId}/validate`;
    return request(path, { method: 'GET', ...options });
  },
  /**
 * 获取用户历史记录
 * 获取用户的房间加入历史记录
 * @param {string} sessionId - 会话ID
 * @param {Object} queryParams - 查询参数
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  getHistory: async (sessionId, queryParams, options = {}) => {
    const path = `/api/session/${sessionId}/history`;
    return request(path, { method: 'GET', params: queryParams, paramDefinitions: {
  "limit": {
    "type": "integer",
    "description": "返回记录数量限制",
    "required": false,
    "in": "query"
  }
}, ...options });
  },
};

/**
 * TestApi API
 */
export const TestApi = {
  /**
 * 创建测试数据
 * 创建基础的测试数据用于集成测试
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  createTestData: async (options = {}) => {
    const path = `/api/test/create-test-data`;
    return request(path, { method: 'POST', ...options });
  },
  /**
 * 清理测试用户
 * 清理所有测试用户数据，包括会话和会话历史
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  clearUsers: async (options = {}) => {
    const path = `/api/test/clear-users`;
    return request(path, { method: 'POST', ...options });
  },
  /**
 * 清理测试房间
 * 清理所有测试房间数据，包括房间信息和聊天消息
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  clearRooms: async (options = {}) => {
    const path = `/api/test/clear-rooms`;
    return request(path, { method: 'POST', ...options });
  },
  /**
 * 清理测试消息
 * 清理所有测试聊天消息数据
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  clearMessages: async (options = {}) => {
    const path = `/api/test/clear-messages`;
    return request(path, { method: 'POST', ...options });
  },
  /**
 * 清理所有测试数据
 * 清理所有测试数据，包括用户、房间、消息等
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  clearAll: async (options = {}) => {
    const path = `/api/test/clear-all`;
    return request(path, { method: 'POST', ...options });
  },
};

/**
 * RoomApi API
 */
export const RoomApi = {
  /**
 * 获取公开房间列表
 * 获取公开可见的房间列表，支持分页
 * @param {Object} queryParams - 查询参数
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  getPublicRooms: async (queryParams, options = {}) => {
    const path = `/api/room`;
    return request(path, { method: 'GET', params: queryParams, paramDefinitions: {
  "page": {
    "type": "integer",
    "description": "页码（从0开始）",
    "required": false,
    "in": "query"
  },
  "size": {
    "type": "integer",
    "description": "每页大小，最大20",
    "required": false,
    "in": "query"
  }
}, ...options });
  },
  /**
 * 创建房间
 * 创建一个新的观看房间，需要有效的会话ID
 * @param {Object} data - 请求体数据
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  createRoom: async (data, options = {}) => {
    const path = `/api/room`;
    return request(path, { method: 'POST', data, ...options });
  },
  /**
 * 获取房间详情
 * 根据房间码获取房间详细信息，私有房间需要有效的会话ID
 * @param {string} roomCode - 房间码
 * @param {Object} queryParams - 查询参数
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  getRoom: async (roomCode, queryParams, options = {}) => {
    const path = `/api/room/${roomCode}`;
    return request(path, { method: 'GET', params: queryParams, paramDefinitions: {
  "sessionId": {
    "type": "string",
    "description": "用户会话ID（访问私有房间时必需）",
    "required": true,
    "in": "query"
  }
}, ...options });
  },
  /**
 * 删除房间
 * 删除指定房间，需要房间所有者权限
 * @param {string} roomCode - 房间码
 * @param {Object} data - 请求体数据
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  deleteRoom: async (roomCode, data, options = {}) => {
    const path = `/api/room/${roomCode}`;
    return request(path, { method: 'DELETE', data, ...options });
  },
  /**
 * 获取聊天消息
 * 获取房间的聊天消息历史，支持分页
 * @param {string} roomCode - 房间码
 * @param {Object} queryParams - 查询参数
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  getChatMessages: async (roomCode, queryParams, options = {}) => {
    const path = `/api/room/${roomCode}/messages`;
    return request(path, { method: 'GET', params: queryParams, paramDefinitions: {
  "page": {
    "type": "integer",
    "description": "页码（从0开始）",
    "required": false,
    "in": "query"
  },
  "size": {
    "type": "integer",
    "description": "每页大小，最大100",
    "required": false,
    "in": "query"
  },
  "sessionId": {
    "type": "string",
    "description": "用户会话ID（访问私有房间时必需）",
    "required": true,
    "in": "query"
  }
}, ...options });
  },
  /**
 * 获取房间邀请链接
 * 获取房间的邀请链接，私有房间需要有效的会话ID
 * @param {string} roomCode - 房间码
 * @param {Object} queryParams - 查询参数
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  getInviteLink: async (roomCode, queryParams, options = {}) => {
    const path = `/api/room/${roomCode}/invite`;
    return request(path, { method: 'GET', params: queryParams, paramDefinitions: {
  "sessionId": {
    "type": "string",
    "description": "用户会话ID（访问私有房间时必需）",
    "required": true,
    "in": "query"
  }
}, ...options });
  },
};

/**
 * FileApi API
 */
export const FileApi = {
  /**
 * 上传文件
 * 上传视频或其他文件，支持的文件类型：.mp4, .webm, .mkv, .mov, .avi，最大100MB
 * @param {Object} queryParams - 查询参数
 * @param {Object} data - 请求体数据
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  uploadFile: async (queryParams, data, options = {}) => {
    const path = `/api/file/upload`;
    return request(path, { method: 'POST', params: queryParams, data, paramDefinitions: {
  "type": {
    "type": "string",
    "description": "文件类型（video/image等）",
    "required": false,
    "in": "query"
  }
}, ...options });
  },
  /**
 * 获取文件信息
 * 根据文件ID获取文件详细信息
 * @param {string} fileId - 文件ID
 * @param {Object} queryParams - 查询参数
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  getFileInfo: async (fileId, queryParams, options = {}) => {
    const path = `/api/file/${fileId}`;
    return request(path, { method: 'GET', params: queryParams, paramDefinitions: {
  "sessionId": {
    "type": "string",
    "description": "用户会话ID",
    "required": true,
    "in": "query"
  }
}, ...options });
  },
  /**
 * 删除文件
 * 根据文件ID删除文件，需要文件所有者权限
 * @param {string} fileId - 文件ID
 * @param {Object} data - 请求体数据
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  deleteFile: async (fileId, data, options = {}) => {
    const path = `/api/file/${fileId}`;
    return request(path, { method: 'DELETE', data, ...options });
  },
};

/**
 * HealthApi API
 */
export const HealthApi = {
  /**
 * 系统健康检查
 * 检查系统及依赖服务（Redis）的健康状态
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  healthCheck: async (options = {}) => {
    const path = `/api/health`;
    return request(path, { method: 'GET', ...options });
  },
  /**
 * 简单健康检查
 * 返回简单的系统健康状态，不包含依赖服务检查
 * @param {Object} [options={}] - 请求选项（如headers、timeout等）
 * @returns {Promise} Promise对象
 */
  simpleHealth: async (options = {}) => {
    const path = `/api/health/simple`;
    return request(path, { method: 'GET', ...options });
  },
};
