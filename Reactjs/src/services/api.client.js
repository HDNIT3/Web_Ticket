import { buildApiUrl } from '../util/api.js'

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
}

let refreshSessionPromise = null

function isAuthPath(path) {
  return path.startsWith('/auth/')
}

function notifyAuthExpired() {
  window.dispatchEvent(new Event('movie-app:auth-expired'))
}

function notifySessionUpdated(sessionUser) {
  window.dispatchEvent(new CustomEvent('movie-app:session-updated', { detail: sessionUser }))
}

async function refreshAccessToken() {
  if (!refreshSessionPromise) {
    refreshSessionPromise = fetch(buildApiUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers: DEFAULT_HEADERS,
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null)

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || 'Refresh token không còn hợp lệ.')
        }

        return payload.data
      })
      .finally(() => {
        refreshSessionPromise = null
      })
  }

  return refreshSessionPromise
}

async function performRequest(path, options = {}) {
  return fetch(buildApiUrl(path), {
    ...options,
    credentials: 'include',
    headers: {
      ...DEFAULT_HEADERS,
      ...(options.headers || {}),
    },
  })
}

export async function request(path, options = {}) {
  const response = await performRequest(path, options)

  if (response.status !== 401 || isAuthPath(path)) {
    return response
  }

  try {
    const sessionUser = await refreshAccessToken()
    if (sessionUser) {
      notifySessionUpdated(sessionUser)
    }
  } catch {
    notifyAuthExpired()
    return response
  }

  return performRequest(path, options)
}

export async function requestJson(path, options = {}) {
  const response = await request(path, options)
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
  }

  return payload.data
}

export async function requestWithRefresh(path, options = {}, refreshHandler) {
  if (typeof refreshHandler === 'function' && !isAuthPath(path)) {
    const response = await performRequest(path, options)

    if (response.status !== 401) {
      return response
    }

    try {
      await refreshHandler()
    } catch {
      notifyAuthExpired()
      return response
    }

    return performRequest(path, options)
  }

  return request(path, options)
}