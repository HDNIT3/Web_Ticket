import { requestJson } from './api.client.js'

function buildMovieQuery({ title, q, status, isHot, genreId, ageRating, releaseYear, page, limit } = {}) {
  const searchParams = new URLSearchParams()

  if (title) {
    searchParams.set('title', title.trim())
  }

  if (q) {
    searchParams.set('q', q.trim())
  }

  if (status) {
    searchParams.set('status', status)
  }

  if (typeof isHot !== 'undefined') {
    searchParams.set('isHot', isHot ? 'true' : 'false')
  }

  if (typeof page !== 'undefined') {
    searchParams.set('page', `${page}`)
  }

  if (typeof limit !== 'undefined') {
    searchParams.set('limit', `${limit}`)
  }

  if (genreId) {
    searchParams.set('genreId', genreId)
  }

  if (ageRating) {
    searchParams.set('ageRating', ageRating)
  }

  if (typeof releaseYear !== 'undefined') {
    searchParams.set('releaseYear', `${releaseYear}`)
  }

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || typeof value === 'undefined' || value === '') {
      return
    }

    searchParams.set(key, value)
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

export function getMovies(params = {}) {
  return requestJson(`/movies${buildMovieQuery(params)}`, { method: 'GET' })
}

export function getMovieById(movieId) {
  return requestJson(`/movies/${movieId}`, { method: 'GET' })
}

export function getSimilarMovies(movieId, limit = 8) {
  return requestJson(`/movies/${movieId}/similar?limit=${limit}`, { method: 'GET' })
}

export function createMovie(payload) {
  return requestJson('/movies', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateMovie(movieId, payload) {
  return requestJson(`/movies/${movieId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteMovie(movieId) {
  return requestJson(`/movies/${movieId}`, { method: 'DELETE' })
}

export function getGenres() {
  return requestJson('/genres', { method: 'GET' })
}

export function createGenre(payload) {
  return requestJson('/genres', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateGenre(genreId, payload) {
  return requestJson(`/genres/${genreId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteGenre(genreId) {
  return requestJson(`/genres/${genreId}`, { method: 'DELETE' })
}


export function getShowtimes(params = {}) {
  return requestJson(`/showtimes${buildQuery(params)}`, { method: 'GET' })
}

export function getCinemasForMovie(movieId) {
  return Promise.resolve([])
}

export function createShowtime(payload) {
  return requestJson('/showtimes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateShowtime(id, payload) {
  return requestJson(`/showtimes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteShowtime(id) {
  return requestJson(`/showtimes/${id}`, { method: 'DELETE' })
}
