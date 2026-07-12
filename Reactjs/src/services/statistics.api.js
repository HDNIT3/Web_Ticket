import { requestJson } from './api.client.js'

export function getOverview() {
  return requestJson('/statistics/overview', { method: 'GET' })
}

export function getRevenue({ period, from, to } = {}) {
  const params = new URLSearchParams()
  if (period) params.set('period', period)
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()
  return requestJson(`/statistics/revenue${qs ? `?${qs}` : ''}`, { method: 'GET' })
}

export function getTickets({ period, from, to } = {}) {
  const params = new URLSearchParams()
  if (period) params.set('period', period)
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()
  return requestJson(`/statistics/tickets${qs ? `?${qs}` : ''}`, { method: 'GET' })
}

export function getUsers({ period, from, to } = {}) {
  const params = new URLSearchParams()
  if (period) params.set('period', period)
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()
  return requestJson(`/statistics/users${qs ? `?${qs}` : ''}`, { method: 'GET' })
}

export function getTopMoviesFavorite({ limit } = {}) {
  const params = new URLSearchParams()
  if (limit) params.set('limit', limit)
  const qs = params.toString()
  return requestJson(`/statistics/top-movies-favorite${qs ? `?${qs}` : ''}`, { method: 'GET' })
}

export function getTopMoviesTickets({ limit, from, to } = {}) {
  const params = new URLSearchParams()
  if (limit) params.set('limit', limit)
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()
  return requestJson(`/statistics/top-movies-tickets${qs ? `?${qs}` : ''}`, { method: 'GET' })
}
