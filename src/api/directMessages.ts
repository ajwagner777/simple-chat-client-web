import client from './client'
import type { Message, PaginatedResponse } from '../types'

export const directMessagesApi = {
  conversation(userId: number, page = 1) {
    return client.get<PaginatedResponse<Message>>(`/direct-messages/${userId}`, { params: { page } })
  },
  send(userId: number, message: string) {
    return client.post<Message>(`/direct-messages/${userId}`, { message })
  },
}
