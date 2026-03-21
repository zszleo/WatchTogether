/**
 * 请求参数对象
 * 由 OpenAPI 代码生成器自动生成
 * 生成时间: 2026-03-21T16:08:21.605Z
 */

/**
 * 更新用户资料 请求参数
 * @typedef {Object} updateProfileRequest
 * @property {string} sessionId - 必填 - 会话ID
 */
/**
 * 离开房间历史记录 请求参数
 * @typedef {Object} leaveRoomRequest
 * @property {string} sessionId - 必填 - 会话ID
 * @property {integer} historyId - 必填 - 历史记录ID
 */
/**
 * 加入房间历史记录 请求参数
 * @typedef {Object} joinRoomRequest
 * @property {string} sessionId - 必填 - 会话ID
 * @property {string} roomCode - 必填 - 房间码
 */
/**
 * 获取公开房间列表 请求参数
 * @typedef {Object} getPublicRoomsRequest
 * @property {integer} page - 可选 - 页码（从0开始）
 * @property {integer} size - 可选 - 每页大小，最大20
 */
/**
 * 上传文件 请求参数
 * @typedef {Object} uploadFileRequest
 * @property {string} type - 可选 - 文件类型（video/image等）
 */
/**
 * 获取会话信息 请求参数
 * @typedef {Object} getSessionRequest
 * @property {string} sessionId - 必填 - 会话ID
 */
/**
 * 删除会话 请求参数
 * @typedef {Object} deleteSessionRequest
 * @property {string} sessionId - 必填 - 会话ID
 */
/**
 * 验证会话 请求参数
 * @typedef {Object} validateSessionRequest
 * @property {string} sessionId - 必填 - 会话ID
 */
/**
 * 获取用户历史记录 请求参数
 * @typedef {Object} getHistoryRequest
 * @property {string} sessionId - 必填 - 会话ID
 * @property {integer} limit - 可选 - 返回记录数量限制
 */
/**
 * 获取房间详情 请求参数
 * @typedef {Object} getRoomRequest
 * @property {string} roomCode - 必填 - 房间码
 * @property {string} sessionId - 必填 - 用户会话ID（访问私有房间时必需）
 */
/**
 * 删除房间 请求参数
 * @typedef {Object} deleteRoomRequest
 * @property {string} roomCode - 必填 - 房间码
 */
/**
 * 获取聊天消息 请求参数
 * @typedef {Object} getChatMessagesRequest
 * @property {string} roomCode - 必填 - 房间码
 * @property {integer} page - 可选 - 页码（从0开始）
 * @property {integer} size - 可选 - 每页大小，最大100
 * @property {string} sessionId - 必填 - 用户会话ID（访问私有房间时必需）
 */
/**
 * 获取房间邀请链接 请求参数
 * @typedef {Object} getInviteLinkRequest
 * @property {string} roomCode - 必填 - 房间码
 * @property {string} sessionId - 必填 - 用户会话ID（访问私有房间时必需）
 */
/**
 * 获取文件信息 请求参数
 * @typedef {Object} getFileInfoRequest
 * @property {string} fileId - 必填 - 文件ID
 * @property {string} sessionId - 必填 - 用户会话ID
 */
/**
 * 删除文件 请求参数
 * @typedef {Object} deleteFileRequest
 * @property {string} fileId - 必填 - 文件ID
 */
