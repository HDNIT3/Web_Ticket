import { useEffect, useState } from 'react'
import { favoriteApi } from '../services/favorite.api.js'

function formatDate(value) {
  if (!value) return 'Đang cập nhật'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return 'N/A'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m > 0 ? `${m}p` : ''}`.trim() : `${m}p`
}

export default function FavoritesPage({ onNavigate }) {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState(null)
  const [toasts, setToasts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  const showToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await favoriteApi.getMyFavorites()
      setFavorites(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách yêu thích.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (movieId) => {
    if (!window.confirm('Bạn muốn xóa phim này khỏi danh sách yêu thích?')) return
    try {
      setRemoving(movieId)
      await favoriteApi.removeFavorite(movieId)
      setFavorites((prev) => prev.filter((m) => (m._id || m.id) !== movieId))
      showToast('Đã xóa khỏi danh sách yêu thích.', 'success')
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa yêu thích.', 'error')
    } finally {
      setRemoving(null)
    }
  }

  useEffect(() => { fetchFavorites() }, [])

  const filtered = favorites.filter((m) =>
    !searchQuery.trim() || m.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <section
      className="container py-5 px-3 px-lg-4 text-light"
      style={{ minHeight: 'calc(100vh - 88px)', backgroundColor: '#030712' }}
    >
      <div className="text-center mb-5 mt-2">
        <h3 className="fw-bold text-light text-uppercase mb-1" style={{ fontSize: '1.4rem', letterSpacing: '0.05em' }}>
          ❤️ Phim Yêu Thích
        </h3>
        <p className="text-white-50 small mb-0">Danh sách các bộ phim bạn đã lưu yêu thích</p>
      </div>

      <div className="row justify-content-center mb-4">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="input-group">
            <span className="input-group-text rounded-start-3" style={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>🔍</span>
            <input
              type="text"
              className="form-control rounded-end-3"
              placeholder="Tìm kiếm trong danh sách yêu thích..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          <p className="text-white-50 mt-3 small">Đang tải danh sách yêu thích...</p>
        </div>
      ) : error ? (
        <div className="text-center py-5">
          <span className="fs-1 d-block mb-3">⚠️</span>
          <p className="text-danger mb-3">{error}</p>
          <button className="btn btn-outline-danger rounded-3 px-4" onClick={fetchFavorites}>Thử lại</button>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="card border-0 text-center p-5 rounded-4 shadow-lg mx-auto"
          style={{ maxWidth: '500px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <span className="fs-1 d-block mb-3">{searchQuery ? '🔍' : '❤️'}</span>
          <h5 className="fw-bold mb-2 text-light">
            {searchQuery ? 'Không tìm thấy phim' : 'Chưa có phim yêu thích'}
          </h5>
          <p className="text-white-50 small mb-4">
            {searchQuery
              ? `Không có phim nào khớp với "${searchQuery}".`
              : 'Hãy vào trang chi tiết phim và nhấn ❤️ để thêm phim bạn yêu thích vào đây!'}
          </p>
          {!searchQuery && (
            <button
              className="btn btn-danger px-4 rounded-3 py-2 fw-bold"
              onClick={() => onNavigate('/movies')}
            >
              Khám phá phim ngay
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-white-50 small mb-3 text-center">
            {filtered.length} phim{searchQuery ? ' tìm thấy' : ' yêu thích'}
          </p>
          <div className="row g-3 justify-content-center" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            {filtered.map((movie) => {
              const movieId = movie._id || movie.id
              const genres = (movie.genres || []).map((g) => g?.name).filter(Boolean)
              return (
                <div key={movieId} className="col-6 col-sm-4 col-md-3 col-lg-2" style={{ minWidth: '170px', maxWidth: '200px' }}>
                  <div
                    className="card h-100 border-0 rounded-4 overflow-hidden position-relative"
                    style={{
                      backgroundColor: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.06)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.5)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div
                      className="position-relative overflow-hidden"
                      style={{ aspectRatio: '2/3' }}
                      onClick={() => onNavigate(`/movie/${movieId}`)}
                    >
                      {movie.posterUrl ? (
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="w-100 h-100 object-fit-cover"
                          style={{ objectFit: 'cover', transition: 'transform 0.3s ease' }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        />
                      ) : (
                        <div
                          className="w-100 h-100 d-flex align-items-center justify-content-center"
                          style={{ backgroundColor: '#1e293b', fontSize: '3rem' }}
                        >
                          🎬
                        </div>
                      )}
                      <span
                        className="position-absolute top-0 start-0 m-2 badge fw-bold"
                        style={{
                          fontSize: '0.6rem',
                          backgroundColor: movie.status === 'NOW_SHOWING' ? '#16a34a' : movie.status === 'COMING_SOON' ? '#d97706' : '#6b7280',
                        }}
                      >
                        {movie.status === 'NOW_SHOWING' ? 'Đang chiếu' : movie.status === 'COMING_SOON' ? 'Sắp chiếu' : 'Ngừng chiếu'}
                      </span>
                    </div>

                    <div className="card-body p-2">
                      <h6
                        className="fw-bold text-light mb-1 text-truncate"
                        style={{ fontSize: '0.8rem', cursor: 'pointer' }}
                        title={movie.title}
                        onClick={() => onNavigate(`/movie/${movieId}`)}
                      >
                        {movie.title}
                      </h6>
                      {genres.length > 0 && (
                        <p className="mb-1 text-truncate" style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>
                          {genres.join(' · ')}
                        </p>
                      )}
                      <div className="d-flex align-items-center justify-content-between mt-1" style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)' }}>
                        <span>⏱ {formatDuration(movie.durationMinutes)}</span>
                        <span>📅 {formatDate(movie.releaseDate)}</span>
                      </div>

                      <div className="d-flex gap-1 mt-2">
                        <button
                          className="btn btn-danger btn-sm rounded-3 w-100 fw-bold"
                          style={{ fontSize: '0.7rem', padding: '3px 6px' }}
                          onClick={() => onNavigate(`/movie/${movieId}`)}
                        >
                          🎬 Xem chi tiết
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm rounded-3 flex-shrink-0"
                          style={{ fontSize: '0.7rem', padding: '3px 6px' }}
                          title="Xóa khỏi yêu thích"
                          disabled={removing === movieId}
                          onClick={() => handleRemove(movieId)}
                        >
                          {removing === movieId ? (
                            <span className="spinner-border spinner-border-sm" />
                          ) : '🗑️'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
        <div className="vstack gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="card border-0 shadow-lg rounded-3 text-light"
              style={{
                backgroundColor: toast.type === 'error' ? '#ef4444' : '#10b981',
                animation: 'slideInFav 0.3s ease forwards',
                minWidth: '260px',
              }}
            >
              <div className="card-body py-2 px-3 d-flex align-items-center justify-content-between">
                <span className="small fw-semibold">{toast.message}</span>
                <button
                  type="button"
                  className="btn-close btn-close-white ms-2"
                  style={{ fontSize: '0.6rem' }}
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideInFav {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </section>
  )
}
