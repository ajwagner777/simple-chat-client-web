export interface User {
  id: number
  name: string
  email?: string
  location?: string | null
  created_at?: string
  updated_at?: string
}

export interface AuthTokens {
  token: string
  refresh_token: string
  token_type: string
  expires_in: number
  refresh_token_expires_in: number
}

export interface AuthResponse extends AuthTokens {
  user?: User
  message?: string
}

export interface ChatRoom {
  id: number
  name: string
  description?: string
  is_private: boolean
  owner_id?: number
  owner?: { id: number; name: string }
  users?: User[]
  users_count?: number
  created_at?: string
}

export interface Message {
  id: number
  message: string
  chat_room_id?: number
  user_id?: number
  recipient_id?: number
  user: User
  recipient?: User
  created_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  total: number
  per_page: number
  last_page?: number
}

export interface DirectMessageThread {
  participant: User
  last_message: Message | null
}

export interface ChatOverview {
  chat_rooms: ChatRoom[]
  active_direct_messages: DirectMessageThread[]
}

export type ActiveConversation =
  | { type: 'room'; room: ChatRoom }
  | { type: 'dm'; user: User }
