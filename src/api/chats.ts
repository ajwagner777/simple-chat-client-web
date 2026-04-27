import client from './client'
import type { ChatOverview } from '../types'

export const chatsApi = {
  overview() {
    return client.get<ChatOverview>('/chats/overview')
  },
}
