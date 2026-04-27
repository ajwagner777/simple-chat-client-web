import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '../types'
import { authApi } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('access_token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'))
  const loading = ref(false)

  const isAuthenticated = () => !!accessToken.value

  function setTokens(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
  }

  function clearTokens() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const res = await authApi.login({ email, password })
      setTokens(res.data.token, res.data.refresh_token)
      await fetchMe()
    } finally {
      loading.value = false
    }
  }

  async function register(name: string, email: string, password: string, password_confirmation: string) {
    loading.value = true
    try {
      const res = await authApi.register({ name, email, password, password_confirmation })
      setTokens(res.data.token, res.data.refresh_token)
      await fetchMe()
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // best-effort
    } finally {
      clearTokens()
    }
  }

  async function fetchMe() {
    const res = await authApi.me()
    user.value = res.data
  }

  async function bootstrap() {
    if (!accessToken.value) return
    try {
      await fetchMe()
    } catch {
      clearTokens()
    }
  }

  return { user, accessToken, loading, isAuthenticated, login, register, logout, fetchMe, bootstrap, setTokens, clearTokens }
})
