/**
 * TypeScript类型定义
 * 自动生成于: 2026-03-17T09:05:32.653Z
 */

// 模型类型定义

export interface Room {
  id?: string; // 
  name?: string; // 
  createdAt?: string; // 
}

export interface Error {
  code?: number; // 
  message?: string; // 
}


// API函数类型定义

export function getRooms(params: { queryParams: { page?: number, size?: number } }): Promise<{ items?: Array<any>; total?: number }>;

export function createRoom(data: { name: string; description?: string }): Promise<{ id?: string; name?: string }>;

export function getRoomById(params: { pathParams: { id: string } }): Promise<{ id?: string; name?: string }>;