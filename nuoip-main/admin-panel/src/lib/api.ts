import axios, { AxiosHeaders } from 'axios'

const rawBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_GATEWAY_URL ??
  'http://localhost:3001/api/v1'

const normalizedBase = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

export const API_BASE_URL = normalizedBase

const ADMIN_TOKEN_KEY = 'admin_token'
const SESSION_EXPIRED_EVENT = 'admin:session-expired'

export const getAdminToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null
  }
  return window.localStorage.getItem(ADMIN_TOKEN_KEY)
}

export const setAdminToken = (token: string) => {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export const clearAdminToken = () => {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.removeItem(ADMIN_TOKEN_KEY)
}

export const dispatchSessionExpired = () => {
  if (typeof window === 'undefined') {
    return
  }
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  const token = getAdminToken()
  if (token) {
    const headers = config.headers instanceof AxiosHeaders ? config.headers : AxiosHeaders.from(config.headers ?? {})
    headers.set('Authorization', `Bearer ${token}`)
    config.headers = headers
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (status === 401 || status === 403) {
      clearAdminToken()
      dispatchSessionExpired()
    }
    return Promise.reject(error)
  },
)

export const isAuthError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error) || !error.response) {
    return false
  }
  return error.response.status === 401 || error.response.status === 403
}

export const apiUrl = (path: string): string => {
  const sanitized = path.startsWith('/') ? path.slice(1) : path
  return `${API_BASE_URL}/${sanitized}`
}

export const addSessionExpiredListener = (handler: () => void) => {
  if (typeof window === 'undefined') {
    return () => {}
  }
  window.addEventListener(SESSION_EXPIRED_EVENT, handler)
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler)
}
