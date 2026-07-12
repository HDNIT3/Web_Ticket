import { requestJson } from './api.client.js'

export const favoriteApi = {
  getMyFavorites: () => requestJson('/favorites', { method: 'GET' }),
  checkFavorite: (movieId) => requestJson(`/favorites/check/${movieId}`, { method: 'GET' }),
  addFavorite: (movieId) => requestJson(`/favorites/${movieId}`, { method: 'POST' }),
  removeFavorite: (movieId) => requestJson(`/favorites/${movieId}`, { method: 'DELETE' }),
}

