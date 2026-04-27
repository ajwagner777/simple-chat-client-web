import client from './client'
import type { AuthResponse, User } from '../types'

export const authApi = {
  register(payload: { name: string; email: string; password: string; password_confirmation: string }) {
    return client.post<AuthResponse>('/auth/register', payload)
  },
  login(payload: { email: string; password: string }) {
    return client.post<AuthResponse>('/auth/login', payload)
  },
  logout() {
    return client.post('/auth/logout')
  },
  me() {
    return client.get<User>('/auth/me')
  },
  refresh(refresh_token: string) {
    return client.post<AuthResponse>('/auth/refresh', { refresh_token })
  },
  forgotPassword(email: string) {
    return client.post('/auth/forgot-password', { email })
  },
  resetPassword(payload: { token: string; email: string; password: string; password_confirmation: string }) {
    return client.post('/auth/reset-password', payload)
  },
}
