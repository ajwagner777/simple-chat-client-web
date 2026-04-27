import client from './client'
import type { User } from '../types'

export const usersApi = {
  list() {
    return client.get<User[]>('/users')
  },
  get(id: number) {
    return client.get<User>(`/users/${id}`)
  },
  updateProfile(payload: { name?: string; location?: string }) {
    return client.put<{ message: string; user: User }>('/users/profile', payload)
  },
}
