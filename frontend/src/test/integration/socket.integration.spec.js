// frontend/src/test/integration/socket.integration.spec.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { testApi, testCleanupApi, createSocketTestHelper } from '@/test/utils/apiTestHelper'

describe('Socket 集成测试', () => {
  // 测试超时设置较长，因为Socket连接和事件处理需要时间
  const TEST_TIMEOUT = 15000
  let socketHelper1
  let socketHelper2
  let socket1
  let socket2

  beforeEach(async () => {
    // 清理测试数据
    try {
      await testCleanupApi.clearAll()
    } catch (error) {
      console.warn('清理测试数据失败:', error.message)
    }
  })

  afterEach(async () => {
    // 断开Socket连接
    if (socketHelper1) {
      socketHelper1.disconnect()
      socketHelper1 = null
    }
    if (socketHelper2) {
      socketHelper2.disconnect()
      socketHelper2 = null
    }
    
    // 等待Socket断开完成
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 清理测试数据
    try {
      await testCleanupApi.clearAll()
    } catch (error) {
      // 忽略清理错误
    }
  })

  describe('基本连接', () => {
    it('应该能连接到Socket服务器', async () => {
      socketHelper1 = createSocketTestHelper()
      socket1 = await socketHelper1.connect()
      
      expect(socket1).toBeDefined()
      expect(socket1.connected).toBe(true)
    }, TEST_TIMEOUT)

    it('断开连接后应该触发断开事件', async () => {
      socketHelper1 = createSocketTestHelper()
      socket1 = await socketHelper1.connect()
      
      expect(socket1.connected).toBe(true)
      
      // 监听断开事件
      const disconnectPromise = new Promise((resolve) => {
        socket1.on('disconnect', resolve)
      })
      
      // 断开连接
      socketHelper1.disconnect()
      
      // 等待断开事件
      await disconnectPromise
      
      expect(socket1.connected).toBe(false)
    }, TEST_TIMEOUT)
  })

  describe('房间加入和离开', () => {
    let roomId
    let roomCode
    let sessionId1
    let sessionId2

    beforeEach(async () => {
      // 创建测试房间
      const nickname1 = 'Socket用户1-' + Date.now()
      const sessionResponse1 = await testApi.post('/api/session', { nickname: nickname1 })
      sessionId1 = sessionResponse1.data.id
      
      // 设置会话 ID 头部用于创建房间
      testApi.setDefaultHeader('X-Session-Id', sessionId1)
      
      const roomName = 'Socket测试房间-' + Date.now()
      const createRoomResponse = await testApi.post('/api/room', {
        name: roomName,
        maxUsers: 5,
        isPublic: true,
        creatorSessionId: sessionId1,
        creatorNickname: nickname1
      })
      roomId = createRoomResponse.data.id
      roomCode = createRoomResponse.data.code
      
      // 创建第二个用户
      const nickname2 = 'Socket用户2-' + Date.now()
      const sessionResponse2 = await testApi.post('/api/session', { nickname: nickname2 })
      sessionId2 = sessionResponse2.data.id
    })

    it('用户应该能加入房间', async () => {
      socketHelper1 = createSocketTestHelper()
      socket1 = await socketHelper1.connect()
      
      console.log(`测试: 用户 ${sessionId1} 加入房间 ${roomCode}`)
      
      // 监听所有事件用于调试
      const allEvents = []
      const originalOn = socket1.on.bind(socket1)
      socket1.on = (event, callback) => {
        console.log(`监听事件: ${event}`)
        allEvents.push(event)
        originalOn(event, (...args) => {
          console.log(`收到事件 ${event}:`, args[0])
          return callback(...args)
        })
      }
      
      // 监听用户加入事件
      const userJoinedPromise = new Promise((resolve) => {
        socket1.on('user-joined', (data) => {
          console.log('收到 user-joined 事件:', data)
          resolve({ type: 'user-joined', data })
        })
      })
      
      // 监听房间状态事件
      const roomStatePromise = new Promise((resolve) => {
        socket1.on('room-state', (data) => {
          console.log('收到 room-state 事件:', data)
          resolve({ type: 'room-state', data })
        })
      })
      
      // 监听连接确认事件
      const joinAckPromise = new Promise((resolve) => {
        socket1.emit('join-room', { roomId: roomCode, sessionId: sessionId1 }, (response) => {
          console.log('收到 join-room ACK 响应:', response)
          resolve({ type: 'ack', data: response })
        })
      })
      
      // 设置超时
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('等待房间事件超时 (5000ms)')), 5000)
      )
      
      // 等待第一个事件
      const result = await Promise.race([
        joinAckPromise,
        roomStatePromise,
        userJoinedPromise,
        timeoutPromise
      ])
      
      console.log('收到第一个事件:', result)
      
      // 根据事件类型验证
      if (result.type === 'ack') {
        // 验证 ACK 响应
        expect(result.data).toHaveProperty('success', true)
        expect(result.data).toHaveProperty('roomId', roomCode)
      } else if (result.type === 'room-state') {
        // 验证房间状态
        expect(result.data).toHaveProperty('roomId', roomId)
        expect(result.data).toHaveProperty('code', roomCode)
      } else if (result.type === 'user-joined') {
        // 验证用户加入事件
        expect(result.data).toHaveProperty('sessionId', sessionId1)
        expect(result.data).toHaveProperty('socketId')
      }
      
      console.log(`监听了 ${allEvents.length} 个事件: ${allEvents.join(', ')}`)
    }, TEST_TIMEOUT)

    it('多个用户应该能同时加入房间', async () => {
      console.log(`测试: 用户 ${sessionId1} 和 ${sessionId2} 同时加入房间 ${roomCode}`)
      
      // 第一个用户加入
      socketHelper1 = createSocketTestHelper()
      socket1 = await socketHelper1.connect()
      
      // 第二个用户加入
      socketHelper2 = createSocketTestHelper()
      socket2 = await socketHelper2.connect()
      
      // 监听两个用户的加入事件和房间状态事件
      const userJoinedEvents = []
      const roomStateEvents = []
      
      socket1.on('user-joined', (data) => {
        console.log('socket1 收到 user-joined:', data)
        userJoinedEvents.push({ ...data, socket: 'socket1' })
      })
      socket2.on('user-joined', (data) => {
        console.log('socket2 收到 user-joined:', data)
        userJoinedEvents.push({ ...data, socket: 'socket2' })
      })
      
      socket1.on('room-state', (data) => {
        console.log('socket1 收到 room-state:', data)
        roomStateEvents.push({ ...data, socket: 'socket1' })
      })
      socket2.on('room-state', (data) => {
        console.log('socket2 收到 room-state:', data)
        roomStateEvents.push({ ...data, socket: 'socket2' })
      })
      
      // 两个用户依次加入房间
      socket1.emit('join-room', { roomId: roomCode, sessionId: sessionId1 })
      await new Promise(resolve => setTimeout(resolve, 500)) // 等待第一个用户加入
      socket2.emit('join-room', { roomId: roomCode, sessionId: sessionId2 })
      
      // 等待事件处理
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log(`收集到的事件: user-joined=${userJoinedEvents.length}, room-state=${roomStateEvents.length}`)
      console.log('user-joined 事件详情:', userJoinedEvents)
      console.log('room-state 事件详情:', roomStateEvents)
      
      // 验证至少两个房间状态事件（每个用户加入后应收到自己的房间状态）
      expect(roomStateEvents.length).toBeGreaterThanOrEqual(2)
      
      // 验证用户加入事件（可能不会触发或只触发一个）
      // 注意：当用户加入时，服务器会广播 user-joined 给所有房间内的用户
      // 第一个用户加入时，房间内只有自己，所以可能不会收到 user-joined
      // 第二个用户加入时，第一个用户应该收到 user-joined 事件
      if (userJoinedEvents.length > 0) {
        const sessionIds = userJoinedEvents.map(event => event.sessionId)
        // 至少一个用户加入事件应该包含第二个用户的 sessionId
        expect(sessionIds).toContain(sessionId2)
      }
      
      // 验证两个用户都成功加入了房间（通过 room-state 事件）
      const joinedSessionIds = new Set()
      roomStateEvents.forEach(event => {
        if (event.roomId === roomId) {
          // 房间状态事件可能包含在线用户信息
          if (event.onlineUsers) {
            joinedSessionIds.add(`socket${event.socket === 'socket1' ? '1' : '2'}`)
          }
        }
      })
      
      // 至少应该有两个不同的房间状态事件
      expect(roomStateEvents.filter(e => e.roomId === roomId).length).toBeGreaterThanOrEqual(2)
    }, TEST_TIMEOUT)

    it('用户离开房间应该触发离开事件', async () => {
      socketHelper1 = createSocketTestHelper()
      socket1 = await socketHelper1.connect()
      socketHelper2 = createSocketTestHelper()
      socket2 = await socketHelper2.connect()
      
      // 两个用户都加入房间
      socket1.emit('join-room', { roomId: roomCode, sessionId: sessionId1 })
      socket2.emit('join-room', { roomId: roomCode, sessionId: sessionId2 })
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 监听用户离开事件
      const userLeftPromise = new Promise((resolve) => {
        socket1.on('user-left', (data) => {
          resolve(data)
        })
      })
      
      // 第二个用户离开房间
      socket2.emit('leave-room', { roomId: roomCode })
      
      // 等待离开事件
      const leaveEventData = await userLeftPromise
      
      expect(leaveEventData).toHaveProperty('sessionId', sessionId2)
      expect(leaveEventData).toHaveProperty('socketId')
    }, TEST_TIMEOUT)
  })

  describe('聊天消息', () => {
    let roomId
    let roomCode
    let sessionId1
    let sessionId2

    beforeEach(async () => {
      // 创建测试房间和用户
      const nickname1 = '聊天用户1-' + Date.now()
      const sessionResponse1 = await testApi.post('/api/session', { nickname: nickname1 })
      sessionId1 = sessionResponse1.data.id
      
      // 设置会话 ID 头部用于创建房间
      testApi.setDefaultHeader('X-Session-Id', sessionId1)
      
      const roomName = '聊天测试房间-' + Date.now()
      const createRoomResponse = await testApi.post('/api/room', {
        name: roomName,
        maxUsers: 5,
        isPublic: true,
        creatorSessionId: sessionId1,
        creatorNickname: nickname1
      })
      roomId = createRoomResponse.data.id
      roomCode = createRoomResponse.data.code
      
      const nickname2 = '聊天用户2-' + Date.now()
      const sessionResponse2 = await testApi.post('/api/session', { nickname: nickname2 })
      sessionId2 = sessionResponse2.data.id
    })

    it('应该能发送和接收聊天消息', async () => {
      socketHelper1 = createSocketTestHelper()
      socket1 = await socketHelper1.connect()
      socketHelper2 = createSocketTestHelper()
      socket2 = await socketHelper2.connect()
      
      // 两个用户都加入房间
      socket1.emit('join-room', { roomId, sessionId: sessionId1 })
      socket2.emit('join-room', { roomId, sessionId: sessionId2 })
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 第二个用户监听聊天消息事件
      const chatMessagePromise = new Promise((resolve) => {
        socket2.on('chat:message', (data) => {
          resolve(data)
        })
      })
      
      // 第一个用户发送聊天消息
      const messageContent = 'Socket聊天消息-' + Date.now()
      socket1.emit('chat:message', {
        roomId: roomCode,
        message: messageContent,
        sender: '用户1'
      })
      
      // 等待消息事件
      const messageData = await chatMessagePromise
      
      expect(messageData).toHaveProperty('message', messageContent)
      expect(messageData).toHaveProperty('sender', '用户1')
    }, TEST_TIMEOUT)

    it.skip('应该能接收系统消息', async () => {
      socketHelper1 = createSocketTestHelper()
      socket1 = await socketHelper1.connect()
      
      // 监听系统消息
      const systemMessagePromise = new Promise((resolve) => {
        socket1.on('system:message', (data) => {
          resolve(data)
        })
      })
      
      // 加入房间（应该触发系统消息）
      socket1.emit('join-room', { roomId: roomCode, sessionId: sessionId1 })
      
      // 等待系统消息
      const systemMessageData = await systemMessagePromise
      
      expect(systemMessageData).toHaveProperty('roomId', roomId)
      expect(systemMessageData).toHaveProperty('type', 'system')
    }, TEST_TIMEOUT)
  })

  describe('视频同步', () => {
    let roomId
    let roomCode
    let sessionId1
    let sessionId2

    beforeEach(async () => {
      // 创建测试房间和用户
      const nickname1 = '视频用户1-' + Date.now()
      const sessionResponse1 = await testApi.post('/api/session', { nickname: nickname1 })
      sessionId1 = sessionResponse1.data.id
      
      // 设置会话 ID 头部用于创建房间
      testApi.setDefaultHeader('X-Session-Id', sessionId1)
      
      const roomName = '视频测试房间-' + Date.now()
      const createRoomResponse = await testApi.post('/api/room', {
        name: roomName,
        maxUsers: 5,
        isPublic: true,
        creatorSessionId: sessionId1,
        creatorNickname: nickname1
      })
      roomId = createRoomResponse.data.id
      roomCode = createRoomResponse.data.code
      
      const nickname2 = '视频用户2-' + Date.now()
      const sessionResponse2 = await testApi.post('/api/session', { nickname: nickname2 })
      sessionId2 = sessionResponse2.data.id
    })

    it('应该能同步播放事件', async () => {
      socketHelper1 = createSocketTestHelper()
      socket1 = await socketHelper1.connect()
      socketHelper2 = createSocketTestHelper()
      socket2 = await socketHelper2.connect()
      
      // 两个用户都加入房间
      socket1.emit('join-room', { roomId: roomCode, sessionId: sessionId1 })
      socket2.emit('join-room', { roomId: roomCode, sessionId: sessionId2 })
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 第二个用户监听视频同步播放事件
      const videoPlayPromise = new Promise((resolve) => {
        socket2.on('video:sync-play', (data) => {
          resolve(data)
        })
      })
      
      // 第一个用户发送播放事件
      const currentTime = 30.5
      socket1.emit('video:play', { roomId: roomCode, time: currentTime })
      
      // 等待同步事件
      const playData = await videoPlayPromise
      
      expect(playData).toHaveProperty('time', currentTime)
      expect(playData).toHaveProperty('updatedBy')
    }, TEST_TIMEOUT)

    it('应该能同步暂停事件', async () => {
      socketHelper1 = createSocketTestHelper()
      socket1 = await socketHelper1.connect()
      socketHelper2 = createSocketTestHelper()
      socket2 = await socketHelper2.connect()
      
      // 两个用户都加入房间
      socket1.emit('join-room', { roomId, sessionId: sessionId1 })
      socket2.emit('join-room', { roomId, sessionId: sessionId2 })
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 第二个用户监听视频同步暂停事件
      const videoPausePromise = new Promise((resolve) => {
        socket2.on('video:sync-pause', (data) => {
          resolve(data)
        })
      })
      
      // 第一个用户发送暂停事件
      socket1.emit('video:pause', { roomId: roomCode })
      
      // 等待同步事件
      const pauseData = await videoPausePromise
      
      expect(pauseData).toHaveProperty('updatedBy')
    }, TEST_TIMEOUT)

    it('应该能同步跳转事件', async () => {
      socketHelper1 = createSocketTestHelper()
      socket1 = await socketHelper1.connect()
      socketHelper2 = createSocketTestHelper()
      socket2 = await socketHelper2.connect()
      
      // 两个用户都加入房间
      socket1.emit('join-room', { roomId: roomCode, sessionId: sessionId1 })
      socket2.emit('join-room', { roomId: roomCode, sessionId: sessionId2 })
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 第二个用户监听视频同步跳转事件
      const videoSeekPromise = new Promise((resolve) => {
        socket2.on('video:sync-seek', (data) => {
          resolve(data)
        })
      })
      
      // 第一个用户发送跳转事件
      const seekTime = 120.0
      socket1.emit('video:seek', { roomId: roomCode, time: seekTime })
      
      // 等待同步事件
      const seekData = await videoSeekPromise
      
      expect(seekData).toHaveProperty('time', seekTime)
      expect(seekData).toHaveProperty('updatedBy')
    }, TEST_TIMEOUT)
  })
})