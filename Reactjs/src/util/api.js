const AUTH_STORAGE_KEY = 'movie_app_user'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`
}

export function readStoredUser() {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function writeStoredUser(user) {
  if (user) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

