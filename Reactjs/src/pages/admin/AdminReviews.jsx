import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../components/context/auth.context.jsx'
import { reviewApi } from '../../services/review.api'
import { getMovies } from '../../services/movie.api'
import { notifySuccess, notifyError } from '../../util/notify'
import ReviewEditModal from '../../components/layout/ReviewEditModal.jsx'


export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [movies, setMovies] = useState([])
  const [stats, setStats] = useState({ totalReviews: 0, averageRating: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const [error, setError] = useState('')

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const [selectedMovieId, setSelectedMovieId] = useState('')
  const [selectedRating, setSelectedRating] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [inputQuery, setInputQuery] = useState('')
  
  const [deletingId, setDeletingId] = useState(null)
  const [editingReview, setEditingReview] = useState(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchAllMovies = useCallback(async () => {
    try {
      const res = await getMovies({ limit: 100 })
      const items = res?.currentItem || res?.currentItems || res?.data || (Array.isArray(res) ? res : [])
      setMovies(items)
    } catch (err) {
      console.error('Error fetching movies for filter:', err)
    }
  }, [])

  const fetchReviews = useCallback(async (targetPage = 1, movieId = '', rating = '', q = '') => {
    setLoading(true);
    setError('');
    try {
      const payload = await reviewApi.getAdminReviews({
        page: targetPage,
        limit: 10,
        movieId,
        rating,
        q
      });
      console.log('Admin fetchReviews payload:', payload);

      setReviews(payload.currentItem || []);
      setPage(payload.currentPage || 1);
      setTotalPages(payload.totalPage || 1);
      setTotalItems(payload.totalItems || 0);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đánh giá.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async (movieId = '') => {
    try {
      const stats = await reviewApi.getAdminStats({ movieId })
      setStats(stats)
    } catch (err) {
      console.error('Error fetching review stats:', err)
    }
  }, [])

  useEffect(() => {
    fetchAllMovies()
  }, [fetchAllMovies])

  useEffect(() => {
    fetchReviews(1, selectedMovieId, selectedRating, searchQuery)
    fetchStats(selectedMovieId)
  }, [selectedMovieId, selectedRating, searchQuery, fetchReviews, fetchStats])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearchQuery(inputQuery.trim())
    setPage(1)
  }

  const openEditModal = (rev) => {
    setEditingReview(rev)
    setEditModalOpen(true)
  };

  const closeEditModal = () => {
    setEditModalOpen(false)
    setEditingReview(null)
  };

  const handleResetFilters = () => {
    setSelectedMovieId('')
    setSelectedRating('')
    setSearchQuery('')
    setInputQuery('')
    setPage(1)
  };

  const handleRefresh = () => {
    // Reload current data without resetting filters
    fetchReviews(page, selectedMovieId, selectedRating, searchQuery);
    fetchStats(selectedMovieId);
  };

  const handleDeleteOwnReview = (reviewId, movieTitle, userName) => {
    setDeleteTarget({ id: reviewId, movieTitle, userName, isOwn: true })
  };

  const handleDeleteReview = (reviewId, movieTitle, userName) => {
    setDeleteTarget({ id: reviewId, movieTitle, userName, isOwn: false })
  }

  const confirmDeleteReview = async () => {
    if (!deleteTarget) return
    const { id, movieTitle, userName, isOwn } = deleteTarget
    setDeleteTarget(null)
    setDeletingId(id)
    try {
      await reviewApi.deleteReview(id)
      notifySuccess('Xóa đánh giá thành công!')
      fetchReviews(page, selectedMovieId, selectedRating, searchQuery)
      fetchStats(selectedMovieId)
    } catch (err) {
      notifyError(err.message || 'Xóa đánh giá thất bại.')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateStr))
  }

  return (
    <section className="container-fluid px-2 px-md-3 px-xl-4 h-100 animate-fade-in">
      <div className="card border-0 shadow-sm h-100 d-flex flex-column">
        <div className="card-body p-3 p-md-4 d-flex flex-column">
          
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="h4 mb-1">⭐ Quản lý Đánh Giá & Xếp Hạng</h2>
              <p className="text-secondary mb-0">Xem thống kê, lọc và kiểm duyệt các đánh giá phim từ khách hàng.</p>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm bg-primary text-white p-3 h-100">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="small text-white-50">Tổng số đánh giá</span>
                    <h3 className="fw-bold mb-0 mt-1">{stats.totalReviews}</h3>
                  </div>
                  <span className="fs-1">💬</span>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm bg-warning text-dark p-3 h-100">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="small text-dark-50">Điểm đánh giá trung bình</span>
                    <h3 className="fw-bold mb-0 mt-1">{stats.averageRating} / 5</h3>
                  </div>
                  <span className="fs-1">⭐</span>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm bg-dark text-light p-3 h-100" style={{ backgroundColor: '#1e293b' }}>
                <span className="small text-white-50 d-block mb-2">Tỷ lệ đánh giá sao</span>
                <div className="vstack gap-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = stats.breakdown[star] || 0
                    const percentage = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0
                    return (
                      <div key={star} className="d-flex align-items-center gap-2 small">
                        <span style={{ width: '45px' }} className="text-warning fw-bold">{star} ★</span>
                        <div className="flex-grow-1 progress bg-secondary bg-opacity-20" style={{ height: '6px' }}>
                          <div
                            className="progress-bar bg-warning"
                            role="progressbar"
                            style={{ width: `${percentage}%` }}
                            aria-valuenow={percentage}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          />
                        </div>
                        <span style={{ width: '35px' }} className="text-end text-white-50">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <form className="row g-2 mb-4" onSubmit={handleSearchSubmit}>
            <div className="col-12 col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Tìm theo nội dung bình luận, tên khách hàng..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
              />
            </div>
            
            <div className="col-12 col-md-3">
              <select
                className="form-select"
                value={selectedMovieId}
                onChange={(e) => {
                  setSelectedMovieId(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">Tất cả các phim</option>
                {movies.map((m) => (
                  <option key={m._id || m.id} value={m._id || m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-2">
              <select
                className="form-select"
                value={selectedRating}
                onChange={(e) => {
                  setSelectedRating(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">Tất cả số sao</option>
                {[5, 4, 3, 2, 1].map((star) => (
                  <option key={star} value={star}>
                    {star} Sao
                  </option>
                ))}
              </select>
            </div>

            <div className="col-auto d-flex gap-2">
              <button type="submit" className="btn btn-outline-primary" disabled={loading}>
                Tìm kiếm
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleRefresh}
                disabled={loading}
              >
                Làm mới
              </button>
            </div>
          </form>

          {(selectedMovieId || selectedRating || searchQuery) && (
            <div className="small text-secondary mb-3">
              Đang lọc danh sách: Tìm thấy <strong>{totalItems}</strong> đánh giá.
            </div>
          )}

          {error && <div className="alert alert-danger py-2 px-3">{error}</div>}

          {loading ? (
            <div className="text-center text-secondary py-5">Đang tải danh sách đánh giá...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center text-secondary py-5 border rounded-3 bg-white">
              Không tìm thấy đánh giá nào khớp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="table-responsive flex-grow-1">
              <table className="table table-hover align-middle table-striped border">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '180px' }}>Khách hàng</th>
                    <th style={{ width: '180px' }}>Phim</th>
                    <th style={{ width: '100px' }}>Xếp hạng</th>
                    <th>Nội dung bình luận</th>
                    <th style={{ width: '180px' }}>Suất chiếu / Phòng</th>
                    <th style={{ width: '130px' }}>Thời gian</th>
                    <th style={{ width: '80px' }} className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((rev) => {
                    const userName = rev.user?.firstName ? `${rev.user.firstName} ${rev.user.lastName || ''}` : rev.user?.username || 'Khán giả';
                    const userEmail = rev.user?.email || 'N/A';
                    const movieTitle = rev.movie?.title || 'Phim đã xóa';
                    const posterUrl = rev.movie?.posterUrl;

                    return (
                      <tr key={rev._id}>
                        <td>
                          <div className="fw-semibold text-dark">{userName}</div>
                          <small className="text-secondary font-monospace d-block" style={{ fontSize: '0.75rem' }}>{userEmail}</small>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {posterUrl && (
                              <img
                                src={posterUrl}
                                alt={movieTitle}
                                className="rounded object-fit-cover"
                                style={{ width: '32px', height: '46px' }}
                              />
                            )}
                            <span className="fw-semibold text-truncate d-inline-block" style={{ maxWidth: '140px' }} title={movieTitle}>
                              {movieTitle}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="text-warning fw-bold">
                            {'★'.repeat(rev.rating)}
                            <span className="text-muted" style={{ opacity: 0.3 }}>{'★'.repeat(5 - rev.rating)}</span>
                          </span>
                        </td>
                        <td>
                          <div className="small text-secondary" style={{ maxWidth: '350px', whiteSpace: 'pre-line' }}>
                            {rev.comment || <em className="text-muted">(Không có bình luận)</em>}
                          </div>
                        </td>
                        <td>
                          {rev.showtime ? (
                            <div>
                              <span className="badge text-bg-danger bg-opacity-10 text-danger fw-bold" style={{ fontSize: '0.75rem' }}>
                                {new Date(rev.showtime.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="badge text-bg-secondary ms-1" style={{ fontSize: '0.75rem' }}>
                                {rev.showtime.auditorium?.name || 'Phòng'}
                              </span>
                              <div className="text-secondary mt-1" style={{ fontSize: '0.75rem' }}>
                                {new Date(rev.showtime.startTime).toLocaleDateString('vi-VN')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted small">N/A</span>
                          )}
                        </td>
                        <td>
                          <span className="text-secondary small">{formatDate(rev.createdAt)}</span>
                        </td>
                        <td className="text-center">
                          {rev.user && rev.user._id === (user?.id || user?._id) && (
                            <div className="d-flex gap-2 justify-content-center">
                              <button
                                type="button"
                                className="btn btn-outline-warning btn-sm"
                                title="Chỉnh sửa"
                                onClick={() => openEditModal(rev)}
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                title="Xóa"
                                onClick={() => handleDeleteOwnReview(rev._id, movieTitle, userName)}
                                disabled={deletingId === rev._id}
                              >
                                {deletingId === rev._id ? '...' : '🗑️'}
                              </button>
                            </div>
                          )}
                          {!rev.user || rev.user._id !== (user?.id || user?._id) ? (
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              title="Xóa đánh giá (Kiểm duyệt)"
                              onClick={() => handleDeleteReview(rev._id, movieTitle, userName)}
                              disabled={deletingId === rev._id}
                            >
                              {deletingId === rev._id ? '...' : '🗑️'}
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <span className="text-secondary small">
                Trang {page} / {totalPages} (Tổng số {totalItems} đánh giá)
              </span>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={loading || page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Trước
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={loading || page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Sau
                </button>
              </div>
            </div>
          )}

          <ReviewEditModal
            show={editModalOpen}
            onHide={closeEditModal}
            review={editingReview}
            onUpdated={(updated) => {
              setReviews(prev => prev.map(r => r._id === updated._id ? { ...r, ...updated } : r))
              fetchStats(selectedMovieId)
            }}
          />

          {deleteTarget && (
            <div
              className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center p-3"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 1060
              }}
            >
              <div
                className="card border-0 text-dark p-4 rounded-4 shadow-lg w-100 bg-white animate-fade-in"
                style={{
                  maxWidth: '450px',
                  border: '1px solid rgba(0,0,0,0.1)'
                }}
              >
                <h5 className="fw-bold mb-3 text-danger">⚠️ XÁC NHẬN XÓA ĐÁNH GIÁ</h5>
                <p className="text-secondary small mb-4">
                  {deleteTarget.isOwn 
                    ? 'Bạn có chắc chắn muốn xóa đánh giá của mình? Hành động này không thể hoàn tác.' 
                    : `Bạn có chắc chắn muốn xóa đánh giá của khách hàng "${deleteTarget.userName}" cho phim "${deleteTarget.movieTitle}"? Hành động này không thể hoàn tác.`
                  }
                </p>
                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-outline-secondary px-3 py-1.5 rounded-3 btn-sm" onClick={() => setDeleteTarget(null)}>
                    Hủy bỏ
                  </button>
                  <button
                    className="btn btn-danger px-3 py-1.5 rounded-3 btn-sm fw-bold text-white"
                    onClick={confirmDeleteReview}
                  >
                    Xóa ngay
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
