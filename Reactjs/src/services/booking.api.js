import { requestJson } from './api.client.js'

export const bookingApi = {
  createBooking: (data) => requestJson('/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  validatePromoCode: (data) => requestJson('/promotions/validate', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  payBooking: (bookingId, data = {}) => requestJson(`/bookings/${bookingId}/pay`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  cancelBooking: (bookingId) => requestJson(`/bookings/${bookingId}/cancel`, {
    method: 'POST',
  }),
  refundBooking: (bookingId) => requestJson(`/bookings/${bookingId}/refund`, {
    method: 'POST',
  }),
  getBookingDetails: (bookingId) => requestJson(`/bookings/${bookingId}`),
  getMyBookings: () => requestJson('/bookings/my'),
  getWatchHistory: () => requestJson('/bookings/watch-history'),
  getAllBookings: () => requestJson('/bookings/all'),
  getStaffActivity: () => requestJson('/bookings/staff-activity'),
  verifyTicket: (qrData) => requestJson('/bookings/verify-ticket', {
    method: 'POST',
    body: JSON.stringify({ qrData }),
  }),
}
