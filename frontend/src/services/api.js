// frontend/src/services/api.js
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' // 从环境变量读取mock配置

// Mock请求函数
async function mockRequest(path, options = {}) {
  console.log(`[Mock] ${options.method || 'GET'} ${path}`, options.body ? JSON.parse(options.body) : null)
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // 根据路径返回不同的mock数据
  const pathParts = path.split('/').filter(p => p)
  
  try {
    // 房间相关API
    if (path === '/rooms' && options.method === 'POST') {
      const data = JSON.parse(options.body)
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()
      return {
        id: roomId,
        name: data.name || `房间 ${roomId}`,
        maxUsers: data.maxUsers || 5,
        isPublic: data.isPublic !== false,
        creatorSessionId: data.creatorSessionId || 'mock-session-123',
        creatorNickname: data.creatorNickname || '测试用户',
        userCount: 1,
        createdAt: new Date().toISOString(),
        inviteCode: roomId
      }
    }
    
    if (path === '/rooms') {
      // 公开房间列表
      return Array.from({ length: 5 }, (_, i) => ({
        id: `ROOM${i}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        name: i === 0 ? '电影夜' : i === 1 ? '游戏直播' : `房间 ${i + 1}`,
        maxUsers: [5, 8, 4, 6, 10][i],
        isPublic: true,
        creatorSessionId: `session-${i}`,
        creatorNickname: ['小明', '小红', '张三', '李四', '王五'][i],
        userCount: [2, 3, 1, 4, 2][i],
        createdAt: new Date(Date.now() - i * 3600000).toISOString()
      }))
    }
    
    if (pathParts[0] === 'rooms' && pathParts.length === 2 && !pathParts[1].includes('?')) {
      const roomId = pathParts[1]
      // 房间详情
      return {
        id: roomId,
        name: roomId === 'ABCDEF' ? '测试房间' : `房间 ${roomId}`,
        maxUsers: 5,
        isPublic: true,
        creatorSessionId: 'mock-session-123',
        creatorNickname: '房主',
        userCount: 3,
        createdAt: new Date().toISOString(),
        inviteCode: roomId,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        currentTime: 0,
        isPlaying: false
      }
    }
    
    if (pathParts[0] === 'rooms' && pathParts[2] === 'messages') {
      const roomId = pathParts[1]
      const page = new URLSearchParams(path.includes('?') ? path.split('?')[1] : '').get('page') || 1
      const size = new URLSearchParams(path.includes('?') ? path.split('?')[1] : '').get('size') || 50
      
      // 生成历史消息
      const messages = Array.from({ length: Math.min(20, size) }, (_, i) => {
        const isSystem = i % 5 === 0
        const senderIndex = i % 3
        return {
          id: `msg-${roomId}-${i}`,
          content: isSystem 
            ? ['小明加入了房间', '小红离开了房间', '视频已加载', '播放已同步'][i % 4]
            : ['你好！', '这个视频不错', '哈哈哈哈哈', '有人吗？', '一起看真有趣'][i % 5],
          messageType: isSystem ? 'system' : 'text',
          sessionId: isSystem ? null : `session-${senderIndex}`,
          senderNickname: isSystem ? '系统' : ['小明', '小红', '张三'][senderIndex],
          timestamp: new Date(Date.now() - (size - i) * 60000).toISOString(),
          createdAt: new Date(Date.now() - (size - i) * 60000).toISOString()
        }
      })
      
      return {
        messages,
        page: parseInt(page),
        size: parseInt(size),
        total: 50
      }
    }
    
    // 会话相关API
    if (path === '/sessions' && options.method === 'POST') {
      const data = JSON.parse(options.body)
      const sessionId = `session-${Math.random().toString(36).substring(2, 10)}`
      return {
        id: sessionId,
        nickname: data.nickname || `游客${Math.floor(Math.random() * 10000)}`,
        avatar: '👤',
        createdAt: new Date().toISOString()
      }
    }
    
    if (pathParts[0] === 'sessions' && pathParts.length === 2 && pathParts[1] !== 'rooms') {
      const sessionId = pathParts[1]
      return {
        id: sessionId,
        nickname: sessionId.includes('mock') ? '测试用户' : '用户',
        avatar: '😀',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    }
    
    if (pathParts[0] === 'sessions' && pathParts[2] === 'rooms') {
      const sessionId = pathParts[1]
      // 历史房间记录
      return {
        rooms: Array.from({ length: 3 }, (_, i) => ({
          roomId: `HIST${i}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          roomName: ['电影之夜', '游戏直播', '学习小组'][i],
          userCount: [3, 5, 2][i],
          joinedAt: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
          lastActivity: new Date(Date.now() - i * 3600000).toISOString()
        })),
        total: 3
      }
    }
    
    // 表情相关API
    if (path === '/emojis/categories') {
      return [
        { id: 'smileys', name: '表情', count: 12 },
        { id: 'people', name: '人物', count: 8 },
        { id: 'animals', name: '动物', count: 6 },
        { id: 'food', name: '食物', count: 5 }
      ]
    }
    
    if (pathParts[0] === 'emojis' && !path.includes('?')) {
      return Array.from({ length: 12 }, (_, i) => ({
        id: `emoji-${i}`,
        code: ['😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '🤔', '😎', '🥳', '😢', '😭'][i],
        name: ['笑脸', '大笑', '狂笑', '微笑', '爱心眼', '可爱', '飞吻', '思考', '酷', '庆祝', '哭', '大哭'][i],
        categoryId: i < 3 ? 'smileys' : i < 6 ? 'people' : i < 9 ? 'animals' : 'food'
      }))
    }
    
    if (path === '/emojis/my-emojis') {
      return Array.from({ length: 3 }, (_, i) => ({
        id: `my-emoji-${i}`,
        code: ['👍', '❤️', '🎉'][i],
        name: ['赞', '爱心', '庆祝'][i],
        uploadedAt: new Date(Date.now() - i * 86400000).toISOString()
      }))
    }
    
    if (path === '/emojis/favorites') {
      return Array.from({ length: 5 }, (_, i) => ({
        id: `fav-${i}`,
        emojiId: `emoji-${i * 2}`,
        emojiCode: ['😀', '😊', '😍', '😎', '🥳'][i],
        addedAt: new Date(Date.now() - i * 3600000).toISOString()
      }))
    }
    
    // 视频相关API
    if (path === '/videos/samples') {
      return [
        {
          id: 'sample1',
          name: 'Big Buck Bunny',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          duration: 596,
          thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg'
        },
        {
          id: 'sample2',
          name: 'Elephants Dream',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          duration: 653,
          thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg'
        }
      ]
    }
    
    // 默认返回空数据
    return {}
  } catch (error) {
    console.error('[Mock] Error:', error)
    throw new Error(`Mock请求失败: ${error.message}`)
  }
}

async function request(path, options = {}) {
  // 使用mock模式
  if (USE_MOCK) {
    return mockRequest(path, options)
  }
  
  // 真实请求
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || '请求失败')
  }
  
  return response.json()
}

// 房间 API
export const roomApi = {
  create(data) {
    return request('/rooms', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  
  list() {
    return request('/rooms')
  },
  
  get(roomId) {
    return request(`/rooms/${roomId}`)
  },
  
  delete(roomId) {
    return request(`/rooms/${roomId}`, { method: 'DELETE' })
  },
  
  getInvite(roomId) {
    return request(`/rooms/${roomId}/invite`)
  },
  
  getMessages(roomId, page = 1, size = 50) {
    return request(`/rooms/${roomId}/messages?page=${page}&size=${size}`)
  }
}

// 会话 API
export const sessionApi = {
  create(nickname) {
    return request('/sessions', {
      method: 'POST',
      body: JSON.stringify({ nickname })
    })
  },
  
  get(sessionId) {
    return request(`/sessions/${sessionId}`)
  },
  
  update(sessionId, data) {
    return request(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },
  
  getHistory(sessionId) {
    return request(`/sessions/${sessionId}/rooms`)
  }
}

// 表情 API
export const emojiApi = {
  getCategories() {
    return request('/emojis/categories')
  },
  
  list(categoryId) {
    const query = categoryId ? `?category_id=${categoryId}` : ''
    return request(`/emojis${query}`)
  },
  
  getMyEmojis() {
    return request('/emojis/my-emojis')
  },
  
  upload(file, displayName) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('display_name', displayName)
    
    return fetch(`${API_BASE}/emojis/upload`, {
      method: 'POST',
      body: formData
    }).then(r => r.json())
  },
  
  delete(emojiId) {
    return request(`/emojis/my-emojis/${emojiId}`, { method: 'DELETE' })
  },
  
  addFavorite(emojiId) {
    return request('/emojis/favorites', {
      method: 'POST',
      body: JSON.stringify({ emoji_id: emojiId })
    })
  },
  
  removeFavorite(favoriteId) {
    return request(`/emojis/favorites/${favoriteId}`, { method: 'DELETE' })
  },
  
  getFavorites() {
    return request('/emojis/favorites')
  }
}

// 视频 API
export const videoApi = {
  getSamples() {
    return request('/videos/samples')
  },
  
  upload(file) {
    const formData = new FormData()
    formData.append('file', file)
    
    return fetch(`${API_BASE}/videos/upload`, {
      method: 'POST',
      body: formData
    }).then(r => r.json())
  }
}