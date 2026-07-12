import { useEffect, useState } from 'react'
import { reviewApi } from '../../services/review.api'
import { useAuth } from '../../components/context/auth.context.jsx'
import { notifySuccess, notifyError } from '../../util/notify'
import ReviewEditModal from './ReviewEditModal.jsx'

function formatDate(value) {
  if (!value) return 'Đang cập nhật'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Đang cập nhật'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatDateOnly(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('vi-VN').format(date)
}

function formatTimeOnly(value) {
  if (!value) return '--:--'
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function MovieReviews({ movieId, onStatsLoaded }) {
  const { user } = useAuth()
  const [reviewsData, setReviewsData] = useState({ averageRating: 0, totalReviews: 0, reviews: { currentItem: [] } })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [editingReview, setEditingReview] = useState(null)
  const [editModalOpen, setEditModalOpen] = useState(false)


  const fetchReviews = async (targetPage = 1) => {
    try {
      setLoading(true)
      const res = await reviewApi.getMovieReviews(movieId, { page: targetPage, limit: 5 })
      console.log('Movie reviews response:', res)
      if (res && res.success && res.data) {
        setReviewsData(res.data)
        if (onStatsLoaded) {
          onStatsLoaded({
            averageRating: res.data.averageRating,
            totalReviews: res.data.totalReviews
          })
        }
      } else if (res && res.reviews) {
        setReviewsData(res)
        if (onStatsLoaded) {
          onStatsLoaded({
            averageRating: res.averageRating,
            totalReviews: res.totalReviews
          })
        }
      }
    } catch (err) {
      console.error('Error fetching movie reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (movieId) {
      setPage(1)
      fetchReviews(1)
    }
  }, [movieId])

  const openEditModal = (rev) => {
    setEditingReview(rev)
    setEditModalOpen(true)
  }

  const closeEditModal = () => {
    setEditModalOpen(false)
    setEditingReview(null)
  }

  const [deleteTargetId, setDeleteTargetId] = useState(null)

  const confirmDeleteReview = async () => {
    if (!deleteTargetId) return
    const id = deleteTargetId
    setDeleteTargetId(null)
    try {
      await reviewApi.deleteReview(id)
      notifySuccess('Xóa đánh giá thành công!')
      fetchReviews(page)
    } catch (err) {
      notifyError(err.message || 'Xóa đánh giá thất bại.')
    }
  }

  return (
    <div className="movie-detail__reviews mt-5">
      <div className="card bg-dark border-secondary" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header border-secondary p-3">
          <h5 className="mb-0 text-light d-flex align-items-center gap-2">
            ⭐ Đánh Giá & Nhận Xét Từ Khán Giả
            {reviewsData.totalReviews > 0 && (
              <span className="badge bg-warning text-dark text-xs ms-2">
                {reviewsData.averageRating} / 5 (Tổng {reviewsData.totalReviews})
              </span>
            )}
          </h5>
        </div>
        
        <div className="card-body p-4 text-light">
          {loading ? (
            <p className="text-secondary text-center py-3">Đang tải đánh giá...</p>
          ) : !reviewsData.reviews || !reviewsData.reviews.currentItem || reviewsData.reviews.currentItem.length === 0 ? (
            <div className="text-center py-4 text-white-50">
              <span className="fs-1 d-block mb-2">💬</span>
              <p className="mb-0 small">Chưa có đánh giá nào cho phim này. Hãy mua vé xem phim để trở thành người đầu tiên đánh giá!</p>
            </div>
          ) : (
            <div className="vstack gap-4">
              {reviewsData.reviews.currentItem.map((rev) => {
                const authorName = rev.user?.firstName ? `${rev.user.firstName} ${rev.user.lastName || ''}` : rev.user?.username || 'Khán giả';
                const avatarText = authorName.trim().charAt(0).toUpperCase();

                return (
                  <div key={rev._id} className="p-3 border border-secondary border-opacity-30 rounded-3 bg-black">
                    <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center fw-bold text-xs" style={{ width: 32, height: 32 }}>
                          {avatarText}
                        </div>
                        <div>
                          <strong className="text-light text-sm">{authorName}</strong>
                          <div className="text-warning text-xs mt-0.5">
                            {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="d-flex flex-column align-items-end gap-1.5">
                        <small className="text-secondary text-xs">{formatDate(rev.createdAt)}</small>
                        {rev.user && rev.user._id === (user?.id || user?._id) && (
                          <div className="d-flex gap-1.5 mt-1">
                            <button className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1 py-0.5 px-2" style={{ fontSize: '0.75rem' }} title="Chỉnh sửa" onClick={() => openEditModal(rev)}>
                              ✏️ <span className="small">Sửa</span>
                            </button>
                            <button className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 py-0.5 px-2" style={{ fontSize: '0.75rem' }} title="Xóa" onClick={() => setDeleteTargetId(rev._id)}>
                              🗑️ <span className="small">Xóa</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="mb-2 text-white-50 small" style={{ whiteSpace: 'pre-line' }}>{rev.comment}</p>

                    {rev.showtime && (
                      <div className="text-xs text-secondary border-top border-secondary border-opacity-20 pt-1.5 mt-2 d-flex align-items-center gap-1.5 flex-wrap">
                        <span className="me-1">🎥 Xem suất:</span>
                        <strong className="text-danger me-1">{formatTimeOnly(rev.showtime.startTime)}</strong>
                        <span className="me-1">ngày</span>
                        <strong className="text-light me-1">{formatDateOnly(rev.showtime.startTime)}</strong>
                        <span className="me-1">tại phòng</span>
                        <strong className="text-warning">{rev.showtime.auditorium?.name || 'Phòng chiếu'}</strong>
                      </div>
                    )}
                  </div>
                )
              })}

              <ReviewEditModal
                show={editModalOpen}
                onHide={closeEditModal}
                review={editingReview}
                onUpdated={() => {
                  fetchReviews(page)
                }}
              />

              {deleteTargetId && (
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
                      <button className="btn btn-secondary px-3 py-1.5 rounded-3 btn-sm" onClick={() => setDeleteTargetId(null)}>
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

              {reviewsData.reviews.totalPage > 1 && (
                <div className="d-flex justify-content-center align-items-center gap-3 mt-4 pt-3 border-top border-secondary border-opacity-10">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    disabled={page === 1}
                    onClick={() => {
                      const next = page - 1;
                      setPage(next);
                      fetchReviews(next);
                    }}
                  >
                    ◀ Trước
                  </button>
                  <span className="text-white-50 small">
                    Trang {page} / {reviewsData.reviews.totalPage}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    disabled={page === reviewsData.reviews.totalPage}
                    onClick={() => {
                      const next = page + 1;
                      setPage(next);
                      fetchReviews(next);
                    }}
                  >
                    Sau ▶
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
