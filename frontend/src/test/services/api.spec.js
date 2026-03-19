import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SessionApi, RoomApi, FileApi, EmojiApi, HealthApi } from '@/services/api'

// 模拟 request 函数
vi.mock('@/utils/request', () => ({
  request: vi.fn()
}))

describe('API Services', () => {
  let request

  beforeEach(async () => {
    vi.clearAllMocks()
    const requestModule = await import('@/utils/request')
    request = requestModule.request
    request.mockResolvedValue({ success: true, data: {} })
  })

  describe('SessionApi', () => {
    describe('createSession', () => {
      it('应该正确调用创建会话接口', async () => {
        const data = { nickname: '测试用户' }
        
        await SessionApi.createSession(data)
        
        expect(request).toHaveBeenCalledWith('/api/session', {
          method: 'POST',
          data
        })
      })

      it('应该支持自定义选项', async () => {
        const data = { nickname: '测试用户' }
        const options = { timeout: 5000 }
        
        await SessionApi.createSession(data, options)
        
        expect(request).toHaveBeenCalledWith('/api/session', {
          method: 'POST',
          data,
          timeout: 5000
        })
      })
    })

    describe('getSession', () => {
      it('应该正确调用获取会话接口', async () => {
        const sessionId = 'session_123'
        
        await SessionApi.getSession(sessionId)
        
        expect(request).toHaveBeenCalledWith('/api/session/session_123', {
          method: 'GET'
        })
      })
    })

    describe('updateProfile', () => {
      it('应该正确调用更新资料接口', async () => {
        const sessionId = 'session_123'
        const data = { nickname: '新昵称', avatar: 'avatar2.png' }
        
        await SessionApi.updateProfile(sessionId, data)
        
        expect(request).toHaveBeenCalledWith('/api/session/session_123/profile', {
          method: 'PUT',
          data
        })
      })
    })

    describe('deleteSession', () => {
      it('应该正确调用删除会话接口', async () => {
        const sessionId = 'session_123'
        
        await SessionApi.deleteSession(sessionId)
        
        expect(request).toHaveBeenCalledWith('/api/session/session_123', {
          method: 'DELETE'
        })
      })
    })

    describe('validateSession', () => {
      it('应该正确调用验证会话接口', async () => {
        const sessionId = 'session_123'
        
        await SessionApi.validateSession(sessionId)
        
        expect(request).toHaveBeenCalledWith('/api/session/session_123/validate', {
          method: 'GET'
        })
      })
    })

    describe('getHistory', () => {
      it('应该正确调用获取历史记录接口', async () => {
        const sessionId = 'session_123'
        const queryParams = { limit: 10 }
        
        await SessionApi.getHistory(sessionId, queryParams)
        
        expect(request).toHaveBeenCalledWith('/api/session/session_123/history', {
          method: 'GET',
          params: queryParams,
          paramDefinitions: expect.any(Object)
        })
      })
    })

    describe('joinRoom', () => {
      it('应该正确调用加入房间接口', async () => {
        const sessionId = 'session_123'
        const roomId = 456
        
        await SessionApi.joinRoom(sessionId, roomId)
        
        expect(request).toHaveBeenCalledWith('/api/session/session_123/history/join/456', {
          method: 'POST'
        })
      })
    })

    describe('leaveRoom', () => {
      it('应该正确调用离开房间接口', async () => {
        const sessionId = 'session_123'
        const historyId = 789
        
        await SessionApi.leaveRoom(sessionId, historyId)
        
        expect(request).toHaveBeenCalledWith('/api/session/session_123/history/789/leave', {
          method: 'POST'
        })
      })
    })
  })

  describe('RoomApi', () => {
    describe('getPublicRooms', () => {
      it('应该正确调用获取公开房间接口', async () => {
        await RoomApi.getPublicRooms()
        
        expect(request).toHaveBeenCalledWith('/api/room', {
          method: 'GET'
        })
      })
    })

    describe('createRoom', () => {
      it('应该正确调用创建房间接口', async () => {
        const data = {
          name: '测试房间',
          description: '测试描述',
          isPublic: true,
          sessionId: 'session_123'
        }
        
        await RoomApi.createRoom(data)
        
        expect(request).toHaveBeenCalledWith('/api/room', {
          method: 'POST',
          data
        })
      })
    })

    describe('getRoom', () => {
      it('应该正确调用获取房间详情接口', async () => {
        const roomId = 123
        const queryParams = { sessionId: 'session_123' }
        
        await RoomApi.getRoom(roomId, queryParams)
        
        expect(request).toHaveBeenCalledWith('/api/room/123', {
          method: 'GET',
          params: queryParams,
          paramDefinitions: expect.any(Object)
        })
      })
    })

    describe('deleteRoom', () => {
      it('应该正确调用删除房间接口', async () => {
        const roomId = 123
        const data = { sessionId: 'session_123' }
        
        await RoomApi.deleteRoom(roomId, data)
        
        expect(request).toHaveBeenCalledWith('/api/room/123', {
          method: 'DELETE',
          data
        })
      })
    })

    describe('getChatMessages', () => {
      it('应该正确调用获取聊天消息接口', async () => {
        const roomId = 123
        const queryParams = { page: 0, size: 20, sessionId: 'session_123' }
        
        await RoomApi.getChatMessages(roomId, queryParams)
        
        expect(request).toHaveBeenCalledWith('/api/room/123/messages', {
          method: 'GET',
          params: queryParams,
          paramDefinitions: expect.any(Object)
        })
      })
    })

    describe('getInviteLink', () => {
      it('应该正确调用获取邀请链接接口', async () => {
        const roomId = 123
        const queryParams = { sessionId: 'session_123' }
        
        await RoomApi.getInviteLink(roomId, queryParams)
        
        expect(request).toHaveBeenCalledWith('/api/room/123/invite', {
          method: 'GET',
          params: queryParams,
          paramDefinitions: expect.any(Object)
        })
      })
    })

    describe('getRoomByCode', () => {
      it('应该正确调用通过房间码获取房间接口', async () => {
        const roomCode = 'ABC123'
        const queryParams = { sessionId: 'session_123' }
        
        await RoomApi.getRoomByCode(roomCode, queryParams)
        
        expect(request).toHaveBeenCalledWith('/api/room/code/ABC123', {
          method: 'GET',
          params: queryParams,
          paramDefinitions: expect.any(Object)
        })
      })
    })
  })

  describe('FileApi', () => {
    describe('uploadFile', () => {
      it('应该正确调用上传文件接口', async () => {
        const queryParams = { type: 'video' }
        const data = new FormData()
        
        await FileApi.uploadFile(queryParams, data)
        
        expect(request).toHaveBeenCalledWith('/api/file/upload', {
          method: 'POST',
          params: queryParams,
          data,
          paramDefinitions: expect.any(Object)
        })
      })
    })

    describe('getFileInfo', () => {
      it('应该正确调用获取文件信息接口', async () => {
        const fileId = 'file_123'
        const queryParams = { sessionId: 'session_123' }
        
        await FileApi.getFileInfo(fileId, queryParams)
        
        expect(request).toHaveBeenCalledWith('/api/file/file_123', {
          method: 'GET',
          params: queryParams,
          paramDefinitions: expect.any(Object)
        })
      })
    })

    describe('deleteFile', () => {
      it('应该正确调用删除文件接口', async () => {
        const fileId = 'file_123'
        const data = { sessionId: 'session_123' }
        
        await FileApi.deleteFile(fileId, data)
        
        expect(request).toHaveBeenCalledWith('/api/file/file_123', {
          method: 'DELETE',
          data
        })
      })
    })
  })

  describe('EmojiApi', () => {
    describe('getDefaultEmojis', () => {
      it('应该正确调用获取默认表情接口', async () => {
        await EmojiApi.getDefaultEmojis()
        
        expect(request).toHaveBeenCalledWith('/api/emoji/default', {
          method: 'GET'
        })
      })
    })

    describe('getEmojisByNickname', () => {
      it('应该正确调用根据昵称获取表情接口', async () => {
        const nickname = '测试用户'
        
        await EmojiApi.getEmojisByNickname(nickname)
        
        expect(request).toHaveBeenCalledWith('/api/emoji/user/测试用户', {
          method: 'GET'
        })
      })
    })

    describe('addEmojiByNickname', () => {
      it('应该正确调用根据昵称添加表情接口', async () => {
        const nickname = '测试用户'
        const data = {
          name: '自定义表情',
          url: 'http://example.com/emoji.png'
        }
        
        await EmojiApi.addEmojiByNickname(nickname, data)
        
        expect(request).toHaveBeenCalledWith('/api/emoji/user/测试用户', {
          method: 'POST',
          data
        })
      })
    })

    describe('deleteEmojiByNickname', () => {
      it('应该正确调用根据昵称删除表情接口', async () => {
        const nickname = '测试用户'
        const emojiId = 123
        
        await EmojiApi.deleteEmojiByNickname(nickname, emojiId)
        
        expect(request).toHaveBeenCalledWith('/api/emoji/user/测试用户/123', {
          method: 'DELETE'
        })
      })
    })
  })

  describe('HealthApi', () => {
    describe('healthCheck', () => {
      it('应该正确调用健康检查接口', async () => {
        await HealthApi.healthCheck()
        
        expect(request).toHaveBeenCalledWith('/api/health', {
          method: 'GET'
        })
      })
    })

    describe('simpleHealth', () => {
      it('应该正确调用简单健康检查接口', async () => {
        await HealthApi.simpleHealth()
        
        expect(request).toHaveBeenCalledWith('/api/health/simple', {
          method: 'GET'
        })
      })
    })
  })
})