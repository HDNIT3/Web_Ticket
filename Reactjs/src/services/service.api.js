import { requestJson } from './api.client.js'

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || typeof value === 'undefined' || value === '') {
      return
    }

    searchParams.set(key, `${value}`)
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

export function getServices(params = {}) {
  return requestJson(`/services${buildQuery(params)}`, { method: 'GET' })
}

export function getServiceById(id) {
  return requestJson(`/services/${id}`, { method: 'GET' })
}

export function createService(payload) {
  return requestJson('/services', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateService(id, payload) {
  return requestJson(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteService(id) {
  return requestJson(`/services/${id}`, { method: 'DELETE' })
}

