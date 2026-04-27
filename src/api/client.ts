import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const client = axios.create({ baseURL })

// Inject JWT on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<void> | null = null

// Refresh on 401, retry once
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(error)
      }
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${baseURL}/auth/refresh`, { refresh_token: refreshToken })
          .then((res) => {
            const { token, refresh_token } = res.data
            localStorage.setItem('access_token', token)
            localStorage.setItem('refresh_token', refresh_token)
          })
          .catch(() => {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            window.location.href = '/login'
          })
          .finally(() => {
            refreshPromise = null
          })
      }
      await refreshPromise
      original.headers.Authorization = `Bearer ${localStorage.getItem('access_token')}`
      return client(original)
    }
    return Promise.reject(error)
  },
)

export default client
