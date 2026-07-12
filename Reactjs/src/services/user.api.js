import { requestJson } from './api.client.js'

export function getProfile() {
  return requestJson('/user/getProfile', { method: 'GET' })
}

export function updateProfile(payload) {
  return requestJson('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function getUsersByAdmin(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val)
    }
  })
  return requestJson(`/user/admin/list?${query.toString()}`, { method: 'GET' })
}

export function updateUserByAdmin(id, payload) {
  return requestJson(`/user/admin/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}