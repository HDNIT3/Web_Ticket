import { useEffect, useState, useCallback } from 'react'
import { pointApi } from '../../services/point.api.js'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function PointBadge({ points }) {
  const color = points >= 100 ? '#7c3aed' : points >= 50 ? '#2563eb' : points >= 10 ? '#0891b2' : '#6b7280'
  const bg = points >= 100 ? '#ede9fe' : points >= 50 ? '#dbeafe' : points >= 10 ? '#cffafe' : '#f3f4f6'
  return (
    <span
      className="badge rounded-pill fw-bold px-3 py-2"
      style={{ background: bg, color, fontSize: '0.85rem' }}
    >
      ⭐ {points || 0}
    </span>
  )
}

function UserDetailModal({ userId, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    pointApi.getUserPointsById(userId)
      .then(res => {
        // requestJson trả về payload.data trực tiếp
        setDetail(res)
      })
      .finally(() => setLoading(false))
  }, [userId])

  const u = detail?.user
  const displayName = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || u.email : ''

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ zIndex: 1050, background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-4 shadow-lg"
        style={{ width: '90%', maxWidth: 680, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="px-4 py-3 d-flex align-items-center justify-content-between border-bottom"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '16px 16px 0 0' }}
        >
          <div>
            <div className="fw-bold fs-6">Chi tiết điểm tích lũy</div>
            {u && <div className="small opacity-75">{displayName} — {u.email}</div>}
          </div>
          <div className="d-flex align-items-center gap-3">
            {u && (
              <span
                className="badge rounded-pill fw-bold px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.22)', fontSize: '1rem' }}
              >
                ⭐ {u.loyaltyPoints || 0} điểm
              </span>
            )}
            <button
              type="button"
              className="btn btn-sm text-white border-0"
              style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8 }}
              onClick={onClose}
            >✕</button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-auto flex-grow-1">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
            </div>
          ) : !detail || detail.logs?.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <div style={{ fontSize: 40 }}>📭</div>
              <p className="mt-3">Người dùng này chưa có lịch sử tích điểm.</p>
            </div>
          ) : (
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                <tr>
                  <th className="px-4 py-3 text-secondary fw-semibold small border-0">#</th>
                  <th className="px-3 py-3 text-secondary fw-semibold small border-0">Tên phim</th>
                  <th className="px-3 py-3 text-secondary fw-semibold small border-0">Suất chiếu</th>
                  <th className="px-3 py-3 text-secondary fw-semibold small border-0 text-center">Điểm</th>
                  <th className="px-4 py-3 text-secondary fw-semibold small border-0">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {detail.logs.map((log, idx) => (
                  <tr key={log._id}>
                    <td className="px-4 text-secondary small">{idx + 1}</td>
                    <td className="px-3">
                      <div className="d-flex align-items-center gap-2">
                        {log.movie?.posterUrl && (
                          <img
                            src={log.movie.posterUrl}
                            alt={log.movieTitle}
                            className="rounded"
                            style={{ width: 32, height: 46, objectFit: 'cover', flexShrink: 0 }}
                            onError={e => { e.target.style.display = 'none' }}
                          />
                        )}
                        <div className="fw-semibold small" style={{ color: '#1e293b' }}>
                          {log.movieTitle || log.movie?.title || '—'}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 text-secondary small">
                      {log.showtime?.startTime ? formatDate(log.showtime.startTime) : '—'}
                    </td>
                    <td className="px-3 text-center">
                      <span
                        className="badge rounded-pill fw-bold px-3"
                        style={{ background: '#d1fae5', color: '#065f46' }}
                      >
                        +{log.points}
                      </span>
                    </td>
                    <td className="px-4 text-secondary small">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminUserPoints() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState(null)

  const fetchData = useCallback((q, p) => {
    setLoading(true)
    setError('')
    pointApi.getAllUsersPoints({ q, page: p, limit: 20 })
      .then(res => {
        // requestJson trả về payload.data trực tiếp
        setResult(res)
      })
      .catch(err => setError(err.message || 'Lỗi tải dữ liệu.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchData(search, page)
  }, [search, page, fetchData])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const totalItems = result?.totalItems || 0
  const totalPage = result?.totalPage || 1
  const users = result?.currentItem || []

  // Stats summary
  const totalPoints = users.reduce((sum, u) => sum + (u.loyaltyPoints || 0), 0)
  const activeUsers = users.filter(u => (u.loyaltyPoints || 0) > 0).length

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#1e293b' }}>
            🏆 Quản lý Điểm Tích Lũy
          </h4>
          <p className="text-secondary mb-0 small">
            Xem điểm tích lũy của tất cả người dùng. Điểm được cộng khi đánh giá phim lần đầu.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {!loading && result && (
        <div className="row g-3">
          {[
            { label: 'Tổng người dùng', value: totalItems, icon: '👥', color: '#6366f1' },
            { label: 'Đã có điểm', value: activeUsers, icon: '🎯', color: '#10b981' },
            { label: 'Tổng điểm (trang này)', value: totalPoints, icon: '⭐', color: '#f59e0b' },
          ].map(s => (
            <div className="col-12 col-sm-4" key={s.label}>
              <div className="card border-0 rounded-4 shadow-sm p-3 d-flex flex-row align-items-center gap-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 52, height: 52, background: s.color + '18', fontSize: 24 }}
                >
                  {s.icon}
                </div>
                <div>
                  <div className="text-secondary small">{s.label}</div>
                  <div className="fw-bold fs-5" style={{ color: s.color }}>
                    {s.value.toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <form className="d-flex gap-2" onSubmit={handleSearch}>
        <input
          type="text"
          className="form-control rounded-3"
          placeholder="Tìm theo tên, username, email..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          style={{ maxWidth: 340 }}
        />
        <button type="submit" className="btn btn-primary rounded-3 px-4">
          🔍 Tìm
        </button>
        {search && (
          <button
            type="button"
            className="btn btn-outline-secondary rounded-3"
            onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
          >
            Xóa
          </button>
        )}
      </form>

      {/* Error */}
      {error && <div className="alert alert-danger rounded-3">{error}</div>}

      {/* Table */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" />
            <p className="mt-3 text-secondary">Đang tải...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <div style={{ fontSize: 40 }}>🔍</div>
            <p className="mt-3">Không tìm thấy người dùng nào.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ background: '#f1f5f9' }}>
                  <tr>
                    <th className="px-4 py-3 text-secondary fw-semibold small border-0">#</th>
                    <th className="px-3 py-3 text-secondary fw-semibold small border-0">Người dùng</th>
                    <th className="px-3 py-3 text-secondary fw-semibold small border-0">Email</th>
                    <th className="px-3 py-3 text-secondary fw-semibold small border-0 text-center">Tổng điểm</th>
                    <th className="px-3 py-3 text-secondary fw-semibold small border-0">Tham gia</th>
                    <th className="px-4 py-3 text-secondary fw-semibold small border-0 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => {
                    const displayName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || '—'
                    const avatarChar = displayName.charAt(0).toUpperCase()
                    return (
                      <tr key={u._id}>
                        <td className="px-4 text-secondary small">{(page - 1) * 20 + idx + 1}</td>
                        <td className="px-3">
                          <div className="d-flex align-items-center gap-2">
                            {u.image ? (
                              <img src={u.image} alt={displayName}
                                className="rounded-circle"
                                style={{ width: 36, height: 36, objectFit: 'cover' }}
                                onError={e => { e.target.style.display = 'none' }}
                              />
                            ) : (
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                                style={{ width: 36, height: 36, background: '#6366f1', fontSize: 14 }}
                              >
                                {avatarChar}
                              </div>
                            )}
                            <div>
                              <div className="fw-semibold small" style={{ color: '#1e293b' }}>{displayName}</div>
                              {u.username && <div className="text-secondary" style={{ fontSize: '0.72rem' }}>@{u.username}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 text-secondary small">{u.email || '—'}</td>
                        <td className="px-3 text-center">
                          <PointBadge points={u.loyaltyPoints} />
                        </td>
                        <td className="px-3 text-secondary small">{formatDate(u.createdAt)}</td>
                        <td className="px-4 text-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary rounded-3 px-3"
                            onClick={() => setSelectedUserId(u._id)}
                          >
                            Xem lịch sử
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPage > 1 && (
              <div className="d-flex align-items-center justify-content-between px-4 py-3 border-top">
                <div className="text-secondary small">
                  Trang {page}/{totalPage} · {totalItems} người dùng
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary btn-sm rounded-3"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >← Trước</button>
                  <button
                    className="btn btn-outline-secondary btn-sm rounded-3"
                    disabled={page >= totalPage}
                    onClick={() => setPage(p => p + 1)}
                  >Sau →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  )
}
