import { requestJson } from './api.client.js'

// Legacy exports (existing code uses these)
export async function getNotifications(params = {}) {
  const { page = 1, limit = 10 } = params;
  return requestJson(`/notifications?page=${page}&limit=${limit}`, { method: 'GET' });
}

export async function readNotification(id) {
  return requestJson(`/notifications/${id}/read`, { method: 'PUT' });
}

export async function readAllNotifications() {
  return requestJson('/notifications/read-all', { method: 'PUT' });
}

// New object-style API
export const notificationApi = {
  // User - broadcast notifications
  getUserNotifications: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return requestJson(`/notifications/user/list${q ? `?${q}` : ''}`, { method: 'GET' })
  },
  markBroadcastRead: (id) => requestJson(`/notifications/user/${id}/read`, { method: 'PATCH' }),

  // Admin – incoming notifications (booking/review)
  getAdminNotifications: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return requestJson(`/notifications/admin/list${q ? `?${q}` : ''}`, { method: 'GET' })
  },
  markAllAdminRead: () => requestJson('/notifications/admin/read-all', { method: 'PATCH' }),
  markOneAdminRead: (id) => requestJson(`/notifications/admin/${id}/read`, { method: 'PATCH' }),

  // Admin – broadcast to users
  getAdminBroadcasts: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return requestJson(`/notifications/admin/broadcasts${q ? `?${q}` : ''}`, { method: 'GET' })
  },
  createBroadcast: (data) => requestJson('/notifications/admin/broadcast', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateBroadcast: (id, data) => requestJson(`/notifications/admin/broadcast/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteBroadcast: (id) => requestJson(`/notifications/admin/broadcast/${id}`, {
    method: 'DELETE'
  }),
  searchUserByEmail: (email) => requestJson(`/notifications/admin/users/search?email=${encodeURIComponent(email)}`, { method: 'GET' })
}
