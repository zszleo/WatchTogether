import { randomString, randomNumber, randomEmail, randomUserId, randomRoomId } from './testUtils'

/**
 * 测试数据生成工具
 * 用于生成各种测试数据
 */

/**
 * 生成测试用户数据
 * @param {Object} overrides - 覆盖默认值
 * @returns {Object} 用户数据
 */
export function generateTestUser(overrides = {}) {
  const userId = randomUserId()
  return {
    id: userId,
    username: `test_user_${randomString(5)}`,
    email: randomEmail(),
    nickname: `测试用户${randomNumber(1, 1000)}`,
    avatar: `https://example.com/avatars/${userId}.jpg`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }
}

/**
 * 生成测试房间数据
 * @param {Object} overrides - 覆盖默认值
 * @returns {Object} 房间数据
 */
export function generateTestRoom(overrides = {}) {
  const roomId = randomRoomId()
  return {
    id: roomId,
    name: `测试房间${randomNumber(1, 1000)}`,
    description: `这是一个测试房间，房间号：${roomId}`,
    ownerId: randomUserId(),
    isPublic: true,
    maxUsers: randomNumber(2, 10),
    currentUsers: randomNumber(1, 5),
    videoUrl: `https://example.com/videos/test${randomNumber(1, 100)}.mp4`,
    videoState: {
      playing: false,
      currentTime: 0,
      duration: randomNumber(60, 3600)
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }
}

/**
 * 生成测试消息数据
 * @param {Object} overrides - 覆盖默认值
 * @returns {Object} 消息数据
 */
export function generateTestMessage(overrides = {}) {
  return {
    id: `msg_${randomString(10)}`,
    roomId: randomRoomId(),
    userId: randomUserId(),
    content: `测试消息内容 ${randomString(20)}`,
    type: 'text', // text, image, system
    createdAt: new Date().toISOString(),
    ...overrides
  }
}

/**
 * 生成测试视频状态数据
 * @param {Object} overrides - 覆盖默认值
 * @returns {Object} 视频状态数据
 */
export function generateTestVideoState(overrides = {}) {
  return {
    playing: Math.random() > 0.5,
    currentTime: randomNumber(0, 3600),
    duration: randomNumber(60, 7200),
    volume: randomNumber(0, 100) / 100,
    muted: Math.random() > 0.8,
    playbackRate: 1.0,
    ...overrides
  }
}

/**
 * 生成测试播放列表数据
 * @param {number} count - 视频数量
 * @param {Object} overrides - 覆盖默认值
 * @returns {Array} 播放列表
 */
export function generateTestPlaylist(count = 3, overrides = {}) {
  const playlist = []
  for (let i = 0; i < count; i++) {
    playlist.push({
      id: `video_${randomString(8)}`,
      title: `测试视频 ${i + 1}`,
      url: `https://example.com/videos/test${randomNumber(1, 1000)}.mp4`,
      duration: randomNumber(60, 3600),
      thumbnail: `https://example.com/thumbnails/test${randomNumber(1, 1000)}.jpg`,
      addedBy: randomUserId(),
      addedAt: new Date().toISOString(),
      ...overrides
    })
  }
  return playlist
}

/**
 * 生成测试用户列表
 * @param {number} count - 用户数量
 * @param {Object} overrides - 覆盖默认值
 * @returns {Array} 用户列表
 */
export function generateTestUserList(count = 5, overrides = {}) {
  const users = []
  for (let i = 0; i < count; i++) {
    users.push(generateTestUser(overrides))
  }
  return users
}

/**
 * 生成测试房间列表
 * @param {number} count - 房间数量
 * @param {Object} overrides - 覆盖默认值
 * @returns {Array} 房间列表
 */
export function generateTestRoomList(count = 10, overrides = {}) {
  const rooms = []
  for (let i = 0; i < count; i++) {
    rooms.push(generateTestRoom(overrides))
  }
  return rooms
}

/**
 * 生成测试消息列表
 * @param {number} count - 消息数量
 * @param {Object} overrides - 覆盖默认值
 * @returns {Array} 消息列表
 */
export function generateTestMessageList(count = 20, overrides = {}) {
  const messages = []
  const roomId = randomRoomId()
  for (let i = 0; i < count; i++) {
    messages.push(generateTestMessage({ roomId, ...overrides }))
  }
  return messages
}

/**
 * 生成测试 API 响应
 * @param {any} data - 响应数据
 * @param {boolean} success - 是否成功
 * @param {string} message - 消息
 * @returns {Object} API 响应
 */
export function generateTestApiResponse(data = null, success = true, message = '') {
  return {
    success,
    data,
    message: message || (success ? '操作成功' : '操作失败'),
    timestamp: new Date().toISOString()
  }
}

/**
 * 生成测试错误响应
 * @param {string} message - 错误消息
 * @param {number} code - 错误代码
 * @returns {Object} 错误响应
 */
export function generateTestErrorResponse(message = '服务器内部错误', code = 500) {
  return {
    success: false,
    data: null,
    message,
    code,
    timestamp: new Date().toISOString()
  }
}

/**
 * 生成测试 Socket 事件数据
 * @param {string} event - 事件名称
 * @param {any} data - 事件数据
 * @returns {Object} Socket 事件
 */
export function generateTestSocketEvent(event, data = {}) {
  return {
    event,
    data,
    timestamp: new Date().toISOString()
  }
}