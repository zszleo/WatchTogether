import { describe, it, expect, beforeEach, vi } from 'vitest'
import { request } from '@/utils/request'

// 设置测试环境变量
import.meta.env.VITE_API_BASE_URL = 'http://localhost:18080'

// 模拟 fetch
global.fetch = vi.fn()

describe('Request Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: {} })
    })
  })

  describe('基础请求', () => {
    it('应该发送 GET 请求', async () => {
      await request('/api/test')
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('应该发送 POST 请求', async () => {
      const data = { name: '测试' }
      
      await request('/api/test', { method: 'POST', data })
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data)
        })
      )
    })

    it('应该发送 PUT 请求', async () => {
      const data = { name: '更新' }
      
      await request('/api/test', { method: 'PUT', data })
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(data)
        })
      )
    })

    it('应该发送 DELETE 请求', async () => {
      await request('/api/test', { method: 'DELETE' })
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })
  })

  describe('查询参数', () => {
    it('应该添加查询参数', async () => {
      const params = { page: 1, size: 10 }
      
      await request('/api/test', { params })
      
      const callUrl = fetch.mock.calls[0][0]
      expect(callUrl).toContain('page=1')
      expect(callUrl).toContain('size=10')
    })

    it('应该忽略 undefined 和 null 参数', async () => {
      const params = {
        page: 1,
        size: undefined,
        filter: null,
        sort: 'asc'
      }
      
      await request('/api/test', { params })
      
      const callUrl = fetch.mock.calls[0][0]
      expect(callUrl).toContain('page=1')
      expect(callUrl).toContain('sort=asc')
      expect(callUrl).not.toContain('size')
      expect(callUrl).not.toContain('filter')
    })

    it('应该支持 allowedParams 过滤', async () => {
      const params = { page: 1, size: 10, invalid: 'test' }
      
      await request('/api/test', {
        params,
        allowedParams: ['page', 'size']
      })
      
      const callUrl = fetch.mock.calls[0][0]
      expect(callUrl).toContain('page=1')
      expect(callUrl).toContain('size=10')
      expect(callUrl).not.toContain('invalid')
    })

    it('应该在严格模式下抛出未定义参数错误', async () => {
      const params = { page: 1, invalid: 'test' }
      const paramDefinitions = {
        page: { type: 'integer', required: false }
      }
      
      await expect(
        request('/api/test', {
          params,
          strictMode: true,
          paramDefinitions
        })
      ).rejects.toThrow('参数验证失败：未定义的参数 "invalid"')
    })

    it('应该在严格模式下允许已定义参数', async () => {
      const params = { page: 1, size: 10 }
      const paramDefinitions = {
        page: { type: 'integer', required: false },
        size: { type: 'integer', required: false }
      }
      
      await request('/api/test', {
        params,
        strictMode: true,
        paramDefinitions
      })
      
      const callUrl = fetch.mock.calls[0][0]
      expect(callUrl).toContain('page=1')
      expect(callUrl).toContain('size=10')
    })
  })

  describe('请求头', () => {
    it('应该设置默认 Content-Type', async () => {
      await request('/api/test')
      
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('应该支持自定义请求头', async () => {
      const customHeaders = {
        'Authorization': 'Bearer token123',
        'X-Custom-Header': 'custom-value'
      }
      
      await request('/api/test', { headers: customHeaders })
      
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token123',
            'X-Custom-Header': 'custom-value'
          })
        })
      )
    })

    it('应该允许覆盖默认请求头', async () => {
      const headers = {
        'Content-Type': 'application/xml'
      }
      
      await request('/api/test', { headers })
      
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/xml'
          })
        })
      )
    })
  })

  describe('请求拦截器', () => {
    it('应该应用请求拦截器', async () => {
      const requestInterceptor = vi.fn((config) => ({
        ...config,
        headers: {
          ...config.headers,
          'X-Intercepted': 'true'
        }
      }))
      
      await request('/api/test', { requestInterceptor })
      
      expect(requestInterceptor).toHaveBeenCalled()
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Intercepted': 'true'
          })
        })
      )
    })

    it('应该允许拦截器修改 URL', async () => {
      const requestInterceptor = (config) => ({
        ...config,
        url: config.url.replace('/api/test', '/api/modified')
      })
      
      await request('/api/test', { requestInterceptor })
      
      const callUrl = fetch.mock.calls[0][0]
      expect(callUrl).toContain('/api/modified')
    })

    it('应该允许拦截器修改方法', async () => {
      const requestInterceptor = (config) => ({
        ...config,
        method: 'PATCH'
      })
      
      await request('/api/test', { method: 'POST', requestInterceptor })
      
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PATCH'
        })
      )
    })
  })

  describe('响应拦截器', () => {
    it('应该应用响应拦截器', async () => {
      const responseData = { success: true, data: { id: 1 } }
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseData)
      })
      
      const responseInterceptor = vi.fn((data) => ({
        ...data,
        intercepted: true
      }))
      
      const result = await request('/api/test', { responseInterceptor })
      
      expect(responseInterceptor).toHaveBeenCalledWith(responseData)
      expect(result.intercepted).toBe(true)
    })
  })

  describe('错误处理', () => {
    it('应该抛出 HTTP 错误', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })
      
      await expect(request('/api/test')).rejects.toThrow('HTTP 404: Not Found')
    })

    it('应该抛出网络错误', async () => {
      fetch.mockRejectedValue(new Error('Network Error'))
      
      await expect(request('/api/test')).rejects.toThrow('Network Error')
    })

    it('应该抛出 JSON 解析错误', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      })
      
      await expect(request('/api/test')).rejects.toThrow('Invalid JSON')
    })
  })

  describe('URL 构建', () => {
    it('应该使用基础 URL', async () => {
      // 模拟环境变量
      import.meta.env.VITE_API_BASE_URL = 'http://localhost:18080'
      
      await request('/api/test')
      
      const callUrl = fetch.mock.calls[0][0]
      expect(callUrl).toContain('http://localhost:18080')
    })

    it('应该正确拼接路径', async () => {
      await request('/api/users/123')
      
      const callUrl = fetch.mock.calls[0][0]
      expect(callUrl).toContain('/api/users/123')
    })
  })
})