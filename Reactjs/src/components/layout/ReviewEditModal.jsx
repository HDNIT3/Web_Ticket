import { useState, useEffect } from 'react'
import { reviewApi } from '../../services/review.api'
import { notifySuccess, notifyError } from '../../util/notify'

export default function ReviewEditModal({ show, onHide, review, onUpdated }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (review) {
      setRating(review.rating)
      setComment(review.comment || '')
    }
  }, [review, show])

  if (!show) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const res = await reviewApi.updateReview(review._id, { rating, comment })
      notifySuccess('Cập nhật đánh giá thành công!')
      if (onUpdated) {
        // The API returns the DTO: { success: true, message: '...', data: updatedReview }
        // Let's pass the updated review document
        const updatedDoc = res.data || res;
        onUpdated(updatedDoc)
      }
      onHide()
    } catch (err) {
      notifyError(err.message || 'Lỗi xử lý đánh giá.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center p-3"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(5px)',
        zIndex: 1050
      }}
    >
      <div
        className="card border-0 text-light p-4 rounded-4 shadow-2xl w-100 bg-dark animate-fade-in"
        style={{
          maxWidth: '500px',
          backgroundColor: '#1e293b',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div className="d-flex justify-content-between align-items-center border-bottom border-secondary border-opacity-30 pb-3 mb-3">
          <h5 className="fw-bold text-light mb-0">
            ✏️ CHỈNH SỬA ĐÁNH GIÁ
          </h5>
          <button type="button" className="btn-close btn-close-white" onClick={onHide} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4 text-center">
            <p className="text-white-50 small mb-2">Vui lòng chọn số sao đánh giá (1-5)</p>
            <div className="d-flex justify-content-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="border-0 bg-transparent fs-2 px-1"
                  style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
                  onClick={() => setRating(star)}
                >
                  {star <= rating ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            <span className="badge bg-warning text-dark fw-bold mt-2 px-2.5 py-1">
              {rating} / 5 Sao - {
                rating === 5 ? 'Tuyệt vời!' :
                rating === 4 ? 'Rất tốt' :
                rating === 3 ? 'Bình thường' :
                rating === 2 ? 'Tệ' : 'Rất tệ'
              }
            </span>
          </div>

          <div className="mb-4">
            <label className="form-label text-white-50 small">Nội dung bình luận/đánh giá phim</label>
            <textarea
              className="form-control bg-black text-light border-secondary border-opacity-20 rounded-3"
              rows="4"
              placeholder="Hãy chia sẻ cảm nghĩ của bạn về bộ phim này nhé..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength="1000"
              required
              style={{ resize: 'none', fontSize: '0.9rem' }}
            />
            <div className="text-end text-white-50 mt-1" style={{ fontSize: '0.75rem' }}>
              {comment.length} / 1000 ký tự
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 border-top border-secondary border-opacity-30 pt-3">
            <button type="button" className="btn btn-secondary px-3 rounded-3" onClick={onHide}>
              Hủy bỏ
            </button>
            <button type="submit" className="btn btn-danger px-4 rounded-3 fw-bold" disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Lưu Đánh Giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
