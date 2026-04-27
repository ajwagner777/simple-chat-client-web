import client from './client'
import type { ChatRoom, Message, PaginatedResponse } from '../types'

export const chatRoomsApi = {
  list() {
    return client.get<ChatRoom[]>('/chat-rooms')
  },
  get(id: number) {
    return client.get<ChatRoom>(`/chat-rooms/${id}`)
  },
  create(payload: { name: string; description?: string; is_private?: boolean; password?: string }) {
    return client.post<ChatRoom>('/chat-rooms', payload)
  },
  join(id: number, password?: string) {
    return client.post<{ message: string }>(`/chat-rooms/${id}/join`, password ? { password } : {})
  },
  leave(id: number) {
    return client.post<{ message: string }>(`/chat-rooms/${id}/leave`)
  },
  messages(id: number, page = 1) {
    return client.get<PaginatedResponse<Message>>(`/chat-rooms/${id}/messages`, { params: { page } })
  },
  sendMessage(id: number, message: string) {
    return client.post<Message>(`/chat-rooms/${id}/messages`, { message })
  },
}
