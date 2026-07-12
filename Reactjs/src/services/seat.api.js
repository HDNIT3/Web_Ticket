import { requestJson } from './api.client.js'

export const seatApi = {
  generateSeatsForAuditorium: (auditoriumId, data = {}) => requestJson(`/seats/generate/${auditoriumId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getAllSeats: () => requestJson('/seats'),
  getSeatsByAuditorium: (auditoriumId) => requestJson(`/seats/auditorium/${auditoriumId}`),
  getSeatsByShowtime: (showtimeId) => requestJson(`/seats/showtime/${showtimeId}`),
  getSeatById: (id) => requestJson(`/seats/${id}`),
  updateSeat: (id, data) => requestJson(`/seats/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteSeat: (id) => requestJson(`/seats/${id}`, {
    method: 'DELETE',
  }),
}
