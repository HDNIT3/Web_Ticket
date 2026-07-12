import { requestJson } from './api.client.js'

export const showtimeApi = {
  getAll: (params) => {
    const qs = new URLSearchParams(params).toString()
    return requestJson(`/showtimes${qs ? `?${qs}` : ''}`)
  },
  getById: (id) => requestJson(`/showtimes/${id}`),
  create: (data) => requestJson('/showtimes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => requestJson(`/showtimes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => requestJson(`/showtimes/${id}`, {
    method: 'DELETE',
  }),
}
