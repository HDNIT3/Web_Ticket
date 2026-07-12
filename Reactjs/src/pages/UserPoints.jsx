import { useEffect, useState } from 'react'
import { pointApi } from '../services/point.api.js'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function UserPoints() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    pointApi.getMyPoints()
      .then(res => {
        // requestJson trả về payload.data trực tiếp (không phải { success, data })
        setData(res)
      })
      .catch(err => setError(err.message || 'Không thể tải dữ liệu.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container py-4" style={{ maxWidth: '860px' }}>
      {/* Header */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color: '#1e293b' }}>
          🏆 Điểm Tích Lũy Của Tôi
        </h2>
        <p className="text-secondary mb-0">
          Mỗi lần đánh giá phim lần đầu tiên, bạn nhận được <strong>10 điểm</strong>.
        </p>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
          <p className="mt-3 text-secondary">Đang tải...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {!loading && !error && data && (
        <>
          {/* Points Card */}
          <div
            className="rounded-4 p-4 mb-4 text-white d-flex align-items-center gap-4 shadow"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
              minHeight: '130px'
            }}
          >
            <div
              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style={{
                width: 88, height: 88,
                background: 'rgba(255,255,255,0.18)',
                fontSize: 38
              }}
            >
              ⭐
            </div>
            <div>
              <div className="small text-white-50 mb-1 text-uppercase fw-semibold ls-wider">Tổng điểm tích lũy</div>
              <div className="fw-bold" style={{ fontSize: '3rem', lineHeight: 1 }}>
                {(data.totalPoints || 0).toLocaleString('vi-VN')}
              </div>
              <div className="text-white-50 small mt-1">
                {data.logs?.length || 0} lần đánh giá phim
              </div>
            </div>
          </div>

          {/* History */}
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white border-0 px-4 pt-4 pb-2 rounded-top-4">
              <h5 className="fw-bold mb-0" style={{ color: '#374151' }}>
                📋 Lịch sử tích điểm
              </h5>
            </div>
            <div className="card-body p-0">
              {data.logs?.length === 0 ? (
                <div className="text-center py-5 text-secondary">
                  <div style={{ fontSize: 48 }}>🎬</div>
                  <p className="mt-3">Bạn chưa có điểm tích lũy nào.<br />
                    Hãy xem phim và đánh giá để nhận điểm!</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th className="px-4 py-3 text-secondary fw-semibold small border-0">#</th>
                        <th className="px-3 py-3 text-secondary fw-semibold small border-0">Tên phim</th>
                        <th className="px-3 py-3 text-secondary fw-semibold small border-0">Suất chiếu</th>
                        <th className="px-3 py-3 text-secondary fw-semibold small border-0 text-center">Điểm</th>
                        <th className="px-4 py-3 text-secondary fw-semibold small border-0">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.logs.map((log, idx) => (
                        <tr key={log._id}>
                          <td className="px-4 text-secondary small">{idx + 1}</td>
                          <td className="px-3">
                            <div className="d-flex align-items-center gap-2">
                              {log.movie?.posterUrl && (
                                <img
                                  src={log.movie.posterUrl}
                                  alt={log.movieTitle}
                                  className="rounded"
                                  style={{ width: 36, height: 52, objectFit: 'cover', flexShrink: 0 }}
                                  onError={e => { e.target.style.display = 'none' }}
                                />
                              )}
                              <div>
                                <div className="fw-semibold small" style={{ color: '#1e293b' }}>
                                  {log.movieTitle || log.movie?.title || '—'}
                                </div>
                                <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                                {log.reason === 'REDEEM'
                                  ? (log.points > 0 ? '🔄 Hoàn điểm (hủy đơn)' : '💳 Dùng điểm đặt vé')
                                  : '⭐ Đánh giá lần đầu'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 text-secondary small">
                            {log.showtime?.startTime ? formatDate(log.showtime.startTime) : '—'}
                          </td>
                          <td className="px-3 text-center">
                            {log.points > 0 ? (
                              <span
                                className="badge rounded-pill fw-bold px-3 py-2"
                                style={{ background: '#d1fae5', color: '#065f46', fontSize: '0.85rem' }}
                              >
                                +{log.points}
                              </span>
                            ) : (
                              <span
                                className="badge rounded-pill fw-bold px-3 py-2"
                                style={{ background: '#ede9fe', color: '#6d28d9', fontSize: '0.85rem' }}
                              >
                                {log.points} ⭐
                              </span>
                            )}
                          </td>
                          <td className="px-4 text-secondary small">
                            {formatDate(log.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
