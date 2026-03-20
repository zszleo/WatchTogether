// frontend/src/test/integration/api.integration.spec.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { testApi, testCleanupApi } from '@/test/utils/apiTestHelper'

describe('API 集成测试', () => {
  // 测试超时设置较长，因为要调用真实后端
  const TEST_TIMEOUT = 10000
  
  beforeEach(async () => {
    // 每个测试前清理测试数据
    try {
      await testCleanupApi.clearAll()
    } catch (error) {
      // 如果清理失败，可能是测试端点不存在，忽略
      console.warn('清理测试数据失败，可能测试端点未启用:', error.message)
    }

    // 创建测试会话用于 API 请求
    try {
      const nickname = '测试用户-' + Date.now()
      const sessionResponse = await testApi.post('/api/session', { nickname })
      const sessionId = sessionResponse.data.id
      
      // 设置默认会话 ID 头部
      testApi.setDefaultHeader('X-Session-Id', sessionId)
    } catch (error) {
      console.warn('创建测试会话失败:', error.message)
    }
  })

  afterEach(async () => {
    // 每个测试后清理测试数据
    try {
      await testCleanupApi.clearAll()
    } catch (error) {
      // 忽略清理错误
    }
  })

  describe('健康检查', () => {
    it('应该能访问健康检查端点', async () => {
      const response = await testApi.get('/api/health')
      expect(response).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('status')
      expect(response.data.status).toBe('UP')
    }, TEST_TIMEOUT)
  })

  describe('会话管理', () => {
    it('应该能创建会话', async () => {
      const nickname = '测试用户-' + Date.now()
      const response = await testApi.post('/api/session', {
        nickname
      })
      
      expect(response).toHaveProperty('success', true)
      expect(response).toHaveProperty('data')
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('nickname', nickname)
    }, TEST_TIMEOUT)

    it('应该能获取会话信息', async () => {
      // 先创建会话
      const nickname = '测试用户-' + Date.now()
      const createResponse = await testApi.post('/api/session', { nickname })
      const sessionId = createResponse.data.id
      
      // 获取会话信息
      const getResponse = await testApi.get(`/api/session/${sessionId}`)
      
      expect(getResponse).toHaveProperty('success', true)
      expect(getResponse.data).toHaveProperty('id', sessionId)
      expect(getResponse.data).toHaveProperty('nickname', nickname)
    }, TEST_TIMEOUT)

    it('应该能更新会话信息', async () => {
      // 先创建会话
      const nickname = '测试用户-' + Date.now()
      const createResponse = await testApi.post('/api/session', { nickname })
      const sessionId = createResponse.data.id
      
      // 更新会话信息
      const newNickname = '更新后的用户-' + Date.now()
      const updateResponse = await testApi.put(`/api/session/${sessionId}/profile`, {
        nickname: newNickname
      })
      
      expect(updateResponse).toHaveProperty('success', true)
      
      // 验证更新
      const getResponse = await testApi.get(`/api/session/${sessionId}`)
      expect(getResponse.data).toHaveProperty('nickname', newNickname)
    }, TEST_TIMEOUT)
  })

  describe('房间管理', () => {
    it('应该能创建房间', async () => {
      // 先创建会话
      const nickname = '房间创建者-' + Date.now()
      const createSessionResponse = await testApi.post('/api/session', { nickname })
      const sessionId = createSessionResponse.data.id
      
      // 设置会话 ID 头部
      testApi.setDefaultHeader('X-Session-Id', sessionId)
      
      // 创建房间
      const roomName = '测试房间-' + Date.now()
      const createRoomResponse = await testApi.post('/api/room', {
        name: roomName,
        maxUsers: 5,
        isPublic: true,
        creatorSessionId: sessionId,
        creatorNickname: nickname
      })
      
      expect(createRoomResponse).toHaveProperty('success', true)
      expect(createRoomResponse.data).toHaveProperty('id')
      expect(createRoomResponse.data).toHaveProperty('name', roomName)
      expect(createRoomResponse.data).toHaveProperty('ownerSessionId', sessionId)
    }, TEST_TIMEOUT)

    it('应该能获取房间信息', async () => {
      // 先创建会话和房间
      const nickname = '房间创建者-' + Date.now()
      const createSessionResponse = await testApi.post('/api/session', { nickname })
      const sessionId = createSessionResponse.data.id
      
      const roomName = '测试房间-' + Date.now()
      const createRoomResponse = await testApi.post('/api/room', {
        name: roomName,
        maxUsers: 5,
        isPublic: true,
        creatorSessionId: sessionId,
        creatorNickname: nickname
      })
      const roomId = createRoomResponse.data.id
      
      // 获取房间信息
      const getRoomResponse = await testApi.get(`/api/room/${roomId}`)
      
      expect(getRoomResponse).toHaveProperty('success', true)
      expect(getRoomResponse.data).toHaveProperty('id', roomId)
      expect(getRoomResponse.data).toHaveProperty('name', roomName)
    }, TEST_TIMEOUT)

    it('应该能获取公开房间列表', async () => {
      // 创建几个公开房间
      const nickname = '公开房间创建者-' + Date.now()
      const createSessionResponse = await testApi.post('/api/session', { nickname })
      const sessionId = createSessionResponse.data.id
      
      // 创建多个公开房间
      for (let i = 1; i <= 3; i++) {
        await testApi.post('/api/room', {
          name: `公开房间${i}-${Date.now()}`,
          maxUsers: 5,
          isPublic: true,
          creatorSessionId: sessionId,
          creatorNickname: nickname
        })
      }
      
      // 获取公开房间列表
      const publicRoomsResponse = await testApi.get('/api/room')
      
      expect(publicRoomsResponse).toHaveProperty('success', true)
      expect(Array.isArray(publicRoomsResponse.data)).toBe(true)
    }, TEST_TIMEOUT)

    it.skip('应该能加入和离开房间（通过Socket实现，无HTTP端点）', async () => {
      // 创建房间
      const creatorNickname = '房主-' + Date.now()
      const createSessionResponse = await testApi.post('/api/session', { nickname: creatorNickname })
      const creatorSessionId = createSessionResponse.data.id
      
      const roomName = '加入测试房间-' + Date.now()
      const createRoomResponse = await testApi.post('/api/room', {
        name: roomName,
        maxUsers: 5,
        isPublic: true,
        creatorSessionId: creatorSessionId,
        creatorNickname: creatorNickname
      })
      const roomId = createRoomResponse.data.id
      
      // 另一个用户加入房间
      const joinerNickname = '加入者-' + Date.now()
      const joinerSessionResponse = await testApi.post('/api/session', { nickname: joinerNickname })
      const joinerSessionId = joinerSessionResponse.data.id
      
      const joinResponse = await testApi.post(`/api/room/${roomId}/join`, {
        sessionId: joinerSessionId,
        nickname: joinerNickname
      })
      
      expect(joinResponse).toHaveProperty('success', true)
      
      // 获取房间信息，验证用户列表
      const roomInfoResponse = await testApi.get(`/api/room/${roomId}`)
      expect(roomInfoResponse.data).toHaveProperty('users')
      expect(Array.isArray(roomInfoResponse.data.users)).toBe(true)
      expect(roomInfoResponse.data.users).toHaveLength(2)
      
      // 用户离开房间
      const leaveResponse = await testApi.post(`/api/room/${roomId}/leave`, {
        sessionId: joinerSessionId
      })
      
      expect(leaveResponse).toHaveProperty('success', true)
      
      // 验证用户已离开
      const updatedRoomInfoResponse = await testApi.get(`/api/room/${roomId}`)
      expect(updatedRoomInfoResponse.data.users).toHaveLength(1)
    }, TEST_TIMEOUT)
  })

  describe('聊天消息', () => {
    it.skip('应该能发送和获取聊天消息（发送通过Socket，获取端点未实现）', async () => {
      // 创建房间
      const nickname = '聊天测试用户-' + Date.now()
      const sessionResponse = await testApi.post('/api/session', { nickname })
      const sessionId = sessionResponse.data.id
      
      const roomName = '聊天测试房间-' + Date.now()
      const createRoomResponse = await testApi.post('/api/room', {
        name: roomName,
        maxUsers: 5,
        isPublic: true,
        creatorSessionId: sessionId,
        creatorNickname: nickname
      })
      const roomId = createRoomResponse.data.id
      
      // 发送消息
      const messageContent = '测试消息-' + Date.now()
      const sendMessageResponse = await testApi.post(`/api/room/${roomId}/message`, {
        senderId: sessionId,
        senderNickname: nickname,
        content: messageContent,
        type: 'text'
      })
      
      expect(sendMessageResponse).toHaveProperty('success', true)
      
      // 获取聊天消息
      const getMessagesResponse = await testApi.get(`/api/room/${roomId}/messages`)
      
      expect(getMessagesResponse).toHaveProperty('success', true)
      expect(getMessagesResponse.data).toHaveProperty('messages')
      expect(Array.isArray(getMessagesResponse.data.messages)).toBe(true)
      expect(getMessagesResponse.data.messages.length).toBeGreaterThan(0)
      
      // 验证消息内容
      const lastMessage = getMessagesResponse.data.messages[0]
      expect(lastMessage).toHaveProperty('content', messageContent)
      expect(lastMessage).toHaveProperty('senderId', sessionId)
      expect(lastMessage).toHaveProperty('senderNickname', nickname)
    }, TEST_TIMEOUT)
  })
})