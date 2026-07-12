import { useEffect, useState } from 'react'
import { bookingApi } from '../services/booking.api.js'
import { paymentApi } from '../services/payment.api.js'
import { reviewApi } from '../services/review.api.js'
import ReviewModal from '../components/layout/ReviewModal.jsx'

function formatPrice(amount) {
  if (!amount && amount !== 0) return '0đ'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatDateTime(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatTimeOnly(value) {
  if (!value) return '--:--'
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatDateOnly(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export default function MyTicketsPage({ onNavigate }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [myReviews, setMyReviews] = useState([])
  const [reviewBookingId, setReviewBookingId] = useState('')
  const [selectedReview, setSelectedReview] = useState(null)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [deleteReviewId, setDeleteReviewId] = useState(null)

  // Navigation tabs: 'ACTIVE' (Paid), 'HISTORY' (Expired/Cancelled/Refunded)
  const [activeTab, setActiveTab] = useState('ACTIVE')

  // Filter and Pagination states
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  // Selected booking for QR codes modal
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [cancelBookingConfirm, setCancelBookingConfirm] = useState(null)

  const [actionLoading, setActionLoading] = useState(false)
  const [toasts, setToasts] = useState([])

  const showToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await bookingApi.getMyBookings()
      if (Array.isArray(res)) {
        setBookings(res)
      } else {
        setBookings([])
      }
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải lịch sử đặt vé.')
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const res = await reviewApi.getMyReviews()
      if (res && res.success && Array.isArray(res.data)) {
        setMyReviews(res.data)
      } else if (Array.isArray(res)) {
        setMyReviews(res)
      }
    } catch (err) {
      console.error('Error fetching reviews:', err)
    }
  }

  const handleOpenReviewModal = (bookingId, existingReview = null) => {
    setReviewBookingId(bookingId)
    setSelectedReview(existingReview)
    setIsReviewOpen(true)
  }

  const handleDeleteReview = (reviewId) => {
    setDeleteReviewId(reviewId)
  }

  const confirmDeleteReview = async () => {
    if (!deleteReviewId) return
    const id = deleteReviewId
    setDeleteReviewId(null)
    try {
      setActionLoading(true)
      await reviewApi.deleteReview(id)
      showToast('Xóa đánh giá thành công!', 'success')
      fetchReviews()
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa đánh giá.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const canReview = (booking) => {
    if (booking.status !== 'PAID') return false
    const startTime = new Date(booking.showtime?.startTime).getTime()
    const duration = booking.showtime?.movie?.durationMinutes || 120
    const endTime = startTime + (duration + 15) * 60 * 1000
    if (Date.now() < endTime) return false
    const hasCheckedInTicket = booking.tickets?.some((t) => t.status === 'CHECKED_IN')
    return !!hasCheckedInTicket
  }

  const reviewedBookingMap = {}
  myReviews.forEach((review) => {
    if (review.booking) {
      reviewedBookingMap[review.booking] = review
    }
  })

  useEffect(() => {
    fetchBookings()
    fetchReviews()
  }, [])

  // Live checker to determine if booking hold is expired (10 minutes elapsed)
  const getEffectiveStatus = (booking) => {
    if (booking.status !== 'PENDING') return booking.status
    const createdTime = new Date(booking.createdAt).getTime()
    const elapsedSeconds = Math.floor((Date.now() - createdTime) / 1000)
    return elapsedSeconds >= 600 ? 'EXPIRED' : 'PENDING'
  }

  // Get remaining time text for pending booking hold
  const getRemainingHoldText = (booking) => {
    const createdTime = new Date(booking.createdAt).getTime()
    const elapsedSeconds = Math.floor((Date.now() - createdTime) / 1000)
    const remaining = 600 - elapsedSeconds
    if (remaining <= 0) return 'Đã hết hạn'
    const minutes = Math.floor(remaining / 60)
    const seconds = remaining % 60
    return `Còn lại ${minutes}:${String(seconds).padStart(2, '0')}`
  }

  // Trigger custom confirmation modal for pending bookings
  const triggerCancelBooking = (booking) => {
    setCancelBookingConfirm({
      id: booking._id,
      type: 'CANCEL',
      movieTitle: booking.showtime?.movie?.title || 'Phim',
      seats: booking.tickets?.map((t) => t.seat?.name).join(', ') || '',
      totalAmount: booking.totalAmount
    })
  }

  // Trigger custom confirmation modal for paid bookings (refund)
  const triggerRefundBooking = (booking) => {
    setCancelBookingConfirm({
      id: booking._id,
      type: 'REFUND',
      movieTitle: booking.showtime?.movie?.title || 'Phim',
      seats: booking.tickets?.map((t) => t.seat?.name).join(', ') || '',
      totalAmount: booking.totalAmount
    })
  }

  // Execute actual cancel/refund API call after user confirms
  const executeCancelOrRefund = async () => {
    if (!cancelBookingConfirm) return
    const { id, type } = cancelBookingConfirm
    setCancelBookingConfirm(null)

    try {
      setActionLoading(true)
      if (type === 'CANCEL') {
        await bookingApi.cancelBooking(id)
        showToast('Hủy đơn đặt vé thành công!', 'success')
      } else {
        await bookingApi.refundBooking(id)
        showToast('Hủy vé & hoàn tiền thành công! Ghế ngồi của bạn đã được giải phóng.', 'success')
      }
      fetchBookings()
    } catch (err) {
      showToast(err.message || 'Có lỗi xảy ra khi thực hiện thao tác.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Redirect to real gateway checkout portal for pending tickets in history
  const handlePayBooking = async (booking) => {
    try {
      setActionLoading(true)
      const method = booking.tickets?.[0]?.booking?.paymentMethod || 'VNPAY'
      const payRes = await paymentApi.createPayment(booking._id, method.toLowerCase())
      if (payRes && payRes.url) {
        window.location.href = payRes.url
      } else {
        showToast('Không lấy được URL thanh toán từ cổng.', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Lỗi xử lý thanh toán.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Filter bookings based on active navigation tab, movie search, and date filters
  const filteredBookings = bookings.filter((booking) => {
    const status = getEffectiveStatus(booking)

    // Tab filter
    let matchTab = false
    if (activeTab === 'ACTIVE') {
      matchTab = status === 'PAID'
    } else {
      matchTab = status === 'CANCELLED' || status === 'EXPIRED' || status === 'PENDING' || status === 'REFUNDED'
    }
    if (!matchTab) return false

    // Search query filter (movie title)
    const movieTitle = booking.showtime?.movie?.title || ''
    if (searchQuery.trim() && !movieTitle.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Date range filter
    if (dateFilter !== 'ALL') {
      const showtimeDate = new Date(booking.showtime?.startTime)
      const now = new Date()

      if (dateFilter === 'TODAY') {
        const isToday = showtimeDate.toDateString() === now.toDateString()
        if (!isToday) return false
      } else if (dateFilter === 'FUTURE') {
        if (showtimeDate < now) return false
      }
    }

    return true
  })

  // Pagination calculations (10 items per page)
  const totalPages = Math.ceil(filteredBookings.length / 10)
  const displayedBookings = filteredBookings.slice((currentPage - 1) * 10, currentPage * 10)

  return (
    <section className="container py-5 px-3 px-lg-4 text-light" style={{ minHeight: 'calc(100vh - 88px)', backgroundColor: '#030712' }}>

      {/* Page Header */}
      <div className="text-center mb-4 mt-2">
        <h3 className="fw-bold text-light text-uppercase tracking-wide mb-1" style={{ fontSize: '1.4rem' }}>
          🎟️ Vé Của Tôi
        </h3>
        <p className="text-white-50 text-xs mb-0">Quản lý vé xem phim, bắp nước và mã QR vào phòng chiếu</p>
      </div>

      {/* Tab Navigation */}
      <div className="row justify-content-center mb-4">
        <div className="col-12 col-md-10 col-lg-8">
          <div className="nav nav-pills nav-fill p-1 rounded-4 shadow-lg border border-secondary border-opacity-30" style={{ backgroundColor: '#0f172a' }}>
            <button
              type="button"
              className={`nav-link rounded-3 fw-bold py-2.5 ${activeTab === 'ACTIVE' ? 'active bg-danger text-white' : 'text-white-50 bg-transparent'}`}
              onClick={() => handleTabChange('ACTIVE')}
            >
              🎟️ Vé Đang Hoạt Động
            </button>
            <button
              type="button"
              className={`nav-link rounded-3 fw-bold py-2.5 ${activeTab === 'HISTORY' ? 'active bg-secondary text-white' : 'text-white-50 bg-transparent'}`}
              onClick={() => handleTabChange('HISTORY')}
            >
              📂 Lịch Sử Đặt Vé
            </button>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="row justify-content-center mb-4 animate-fade-in">
        <div className="col-12 col-md-10 col-lg-8">
          <div className="card p-3 border-0 rounded-4 shadow-lg text-light bg-dark" style={{ backgroundColor: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div className="row g-2">
              <div className="col-12 col-md-8">
                <div className="input-group">
                  <span className="input-group-text bg-black border-secondary border-opacity-20 text-white-50 rounded-start-3">🔍</span>
                  <input
                    type="text"
                    className="form-control bg-black text-light border-secondary border-opacity-20 rounded-end-3"
                    placeholder="Tìm kiếm theo tên phim..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    style={{ fontSize: '0.9rem', borderColor: 'rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>
              <div className="col-12 col-md-4">
                <select
                  className="form-select bg-black text-light border-secondary border-opacity-20 rounded-3"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  style={{ fontSize: '0.9rem', borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  <option value="ALL">Tất cả ngày</option>
                  <option value="TODAY">Hôm nay</option>
                  <option value="FUTURE">Suất chiếu sắp tới</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-white-50 mt-3">Đang tải danh sách vé của bạn...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger shadow-sm border-0 rounded-4 text-center p-4">
          <h5 className="fw-bold mb-2">Đã xảy ra lỗi</h5>
          <p className="mb-0">{error}</p>
          <button className="btn btn-outline-danger mt-3 px-4 rounded-3" onClick={fetchBookings}>
            Tải lại
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="card border-0 text-center p-5 rounded-4 shadow-lg mx-auto text-light bg-dark" style={{ maxWidth: '600px', backgroundColor: '#0f172a' }}>
          <span className="fs-1 d-block mb-3">🎬</span>
          <h5 className="fw-bold mb-2">Danh sách trống</h5>
          <p className="text-white-50 mb-4 small">
            {activeTab === 'ACTIVE'
              ? 'Bạn không có vé xem phim nào đang hoạt động. Hãy đặt vé ngay để thưởng thức bộ phim hay nhé!'
              : 'Lịch sử giao dịch của bạn hiện đang trống.'}
          </p>
          <button className="btn btn-danger px-4 rounded-3 py-2 fw-bold shadow-sm" onClick={() => onNavigate('/movies')}>
            Đặt vé xem phim ngay
          </button>
        </div>
      ) : (
        <div className="mx-auto px-1 animate-fade-in" style={{ maxWidth: '780px' }}>
          <div className="vstack gap-4">
            {displayedBookings.map((booking) => {
              const showtime = booking.showtime || {}
              const movie = showtime.movie || {}
              const status = getEffectiveStatus(booking)

              return (
                <div key={booking._id} className="w-100">
                  <div className="card border-0 text-light p-3 rounded-4 shadow-lg position-relative overflow-hidden bg-dark" style={{ backgroundColor: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.05)' }}>

                    {/* Side colored border stripe based on status */}
                    <div
                      className="position-absolute start-0 top-0 bottom-0"
                      style={{
                        width: '6px',
                        backgroundColor: status === 'PAID' ? '#198754' : status === 'PENDING' ? '#ffc107' : status === 'REFUNDED' ? '#0dcaf0' : '#6c757d'
                      }}
                    />

                    <div className="row g-3 align-items-center">
                      {/* Poster section */}
                      {movie.posterUrl && (
                        <div className="col-12 col-sm-3 text-center">
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="rounded object-fit-cover shadow-sm"
                            style={{ width: '90px', height: '130px', display: 'block', margin: '0 auto' }}
                          />
                        </div>
                      )}

                      {/* Booking metadata */}
                      <div className="col-12 col-sm-9">
                        <div className="d-flex flex-wrap justify-content-between align-items-start mb-2 gap-2">
                          <div>
                            <h5 className="fw-bold text-light mb-1 text-uppercase" style={{ fontSize: '1.05rem' }}>{movie.title || 'Phim'}</h5>
                            <span className="badge bg-black text-white-50 border border-secondary border-opacity-30 me-2" style={{ fontSize: '0.74rem' }}>🔞 {movie.ageRating || 'N/A'}</span>
                            <span className="badge bg-danger bg-opacity-10 text-danger fw-bold" style={{ fontSize: '0.74rem' }}>🎬 {showtime.auditorium?.name || 'Phòng chiếu'}</span>
                          </div>

                          {/* Dynamic Status Badges */}
                          <div>
                            {status === 'PAID' && <span className="badge bg-success px-2.5 py-1.5 rounded-pill fw-bold text-white text-xs">🎟️ ĐÃ MUA</span>}
                            {status === 'PENDING' && <span className="badge bg-warning text-dark px-2.5 py-1.5 rounded-pill fw-bold text-xs">⏳ GIỮ GHẾ</span>}
                            {status === 'CANCELLED' && <span className="badge bg-danger bg-opacity-10 text-danger px-2.5 py-1.5 rounded-pill fw-bold text-xs">❌ ĐÃ HỦY</span>}
                            {status === 'EXPIRED' && <span className="badge bg-secondary px-2.5 py-1.5 rounded-pill fw-bold text-white text-xs">⏰ HẾT HẠN</span>}
                            {status === 'REFUNDED' && <span className="badge bg-info bg-opacity-10 text-info px-2.5 py-1.5 rounded-pill fw-bold text-xs">↩️ ĐÃ HOÀN TIỀN</span>}
                          </div>
                        </div>

                        <div className="row g-2 text-white-50 small border-top border-secondary border-opacity-30 pt-2 mt-2" style={{ fontSize: '0.8rem' }}>
                          <div className="col-12 col-sm-6">
                            <p className="mb-1">⏰ Suất chiếu: <strong className="text-danger">{formatDateTime(showtime.startTime)}</strong></p>
                            <p className="mb-1">💺 Ghế đã chọn: <strong className="text-light">{booking.tickets?.map((t) => t.seat?.name).join(', ')}</strong></p>
                          </div>
                          <div className="col-12 col-sm-6">
                            {booking.bookingExtras?.length > 0 && (
                              <p className="mb-1">🍿 Dịch vụ: <strong className="text-light">{booking.bookingExtras.map((e) => `${e.service?.name} (x${e.quantity})`).join(', ')}</strong></p>
                            )}
                            <p className="mb-1">💵 Tổng thanh toán: <strong className="text-light">{formatPrice(booking.totalAmount)}</strong></p>
                          </div>
                        </div>

                        {/* CTA operations bar */}
                        <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-secondary border-opacity-30" style={{ fontSize: '0.8rem' }}>
                          <span className="small text-white-50 font-monospace">Đơn đặt: #{booking._id.toString().slice(-8).toUpperCase()}</span>

                          <div className="d-flex gap-2">
                            {status === 'PAID' && (
                              <div className="d-flex gap-2 align-items-center flex-wrap">
                                {new Date(showtime.startTime).getTime() - Date.now() >= 12 * 60 * 60 * 1000 && (
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm rounded-3 px-3 py-1.5 text-xs fw-bold"
                                    onClick={() => triggerRefundBooking(booking)}
                                    disabled={actionLoading}
                                  >
                                    ↩️ Hủy & Hoàn tiền
                                  </button>
                                )}
                                
                                {reviewedBookingMap[booking._id] ? (
                                  <div className="d-flex gap-1">
                                    <button
                                      type="button"
                                      className="btn btn-outline-warning btn-sm rounded-3 px-3 py-1.5 text-xs fw-bold"
                                      onClick={() => handleOpenReviewModal(booking._id, reviewedBookingMap[booking._id])}
                                    >
                                      ✏️ Sửa đánh giá
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-outline-secondary btn-sm rounded-3 px-2 py-1.5 text-xs"
                                      onClick={() => setDeleteReviewId(reviewedBookingMap[booking._id]._id)}
                                      disabled={actionLoading}
                                    >
                                      🗑️ Xóa
                                    </button>
                                  </div>
                                ) : (
                                  canReview(booking) && (
                                    <button
                                      type="button"
                                      className="btn btn-warning btn-sm rounded-3 px-3 py-1.5 text-xs fw-bold text-dark"
                                      onClick={() => handleOpenReviewModal(booking._id)}
                                    >
                                      ⭐ Đánh giá phim
                                    </button>
                                  )
                                )}

                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm rounded-3 px-3 py-1.5 text-xs fw-bold"
                                  onClick={() => setSelectedBooking(booking)}
                                >
                                  🔍 Xem mã Vé QR
                                </button>
                              </div>
                            )}
                            {status === 'PENDING' && (
                              <>
                                 <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm rounded-3 px-3 py-1.5 text-xs"
                                  onClick={() => triggerCancelBooking(booking)}
                                  disabled={actionLoading}
                                >
                                  Hủy đặt
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm rounded-3 px-3 py-1.5 text-xs fw-bold text-white d-flex align-items-center gap-2"
                                  onClick={() => handlePayBooking(booking)}
                                  disabled={actionLoading}
                                >
                                  💳 Thanh toán ({getRemainingHoldText(booking)})
                                </button>
                              </>
                            )}
                            {(status === 'CANCELLED' || status === 'EXPIRED' || status === 'REFUNDED') && (
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm rounded-3 px-3 py-1.5 text-xs"
                                onClick={() => onNavigate('/movies')}
                              >
                                Đặt lại suất khác
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center align-items-center gap-3 mt-5 pt-4 border-top border-secondary border-opacity-10">
              <button
                type="button"
                className="btn btn-outline-secondary rounded-3 px-3 py-1.5 fw-bold"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                ◀ Trang trước
              </button>
              <span className="text-white-50 small font-monospace">
                Trang <strong>{currentPage}</strong> / {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-outline-secondary rounded-3 px-3 py-1.5 fw-bold"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Trang sau ▶
              </button>
            </div>
          )}
        </div>
      )}
      {/* TICKET DETAILS INDIVIDUAL QR CODES MODAL DRAWER */}
      {selectedBooking && (
        <div
          className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center p-3"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(5px)',
            zIndex: 1050
          }}
        >
          <div
            className="card border-0 text-light p-4 rounded-4 shadow-2xl w-100 bg-dark"
            style={{
              maxWidth: '640px',
              maxHeight: '85vh',
              overflowY: 'auto',
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {/* Modal Header */}
            <div className="d-flex justify-content-between align-items-center border-bottom border-secondary border-opacity-30 pb-3 mb-3">
              <div>
                <h5 className="fw-bold text-light mb-0">🎟️ VÉ XEM PHIM CHI TIẾT</h5>
                <small className="text-white-50 small">Đơn hàng: #{selectedBooking._id}</small>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setSelectedBooking(null)}
              />
            </div>

            {/* Modal body */}
            <div className="py-2">
              <div className="bg-black border border-secondary border-opacity-30 p-3 rounded-3 mb-4 text-light">
                <h6 className="fw-bold text-danger text-uppercase mb-1">{selectedBooking.showtime?.movie?.title}</h6>
                <div className="row g-2 small text-white-50 mt-2">
                  <div className="col-6">
                    <p className="mb-0">🎬 Rạp: <strong>CinemaHCMUTE</strong></p>
                    <p className="mb-0">🍿 Phòng chiếu: <strong>{selectedBooking.showtime?.auditorium?.name}</strong></p>
                  </div>
                  <div className="col-6">
                    <p className="mb-0">📅 Suất chiếu: <strong className="text-danger">{formatTimeOnly(selectedBooking.showtime?.startTime)}</strong></p>
                    <p className="mb-0">📅 Ngày: <strong>{formatDateOnly(selectedBooking.showtime?.startTime)}</strong></p>
                  </div>
                </div>
              </div>

              <h6 className="fw-bold text-light text-center mb-3">DANH SÁCH MÃ QUÉT QR VÀO PHÒNG CHIẾU</h6>

              {/* Tickets grid inside modal */}
              <div className="vstack gap-3">
                {selectedBooking.tickets?.map((ticket, index) => {
                  const qrUrl = ticket.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticket._id}`;
                  return (
                    <div key={ticket._id} className="card bg-black border border-secondary border-opacity-50 shadow-md rounded-3 p-3 text-light text-start" style={{ backgroundColor: '#0f172a' }}>
                      <div className="row g-2 align-items-center">
                        <div className="col-8">
                          <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25 fw-bold mb-2">VÉ #${index + 1}</span>
                          <h6 className="fw-bold text-light mb-1">Ghế ngồi: {ticket.seat?.name}</h6>
                          <p className="text-white-50 small mb-1">Hạng vé: <strong>{ticket.seat?.seatType?.name || 'STANDARD'}</strong></p>
                          <small className="text-white-50 font-monospace" style={{ fontSize: '0.7rem' }}>Mã vé: {ticket._id}</small>
                        </div>

                        <div className="col-4 text-center">
                          <div className="bg-white p-1 border border-secondary rounded shadow-sm d-inline-block">
                            <img src={qrUrl} alt="QR Code" style={{ width: '100px', height: '100px', display: 'block' }} />
                          </div>
                          <span className="d-block text-white-50 small fw-bold mt-1" style={{ fontSize: '0.62rem' }}>QUÉT TẠI CỬA</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="d-flex justify-content-end mt-4 pt-3 border-top border-secondary border-opacity-30">
              <button
                type="button"
                className="btn btn-secondary px-4 rounded-3 fw-bold"
                onClick={() => setSelectedBooking(null)}
              >
                Đóng lại
              </button>
            </div>

          </div>
        </div>
      )}

      <ReviewModal
        isOpen={isReviewOpen}
        bookingId={reviewBookingId}
        existingReview={selectedReview}
        onClose={() => setIsReviewOpen(false)}
        onSubmitSuccess={() => {
          setIsReviewOpen(false)
          fetchReviews()
        }}
        showToast={showToast}
      />

      {cancelBookingConfirm && (
        <div
          className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center p-3"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 1060
          }}
        >
          <div
            className="card border-0 text-light p-4 rounded-4 shadow-2xl w-100 bg-dark animate-fade-in"
            style={{
              maxWidth: '480px',
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div className="text-center mb-3">
              <span className="fs-1 d-block mb-2">
                {cancelBookingConfirm.type === 'CANCEL' ? '⚠️' : '💸'}
              </span>
              <h5 className={`fw-bold text-uppercase ${cancelBookingConfirm.type === 'CANCEL' ? 'text-warning' : 'text-danger'}`}>
                {cancelBookingConfirm.type === 'CANCEL' ? 'Xác Nhận Hủy Đặt Vé' : 'Xác Nhận Hủy & Hoàn Tiền'}
              </h5>
            </div>

            <div className="text-white-50 mb-4" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              <p className="mb-2">Bạn có chắc chắn muốn thực hiện thao tác này cho đơn hàng sau?</p>
              <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <p className="mb-1 text-light">🎬 Phim: <strong>{cancelBookingConfirm.movieTitle}</strong></p>
                <p className="mb-1 text-light">💺 Ghế: <strong>{cancelBookingConfirm.seats}</strong></p>
                <p className="mb-0 text-light">💵 Tổng tiền: <strong className="text-warning">{formatPrice(cancelBookingConfirm.totalAmount)}</strong></p>
              </div>
              <p className="mb-0 text-xs">
                {cancelBookingConfirm.type === 'CANCEL' 
                  ? 'Hành động này sẽ giải phóng ghế ngồi đã chọn của bạn ngay lập tức.' 
                  : 'Số tiền hoàn lại sẽ được trả về tài khoản thanh toán của bạn, đồng thời giải phóng ghế ngồi.'}
              </p>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary flex-grow-1 py-2 rounded-3 fw-bold text-light"
                onClick={() => setCancelBookingConfirm(null)}
                disabled={actionLoading}
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}
              >
                Không, Quay lại
              </button>
              <button
                type="button"
                className={`btn flex-grow-1 py-2 rounded-3 fw-bold text-white ${cancelBookingConfirm.type === 'CANCEL' ? 'btn-warning text-dark' : 'btn-danger'}`}
                onClick={executeCancelOrRefund}
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang xử lý...' : 'Đồng ý, Hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteReviewId && (
        <div
          className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center p-3"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(5px)',
            zIndex: 1060
          }}
        >
          <div
            className="card border-0 text-light p-4 rounded-4 shadow-2xl w-100 bg-dark animate-fade-in"
            style={{
              maxWidth: '400px',
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <h5 className="fw-bold mb-3 text-danger">⚠️ XÁC NHẬN XÓA</h5>
            <p className="text-white-50 small mb-4">Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.</p>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-secondary px-3 py-1.5 rounded-3 btn-sm" onClick={() => setDeleteReviewId(null)}>
                Hủy bỏ
              </button>
              <button
                className="btn btn-danger px-3 py-1.5 rounded-3 btn-sm fw-bold"
                onClick={confirmDeleteReview}
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications portal */}
      <div
        className="position-fixed top-0 end-0 p-3"
        style={{ zIndex: 9999, minWidth: '320px', maxWidth: '420px' }}
      >
        <div className="vstack gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="card border-0 shadow-lg rounded-3 text-light"
              style={{
                backgroundColor: toast.type === 'error' ? '#ef4444' : '#10b981',
                borderLeft: '5px solid rgba(0,0,0,0.2)',
                animation: 'slideIn 0.3s ease forwards',
              }}
            >
              <div className="card-body py-2.5 px-3 d-flex align-items-center justify-content-between">
                <span className="small fw-semibold">{toast.message}</span>
                <button
                  type="button"
                  className="btn-close btn-close-white ms-2 small"
                  style={{ fontSize: '0.65rem' }}
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

    </section>
  )
}

