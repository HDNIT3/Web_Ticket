import { requestJson } from './api.client.js'

export const pointApi = {
  // Kiểm tra điểm có thể dùng (dùng ở trang thanh toán)
  getBalance: () => requestJson('/points/balance'),

  // User tự xem điểm + lịch sử của mình
  getMyPoints: () => requestJson('/points/my'),

  // Admin: danh sách tất cả user kèm điểm
  getAllUsersPoints: (params = {}) => {
    const query = new URLSearchParams()
    if (params.page) query.append('page', params.page)
    if (params.limit) query.append('limit', params.limit)
    if (params.q) query.append('q', params.q)
    const queryString = query.toString() ? `?${query.toString()}` : ''
    return requestJson(`/points/admin/users${queryString}`)
  },

  // Admin: chi tiết lịch sử điểm của một user
  getUserPointsById: (userId) => requestJson(`/points/admin/users/${userId}`)
}
