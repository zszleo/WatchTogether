import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createTestPinia,
  wait,
  nextTick,
  delayedResponse,
  createMock,
  deepClone,
  randomString,
  randomNumber,
  randomEmail,
  randomUserId,
  randomRoomId,
  formatDate,
  isEmptyObject,
  safeJsonParse
} from '@/test/utils/testUtils'

describe('Test Utils', () => {
  describe('wait', () => {
    it('应该等待指定时间', async () => {
      const start = Date.now()
      await wait(100)
      const end = Date.now()
      
      expect(end - start).toBeGreaterThanOrEqual(90) // 允许一些误差
    })
  })

  describe('nextTick', () => {
    it('应该等待下一个 tick', async () => {
      let value = 0
      
      setTimeout(() => {
        value = 1
      }, 0)
      
      await nextTick()
      
      expect(value).toBe(1)
    })
  })

  describe('delayedResponse', () => {
    it('应该延迟返回数据', async () => {
      const data = { id: 1, name: '测试' }
      
      const start = Date.now()
      const result = await delayedResponse(data, 100)
      const end = Date.now()
      
      expect(result).toEqual(data)
      expect(end - start).toBeGreaterThanOrEqual(90)
    })

    it('应该使用默认延迟时间', async () => {
      const data = '测试数据'
      
      const start = Date.now()
      const result = await delayedResponse(data)
      const end = Date.now()
      
      expect(result).toBe(data)
      expect(end - start).toBeGreaterThanOrEqual(90)
    })
  })

  describe('createMock', () => {
    it('应该创建 mock 函数', async () => {
      const mock = createMock({ id: 1 })
      
      expect(typeof mock).toBe('function')
      expect(mock.mockResolvedValue).toBeDefined()
    })

    it('应该返回指定的值', async () => {
      const mock = createMock({ success: true })
      
      const result = await mock()
      
      expect(result).toEqual({ success: true })
    })
  })

  describe('deepClone', () => {
    it('应该深度克隆对象', () => {
      const original = {
        id: 1,
        name: '测试',
        nested: {
          value: '嵌套值',
          array: [1, 2, 3]
        }
      }
      
      const cloned = deepClone(original)
      
      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned.nested).not.toBe(original.nested)
      expect(cloned.nested.array).not.toBe(original.nested.array)
    })

    it('应该克隆数组', () => {
      const original = [1, { id: 2 }, [3, 4]]
      const cloned = deepClone(original)
      
      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned[1]).not.toBe(original[1])
    })

    it('应该处理 null 和 undefined', () => {
      expect(deepClone(null)).toBe(null)
      expect(deepClone(undefined)).toBe(undefined)
    })

    it('应该处理基本类型', () => {
      expect(deepClone(123)).toBe(123)
      expect(deepClone('字符串')).toBe('字符串')
      expect(deepClone(true)).toBe(true)
    })
  })

  describe('randomString', () => {
    it('应该生成指定长度的字符串', () => {
      const str = randomString(10)
      
      expect(typeof str).toBe('string')
      expect(str.length).toBe(10)
    })

    it('应该使用默认长度', () => {
      const str = randomString()
      
      expect(str.length).toBe(8)
    })

    it('应该生成不同的字符串', () => {
      const str1 = randomString(10)
      const str2 = randomString(10)
      
      expect(str1).not.toBe(str2)
    })
  })

  describe('randomNumber', () => {
    it('应该生成指定范围内的数字', () => {
      const num = randomNumber(1, 10)
      
      expect(num).toBeGreaterThanOrEqual(1)
      expect(num).toBeLessThanOrEqual(10)
      expect(Number.isInteger(num)).toBe(true)
    })

    it('应该使用默认范围', () => {
      const num = randomNumber()
      
      expect(num).toBeGreaterThanOrEqual(0)
      expect(num).toBeLessThanOrEqual(100)
    })
  })

  describe('randomEmail', () => {
    it('应该生成有效的邮箱格式', () => {
      const email = randomEmail()
      
      expect(email).toMatch(/^test_[a-zA-Z0-9]{5}@example\.com$/)
    })

    it('应该生成不同的邮箱', () => {
      const email1 = randomEmail()
      const email2 = randomEmail()
      
      expect(email1).not.toBe(email2)
    })
  })

  describe('randomUserId', () => {
    it('应该生成用户 ID 格式', () => {
      const userId = randomUserId()
      
      expect(userId).toMatch(/^user_[a-zA-Z0-9]{8}$/)
    })
  })

  describe('randomRoomId', () => {
    it('应该生成房间 ID 格式', () => {
      const roomId = randomRoomId()
      
      expect(roomId).toMatch(/^room_[a-zA-Z0-9]{10}$/)
    })
  })

  describe('formatDate', () => {
    it('应该格式化日期为 YYYY-MM-DD', () => {
      const date = new Date('2024-03-15T10:30:00Z')
      const formatted = formatDate(date)
      
      expect(formatted).toBe('2024-03-15')
    })

    it('应该补零', () => {
      const date = new Date('2024-01-05T10:30:00Z')
      const formatted = formatDate(date)
      
      expect(formatted).toBe('2024-01-05')
    })
  })

  describe('isEmptyObject', () => {
    it('应该检测空对象', () => {
      expect(isEmptyObject({})).toBe(true)
    })

    it('应该检测非空对象', () => {
      expect(isEmptyObject({ id: 1 })).toBe(false)
    })

    it('应该检测有属性的对象', () => {
      expect(isEmptyObject({ name: '测试', value: null })).toBe(false)
    })
  })

  describe('safeJsonParse', () => {
    it('应该解析有效的 JSON', () => {
      const json = '{"id": 1, "name": "测试"}'
      const result = safeJsonParse(json)
      
      expect(result).toEqual({ id: 1, name: '测试' })
    })

    it('应该处理无效的 JSON', () => {
      const invalidJson = '{invalid json}'
      const result = safeJsonParse(invalidJson)
      
      expect(result).toBeNull()
    })

    it('应该使用自定义默认值', () => {
      const invalidJson = 'invalid'
      const result = safeJsonParse(invalidJson, { default: true })
      
      expect(result).toEqual({ default: true })
    })

    it('应该处理 null 字符串', () => {
      const result = safeJsonParse('null')
      
      expect(result).toBeNull()
    })

    it('应该处理数组 JSON', () => {
      const json = '[1, 2, 3]'
      const result = safeJsonParse(json)
      
      expect(result).toEqual([1, 2, 3])
    })
  })
})