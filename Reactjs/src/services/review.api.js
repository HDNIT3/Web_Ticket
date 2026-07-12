import { requestJson } from './api.client.js'

export const reviewApi = {
  createReview: (data) => requestJson('/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateReview: (reviewId, data) => requestJson(`/reviews/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteReview: (reviewId) => requestJson(`/reviews/${reviewId}`, {
    method: 'DELETE',
  }),
  getMyReviews: () => requestJson('/reviews/my'),
  getMovieReviews: (movieId, params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.rating) query.append('rating', params.rating);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return requestJson(`/reviews/movie/${movieId}${queryString}`);
  },
  getAdminReviews: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.rating) query.append('rating', params.rating);
    if (params.movieId) query.append('movieId', params.movieId);
    if (params.q) query.append('q', params.q);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return requestJson(`/reviews/admin${queryString}`);
  },
  getAdminStats: (params = {}) => {
    const query = new URLSearchParams();
    if (params.movieId) query.append('movieId', params.movieId);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return requestJson(`/reviews/admin/stats${queryString}`);
  }
}
