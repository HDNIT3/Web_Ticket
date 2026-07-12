import { useEffect, useState } from 'react'
import { bookingApi } from '../services/booking.api.js'

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

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return 'N/A'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m > 0 ? `${m}p` : ''}`.trim() : `${m}p`
}

function formatPrice(amount) {
  if (!amount && amount !== 0) return '0đ'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export default function WatchHistoryPage({ onNavigate }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 8

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await bookingApi.getWatchHistory()
      setHistory(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Không thể tải lịch sử xem phim.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistory() }, [])

  const filtered = history.filter((booking) => {
    const title = booking.showtime?.movie?.title || ''
    return !searchQuery.trim() || title.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const displayed = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <section
      className="container py-5 px-3 px-lg-4 text-light"
      style={{ minHeight: 'calc(100vh - 88px)', backgroundColor: '#030712' }}
    >
      <div className="text-center mb-5 mt-2">
        <h3 className="fw-bold text-light text-uppercase mb-1" style={{ fontSize: '1.4rem', letterSpacing: '0.05em' }}>
          🎬 Lịch Sử Đã Xem
        </h3>
        <p className="text-white-50 small mb-0">
          Các bộ phim bạn đã xem tại rạp (đã soát vé + suất chiếu đã kết thúc)
        </p>
      </div>

      <div className="row justify-content-center mb-4">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="input-group">
            <span
              className="input-group-text rounded-start-3"
              style={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
            >
              🔍
            </span>
            <input
              type="text"
              className="form-control rounded-end-3"
              placeholder="Tìm kiếm phim đã xem..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              style={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.9rem' }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-white-50 mt-3 small">Đang tải lịch sử xem phim...</p>
        </div>
      ) : error ? (
        <div className="text-center py-5">
          <span className="fs-1 d-block mb-3">⚠️</span>
          <p className="text-danger mb-3">{error}</p>
          <button className="btn btn-outline-danger rounded-3 px-4" onClick={fetchHistory}>Thử lại</button>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="card border-0 text-center p-5 rounded-4 shadow-lg mx-auto"
          style={{ maxWidth: '520px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <span className="fs-1 d-block mb-3">{searchQuery ? '🔍' : '🎬'}</span>
          <h5 className="fw-bold mb-2 text-light">
            {searchQuery ? 'Không tìm thấy phim' : 'Chưa có lịch sử xem phim'}
          </h5>
          <p className="text-white-50 small mb-4">
            {searchQuery
              ? `Không tìm thấy phim nào khớp với "${searchQuery}".`
              : 'Sau khi bạn xem phim tại rạp và vé đã được soát, lịch sử sẽ xuất hiện ở đây.'}
          </p>
          {!searchQuery && (
            <button
              className="btn btn-danger px-4 rounded-3 py-2 fw-bold"
              onClick={() => onNavigate('/movies')}
            >
              Đặt vé xem phim ngay
            </button>
          )}
        </div>
      ) : (
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <p className="text-white-50 small mb-3">
            {filtered.length} phim đã xem{searchQuery ? ' (kết quả tìm kiếm)' : ''}
          </p>

          <div className="vstack gap-3">
            {displayed.map((booking) => {
              const movie = booking.showtime?.movie || {}
              const showtime = booking.showtime || {}
              const checkedInTickets = booking.tickets?.filter((t) => t.status === 'CHECKED_IN') || []
              const genres = (movie.genres || []).map((g) => g?.name).filter(Boolean)
              const movieId = movie._id || movie.id

              return (
                <div
                  key={booking._id}
                  className="card border-0 rounded-4 overflow-hidden"
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)')}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                >
                  <div
                    className="position-absolute start-0 top-0 bottom-0"
                    style={{ width: '5px', backgroundColor: '#16a34a', borderRadius: '4px 0 0 4px' }}
                  />

                  <div className="row g-0 align-items-center ps-2">
                    {movie.posterUrl && (
                      <div className="col-auto p-3">
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="rounded-3 shadow"
                          style={{ width: '75px', height: '110px', objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => movieId && onNavigate(`/movie/${movieId}`)}
                        />
                      </div>
                    )}

                    <div className="col p-3 ps-2">
                      <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-1">
                        <div>
                          <h6
                            className="fw-bold text-light mb-0 text-uppercase"
                            style={{ fontSize: '0.95rem', cursor: 'pointer' }}
                            onClick={() => movieId && onNavigate(`/movie/${movieId}`)}
                          >
                            {movie.title || 'Phim'}
                          </h6>
                          {genres.length > 0 && (
                            <p className="mb-0 mt-1" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                              🎭 {genres.join(' · ')}
                            </p>
                          )}
                        </div>
                        <span
                          className="badge fw-bold"
                          style={{ fontSize: '0.65rem', backgroundColor: '#16a34a', color: '#fff' }}
                        >
                          ✅ ĐÃ XEM
                        </span>
                      </div>

                      <div
                        className="d-flex flex-wrap gap-3 mt-2 pt-2"
                        style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <span>⏰ {formatDateTime(showtime.startTime)}</span>
                        <span>⏱ {formatDuration(movie.durationMinutes)}</span>
                        <span>🎬 {showtime.auditorium?.name || 'Phòng chiếu'}</span>
                        <span>💺 {checkedInTickets.map((t) => t.seat?.name).filter(Boolean).join(', ') || 'N/A'}</span>
                        <span>💵 {formatPrice(booking.totalAmount)}</span>
                      </div>

                      <div className="d-flex gap-2 mt-3">
                        <button
                          className="btn btn-sm btn-outline-danger rounded-3 fw-bold px-3"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => onNavigate('/movies')}
                        >
                          🎟 Đặt vé lại
                        </button>
                        {movieId && (
                          <button
                            className="btn btn-sm btn-outline-secondary rounded-3 px-3"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => onNavigate(`/movie/${movieId}`)}
                          >
                            🔍 Xem chi tiết phim
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center align-items-center gap-3 mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button
                className="btn btn-outline-secondary rounded-3 px-3 fw-bold"
                style={{ fontSize: '0.85rem' }}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                ◀ Trang trước
              </button>
              <span className="text-white-50 small">
                Trang <strong>{currentPage}</strong> / {totalPages}
              </span>
              <button
                className="btn btn-outline-secondary rounded-3 px-3 fw-bold"
                style={{ fontSize: '0.85rem' }}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Trang sau ▶
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
