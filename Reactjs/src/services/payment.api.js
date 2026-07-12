import { requestJson } from './api.client.js'

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || typeof value === 'undefined' || value === '') return
    searchParams.set(key, `${value}`)
  })
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

export const paymentApi = {
  createPayment: (bookingId, method) => requestJson('/api/payment', {
    method: 'POST',
    body: JSON.stringify({ bookingId, method }),
  }),
}

export function getPayments(params = {}) {
  return requestJson(`/api/payment/list${buildQuery(params)}`, { method: 'GET' })
}

export function getPaymentById(id) {
  return requestJson(`/api/payment/list/${id}`, { method: 'GET' })
}
