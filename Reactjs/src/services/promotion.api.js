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

export function getPromotions(params = {}) {
  return requestJson(`/promotions${buildQuery(params)}`, { method: 'GET' })
}

export function getPromotionById(id) {
  return requestJson(`/promotions/${id}`, { method: 'GET' })
}

export function createPromotion(payload) {
  return requestJson('/promotions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePromotion(id, payload) {
  return requestJson(`/promotions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deletePromotion(id) {
  return requestJson(`/promotions/${id}`, { method: 'DELETE' })
}

