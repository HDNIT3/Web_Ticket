import { requestJson } from './api.client.js'

export const auditoriumApi = {
  getAll: (params) => {
    const qs = new URLSearchParams(params).toString()
    return requestJson(`/auditoriums${qs ? `?${qs}` : ''}`)
  },
  getById: (id) => requestJson(`/auditoriums/${id}`),
  create: (data) => requestJson('/auditoriums', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => requestJson(`/auditoriums/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => requestJson(`/auditoriums/${id}`, {
    method: 'DELETE',
  }),
}
