import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'

// 模拟 API 服务
vi.mock('@/services/api', () => ({
  SessionApi: {
    createSession: vi.fn(),
    updateProfile: vi.fn()
  }
}))

// 模拟 localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('User Store', () => {
  let userStore

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    userStore = useUserStore()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      expect(userStore.sessionId).toBeNull()
      expect(userStore.nickname).toBe('')
      expect(userStore.avatar).toBe('avatar1.png')
      expect(userStore.createdAt).toBeNull()
    })

    it('应该正确计算登录状态', () => {
      expect(userStore.isLoggedIn).toBe(false)
      
      userStore.sessionId = 'session_123'
      
      expect(userStore.isLoggedIn).toBe(true)
    })
  })

  describe('loadFromStorage', () => {
    it('应该从 localStorage 加载用户数据', () => {
      const storedData = {
        sessionId: 'session_123',
        nickname: '测试用户',
        avatar: 'avatar2.png',
        createdAt: '2024-01-01T10:00:00Z'
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData))
      
      userStore.loadFromStorage()
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('watchtogether_user')
      expect(userStore.sessionId).toBe('session_123')
      expect(userStore.nickname).toBe('测试用户')
      expect(userStore.avatar).toBe('avatar2.png')
      expect(userStore.createdAt).toBe('2024-01-01T10:00:00Z')
    })

    it('应该处理没有存储数据的情况', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      userStore.loadFromStorage()
      
      expect(userStore.sessionId).toBeNull()
      expect(userStore.nickname).toBe('')
      expect(userStore.avatar).toBe('avatar1.png')
      expect(userStore.createdAt).toBeNull()
    })

    it('应该处理无效的 JSON 数据', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')
      
      expect(() => userStore.loadFromStorage()).toThrow()
    })
  })

  describe('createSession', () => {
    it('应该创建新会话', async () => {
      const mockData = {
        id: 'session_123',
        nickname: '游客1234',
        avatar: 'avatar1.png',
        createdAt: '2024-01-01T10:00:00Z'
      }
      
      const { SessionApi } = await import('@/services/api')
      SessionApi.createSession.mockResolvedValue(mockData)
      
      const result = await userStore.createSession('游客1234')
      
      expect(SessionApi.createSession).toHaveBeenCalledWith({ nickname: '游客1234' })
      expect(userStore.sessionId).toBe('session_123')
      expect(userStore.nickname).toBe('游客1234')
      expect(userStore.avatar).toBe('avatar1.png')
      expect(userStore.createdAt).toBe('2024-01-01T10:00:00Z')
      expect(result).toEqual(mockData)
    })

    it('应该在没有昵称时生成随机昵称', async () => {
      const mockData = {
        id: 'session_123',
        nickname: '游客1234',
        avatar: 'avatar1.png',
        createdAt: '2024-01-01T10:00:00Z'
      }
      
      const { SessionApi } = await import('@/services/api')
      SessionApi.createSession.mockResolvedValue(mockData)
      
      await userStore.createSession()
      
      expect(SessionApi.createSession).toHaveBeenCalled()
      const callArg = SessionApi.createSession.mock.calls[0][0]
      expect(callArg.nickname).toMatch(/^游客\d{1,4}$/)
    })

    it('应该保存到 localStorage', async () => {
      const mockData = {
        id: 'session_123',
        nickname: '测试用户',
        avatar: 'avatar1.png',
        createdAt: '2024-01-01T10:00:00Z'
      }
      
      const { SessionApi } = await import('@/services/api')
      SessionApi.createSession.mockResolvedValue(mockData)
      
      await userStore.createSession('测试用户')
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'watchtogether_user',
        JSON.stringify({
          sessionId: 'session_123',
          nickname: '测试用户',
          avatar: 'avatar1.png',
          createdAt: '2024-01-01T10:00:00Z'
        })
      )
    })

    it('应该处理创建失败', async () => {
      const { SessionApi } = await import('@/services/api')
      SessionApi.createSession.mockRejectedValue(new Error('创建失败'))
      
      await expect(userStore.createSession('测试用户')).rejects.toThrow('创建失败')
    })
  })

  describe('updateProfile', () => {
    it('应该更新用户信息', async () => {
      userStore.sessionId = 'session_123'
      
      const mockUpdatedData = {
        nickname: '新昵称',
        avatar: 'avatar3.png'
      }
      
      const { SessionApi } = await import('@/services/api')
      SessionApi.updateProfile.mockResolvedValue(mockUpdatedData)
      
      await userStore.updateProfile({ nickname: '新昵称', avatar: 'avatar3.png' })
      
      expect(SessionApi.updateProfile).toHaveBeenCalledWith('session_123', {
        nickname: '新昵称',
        avatar: 'avatar3.png'
      })
      expect(userStore.nickname).toBe('新昵称')
      expect(userStore.avatar).toBe('avatar3.png')
    })

    it('应该保存更新后的数据到 localStorage', async () => {
      userStore.sessionId = 'session_123'
      userStore.createdAt = '2024-01-01T10:00:00Z'
      
      const mockUpdatedData = {
        nickname: '新昵称',
        avatar: 'avatar3.png'
      }
      
      const { SessionApi } = await import('@/services/api')
      SessionApi.updateProfile.mockResolvedValue(mockUpdatedData)
      
      await userStore.updateProfile({ nickname: '新昵称' })
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'watchtogether_user',
        JSON.stringify({
          sessionId: 'session_123',
          nickname: '新昵称',
          avatar: 'avatar3.png',
          createdAt: '2024-01-01T10:00:00Z'
        })
      )
    })

    it('应该在没有会话 ID 时跳过更新', async () => {
      userStore.sessionId = null
      
      await userStore.updateProfile({ nickname: '新昵称' })
      
      const { SessionApi } = await import('@/services/api')
      expect(SessionApi.updateProfile).not.toHaveBeenCalled()
    })

    it('应该处理更新失败', async () => {
      userStore.sessionId = 'session_123'
      
      const { SessionApi } = await import('@/services/api')
      SessionApi.updateProfile.mockRejectedValue(new Error('更新失败'))
      
      await expect(userStore.updateProfile({ nickname: '新昵称' })).rejects.toThrow('更新失败')
    })
  })

  describe('logout', () => {
    it('应该清除所有用户数据', () => {
      userStore.sessionId = 'session_123'
      userStore.nickname = '测试用户'
      userStore.avatar = 'avatar2.png'
      userStore.createdAt = '2024-01-01T10:00:00Z'
      
      userStore.logout()
      
      expect(userStore.sessionId).toBeNull()
      expect(userStore.nickname).toBe('')
      expect(userStore.avatar).toBe('avatar1.png')
      expect(userStore.createdAt).toBeNull()
    })

    it('应该从 localStorage 移除数据', () => {
      userStore.logout()
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('watchtogether_user')
    })

    it('应该在未登录时正常执行', () => {
      userStore.sessionId = null
      
      expect(() => userStore.logout()).not.toThrow()
    })
  })
})