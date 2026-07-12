import { useEffect, useState, useCallback, useRef } from 'react'
import { notificationApi } from '../../services/notification.api.js'
import { bookingApi } from '../../services/booking.api.js'
import { useAuth } from '../../components/context/auth.context.jsx'

function formatDateTime(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(value))
}

const TYPE_ICON = { BOOKING: '🎟️', REVIEW: '⭐', BROADCAST: '📢' }
const TYPE_LABEL = { BOOKING: 'Đặt vé', REVIEW: 'Đánh giá', BROADCAST: 'Broadcast' }
const TYPE_COLOR = { BOOKING: '#3b82f6', REVIEW: '#f59e0b', BROADCAST: '#10b981' }

export default function AdminNotifications() {
  const { user, isAdmin, isStaff } = useAuth()
  const currentUserId = user?.id || user?._id

  const [incoming, setIncoming] = useState([])
  const [incomingTotal, setIncomingTotal] = useState(0)
  const [incomingPage, setIncomingPage] = useState(1)
  const [incomingPages, setIncomingPages] = useState(1)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingIncoming, setLoadingIncoming] = useState(false)
  const [realtimeQueue, setRealtimeQueue] = useState([])

  const [broadcasts, setBroadcasts] = useState([])
  const [broadcastTotal, setBroadcastTotal] = useState(0)
  const [broadcastPage, setBroadcastPage] = useState(1)
  const [broadcastPages, setBroadcastPages] = useState(1)
  const [loadingBroadcast, setLoadingBroadcast] = useState(false)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetEmail, setTargetEmail] = useState('')
  const [targetUser, setTargetUser] = useState(null)  // user tìm được theo email
  const [emailSearching, setEmailSearching] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState(null)
  const emailDebounceRef = useRef(null)

  const [selectedBroadcast, setSelectedBroadcast] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [modalResult, setModalResult] = useState(null)
 
  const [activeTab, setActiveTab] = useState('incoming')
  const listRef = useRef(null)

  const [viewBooking, setViewBooking] = useState(null)
  const [loadingBooking, setLoadingBooking] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [searchVal, setSearchVal] = useState('')

  const fetchIncoming = useCallback(async (page = 1, keyword = searchVal) => {
    setLoadingIncoming(true)
    try {
      const res = await notificationApi.getAdminNotifications({ page, limit: 15, q: keyword })
      setIncoming(res.items || [])
      setIncomingTotal(res.total || 0)
      setIncomingPage(res.page || 1)
      setIncomingPages(res.totalPages || 1)
      setUnreadCount(res.unreadCount || 0)
    } catch (err) {
      console.error('fetchIncoming error:', err)
    } finally {
      setLoadingIncoming(false)
    }
  }, [searchVal])

  const fetchBroadcasts = useCallback(async (page = 1) => {
    setLoadingBroadcast(true)
    try {
      const res = await notificationApi.getAdminBroadcasts({ page, limit: 10 })
      setBroadcasts(res.items || [])
      setBroadcastTotal(res.total || 0)
      setBroadcastPage(res.page || 1)
      setBroadcastPages(res.totalPages || 1)
    } catch (err) {
      console.error('fetchBroadcasts error:', err)
    } finally {
      setLoadingBroadcast(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchIncoming(1)
    if (isAdmin || isStaff) {
      fetchBroadcasts(1)
    }
  }, [fetchIncoming, fetchBroadcasts, isAdmin, isStaff])

  useEffect(() => {
    const handler = (e) => {
      const noti = e.detail
      setRealtimeQueue((prev) => [noti, ...prev])
      setUnreadCount((c) => c + 1)
    }
    window.addEventListener('admin:new-notification', handler)
    return () => window.removeEventListener('admin:new-notification', handler)
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAdminRead()
      setUnreadCount(0)
      setIncoming((prev) =>
        prev.map((n) => {
          const readBy = n.readBy || []
          if (currentUserId && !readBy.includes(currentUserId)) {
            return { ...n, readBy: [...readBy, currentUserId] }
          }
          return n
        })
      )
      setRealtimeQueue((prev) =>
        prev.map((n) => {
          const readBy = n.readBy || []
          if (currentUserId && !readBy.includes(currentUserId)) {
            return { ...n, readBy: [...readBy, currentUserId] }
          }
          return n
        })
      )
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkOneRead = async (noti) => {
    if (!noti._id) return
    try {
      await notificationApi.markOneAdminRead(noti._id)
      setUnreadCount((prev) => Math.max(0, prev - 1))
      
      setIncoming((prev) =>
        prev.map((n) => {
          if (n._id === noti._id) {
            const readBy = n.readBy || []
            if (currentUserId && !readBy.includes(currentUserId)) {
              return { ...n, readBy: [...readBy, currentUserId] }
            }
          }
          return n
        })
      )

      setRealtimeQueue((prev) =>
        prev.map((n) => {
          if (n._id === noti._id) {
            const readBy = n.readBy || []
            if (currentUserId && !readBy.includes(currentUserId)) {
              return { ...n, readBy: [...readBy, currentUserId] }
            }
          }
          return n
        })
      )
    } catch (err) {
      console.error('Lỗi khi đánh dấu đọc thông báo:', err)
    }
  }

  const handleNotificationClick = async (noti) => {
    const isUnread = !noti.readBy || !noti.readBy.includes(currentUserId)
    if (isUnread) {
      await handleMarkOneRead(noti)
    }

    if (noti.type === 'BOOKING' && noti.relatedId) {
      setLoadingBooking(true)
      setShowBookingModal(true)
      setViewBooking(null)
      try {
        const data = await bookingApi.getBookingDetails(noti.relatedId)
        setViewBooking(data)
      } catch (err) {
        console.error('Lỗi khi tải chi tiết đơn hàng:', err)
        setViewBooking({ error: err.message || 'Không thể tải chi tiết đơn đặt vé.' })
      } finally {
        setLoadingBooking(false)
      }
    }
  }

  // Debounce tìm user theo email
  const handleEmailChange = (val) => {
    setTargetEmail(val)
    setTargetUser(null)
    setEmailError('')
    if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current)
    if (!val.trim()) return
    emailDebounceRef.current = setTimeout(async () => {
      setEmailSearching(true)
      try {
        const res = await notificationApi.searchUserByEmail(val.trim())
        setTargetUser(res.data || res)
        setEmailError('')
      } catch {
        setTargetUser(null)
        setEmailError('Không tìm thấy người dùng với email này.')
      } finally {
        setEmailSearching(false)
      }
    }, 600)
  }

  const handleSendBroadcast = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    if (targetEmail.trim() && !targetUser) {
      setSendResult({ ok: false, message: 'Email không hợp lệ hoặc không tìm thấy người dùng.' })
      return
    }
    setSending(true)
    setSendResult(null)
    try {
      const payload = { title: title.trim(), content: content.trim() }
      if (targetEmail.trim() && targetUser) payload.targetEmail = targetEmail.trim()
      await notificationApi.createBroadcast(payload)
      const recipientLabel = targetUser
        ? `${targetUser.firstName ? `${targetUser.firstName} ${targetUser.lastName || ''}`.trim() : targetUser.username || targetUser.email} (${targetUser.email})`
        : 'tất cả người dùng'
      setSendResult({ ok: true, message: `Gửi thành công đến ${recipientLabel}!` })
      setTitle('')
      setContent('')
      setTargetEmail('')
      setTargetUser(null)
      setEmailError('')
      fetchBroadcasts(1)
    } catch (err) {
      setSendResult({ ok: false, message: err.message || 'Gửi thất bại.' })
    } finally {
      setSending(false)
    }
  }

  const handleOpenDetails = (b) => {
    setSelectedBroadcast(b)
    setEditTitle(b.title || '')
    setEditContent(b.content || '')
    setIsEditing(false)
    setModalResult(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedBroadcast(null)
    setModalResult(null)
  }

  const handleUpdateBroadcast = async (e) => {
    e.preventDefault()
    if (!selectedBroadcast?._id) return
    if (!editTitle.trim() || !editContent.trim()) return
    setUpdating(true)
    setModalResult(null)
    try {
      await notificationApi.updateBroadcast(selectedBroadcast._id, {
        title: editTitle.trim(),
        content: editContent.trim()
      })
      
      // Update local broadcasts state
      setBroadcasts((prev) =>
        prev.map((item) => (item._id === selectedBroadcast._id ? { ...item, title: editTitle.trim(), content: editContent.trim() } : item))
      )
      
      setModalResult({ ok: true, message: 'Cập nhật thành công!' })
      setIsEditing(false)
      // Update selected broadcast
      setSelectedBroadcast((prev) => ({ ...prev, title: editTitle.trim(), content: editContent.trim() }))
    } catch (err) {
      setModalResult({ ok: false, message: err.message || 'Cập nhật thất bại.' })
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteBroadcast = async () => {
    if (!selectedBroadcast?._id) return
    if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo broadcast này không? Người dùng sẽ không thể xem lại thông báo này nữa.')) return
    setDeleting(true)
    setModalResult(null)
    try {
      await notificationApi.deleteBroadcast(selectedBroadcast._id)
      
      // Update list
      setBroadcasts((prev) => prev.filter((item) => item._id !== selectedBroadcast._id))
      setBroadcastTotal((prev) => Math.max(0, prev - 1))
      
      handleCloseModal()
    } catch (err) {
      setModalResult({ ok: false, message: err.message || 'Xóa thất bại.' })
    } finally {
      setDeleting(false)
    }
  }
 
  return (
    <section className="container-fluid px-2 px-md-3 px-xl-4 h-100 animate-fade-in">
      <div className="card border-0 shadow-sm h-100 d-flex flex-column">
        <div className="card-body p-3 p-md-4 d-flex flex-column">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h2 className="h4 mb-1">
                🔔 Quản lý Thông Báo
                {unreadCount > 0 && (
                  <span className="badge bg-danger ms-2 rounded-pill" style={{ fontSize: '0.75rem' }}>
                    {unreadCount}
                  </span>
                )}
              </h2>
              <p className="text-secondary mb-0 small">
                Xem thông báo realtime và gửi broadcast đến người dùng
              </p>
            </div>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => { fetchIncoming(incomingPage); fetchBroadcasts(broadcastPage) }}
            >
              🔄 Làm mới
            </button>
          </div>

          {/* Stats row */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm text-white p-3" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                <div className="small opacity-75">Tổng thông báo</div>
                <div className="fs-4 fw-bold">{incomingTotal}</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm text-white p-3" style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>
                <div className="small opacity-75">Chưa đọc</div>
                <div className="fs-4 fw-bold">{unreadCount + realtimeQueue.length}</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm text-white p-3" style={{ background: 'linear-gradient(135deg, #10b981, #047857)' }}>
                <div className="small opacity-75">Broadcast đã gửi</div>
                <div className="fs-4 fw-bold">{broadcastTotal}</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'incoming' ? 'active fw-semibold' : ''}`}
                onClick={() => setActiveTab('incoming')}
              >
                🎟️ Thông báo nhận được
                {(unreadCount + realtimeQueue.length) > 0 && (
                  <span className="badge bg-danger ms-2 rounded-pill">{unreadCount + realtimeQueue.length}</span>
                )}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'broadcast' ? 'active fw-semibold' : ''}`}
                onClick={() => setActiveTab('broadcast')}
              >
                📢 Gửi thông báo
              </button>
            </li>
          </ul>

          {activeTab === 'incoming' && (
            <div className="flex-grow-1 d-flex flex-column">
              {/* Thanh tìm kiếm Gmail / Tên / Mã đơn */}
              <div className="mb-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setIncomingPage(1);
                    fetchIncoming(1);
                  }}
                  className="d-flex gap-2"
                >
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Tìm theo Gmail khách hàng, tên, mã đơn hàng..."
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    style={{ borderRadius: '8px' }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm px-3" style={{ borderRadius: '8px' }}>
                    🔍 Tìm kiếm
                  </button>
                  {searchVal && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        setSearchVal('');
                        setIncomingPage(1);
                        setTimeout(() => fetchIncoming(1, ''), 0);
                      }}
                      style={{ borderRadius: '8px' }}
                    >
                      Xóa
                    </button>
                  )}
                </form>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-secondary small">{incomingTotal} thông báo</span>
                {(unreadCount + realtimeQueue.length) > 0 && (
                  <button className="btn btn-sm btn-outline-primary" onClick={handleMarkAllRead}>
                    ✓ Đánh dấu tất cả đã đọc
                  </button>
                )}
              </div>

              {/* Realtime banner */}
              {realtimeQueue.length > 0 && (
                <div className="mb-3">
                  <div
                    className="small fw-bold text-success mb-2 d-flex align-items-center gap-1"
                    style={{ letterSpacing: '0.03em' }}
                  >
                    <span className="badge bg-success">LIVE</span> {realtimeQueue.length} thông báo mới
                  </div>
                  {realtimeQueue.map((noti) => {
                    const isUnread = !noti.readBy || !noti.readBy.includes(currentUserId)
                    return (
                      <div
                        key={noti._id || noti.createdAt}
                        onClick={() => handleNotificationClick(noti)}
                        className="d-flex align-items-start gap-3 p-3 rounded-3 mb-2 border border-success border-opacity-25"
                        style={{
                          backgroundColor: isUnread ? '#f0fdf4' : '#fff',
                          cursor: 'pointer',
                          animation: 'slideInFav 0.3s ease',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle text-white flex-shrink-0"
                          style={{ width: 38, height: 38, backgroundColor: TYPE_COLOR[noti.type] || '#6b7280', fontSize: '1rem' }}
                        >
                          {TYPE_ICON[noti.type] || '🔔'}
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="fw-semibold text-dark" style={{ fontSize: '0.9rem' }}>{noti.title}</span>
                            <span className="badge" style={{ backgroundColor: TYPE_COLOR[noti.type], fontSize: '0.6rem' }}>
                              {TYPE_LABEL[noti.type]}
                            </span>
                            {isUnread ? (
                              <span className="badge bg-success" style={{ fontSize: '0.6rem' }}>Mới</span>
                            ) : (
                              <span className="badge bg-secondary" style={{ fontSize: '0.6rem' }}>Đã đọc</span>
                            )}
                          </div>
                          <p className="mb-0 text-secondary" style={{ fontSize: '0.83rem' }}>{noti.content}</p>
                          <small className="text-muted">{formatDateTime(noti.createdAt)}</small>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* DB notifications */}
              {loadingIncoming ? (
                <div className="text-center py-4 text-secondary">Đang tải thông báo...</div>
              ) : incoming.length === 0 && realtimeQueue.length === 0 ? (
                <div className="text-center py-5 text-secondary border rounded-3 bg-light">
                  <div className="fs-1 mb-2">🔔</div>
                  <p className="mb-0">Chưa có thông báo nào.</p>
                  <small className="text-muted">Thông báo sẽ xuất hiện khi có đặt vé hoặc đánh giá mới.</small>
                </div>
              ) : (
                <div ref={listRef} className="vstack gap-2" style={{ overflowY: 'auto', maxHeight: '480px' }}>
                  {incoming.map((noti) => {
                    const isUnread = !noti.readBy || !noti.readBy.includes(currentUserId)
                    return (
                      <div
                        key={noti._id}
                        onClick={() => handleNotificationClick(noti)}
                        className={`d-flex align-items-start gap-3 p-3 rounded-3 border ${isUnread ? 'border-primary border-opacity-25' : 'border-light'}`}
                        style={{
                          backgroundColor: isUnread ? '#eff6ff' : '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle text-white flex-shrink-0"
                          style={{ width: 38, height: 38, backgroundColor: TYPE_COLOR[noti.type] || '#6b7280', fontSize: '1rem' }}
                        >
                          {TYPE_ICON[noti.type] || '🔔'}
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="fw-semibold text-dark" style={{ fontSize: '0.9rem' }}>{noti.title}</span>
                            <span className="badge" style={{ backgroundColor: TYPE_COLOR[noti.type], fontSize: '0.6rem' }}>
                              {TYPE_LABEL[noti.type]}
                            </span>
                            {!isUnread && (
                              <span className="badge bg-secondary" style={{ fontSize: '0.6rem' }}>Đã đọc</span>
                            )}
                          </div>
                          <p className="mb-0 text-secondary" style={{ fontSize: '0.83rem' }}>{noti.content}</p>
                          <small className="text-muted">{formatDateTime(noti.createdAt)}</small>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Pagination */}
              {incomingPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                  <span className="text-secondary small">Trang {incomingPage} / {incomingPages}</span>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={incomingPage <= 1 || loadingIncoming}
                      onClick={() => { setIncomingPage(p => p - 1); fetchIncoming(incomingPage - 1) }}
                    >Trước</button>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={incomingPage >= incomingPages || loadingIncoming}
                      onClick={() => { setIncomingPage(p => p + 1); fetchIncoming(incomingPage + 1) }}
                    >Sau</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'broadcast' && (isAdmin || isStaff) && (
            <div className="flex-grow-1">
              <div className="row g-4">
                {/* Compose form */}
                <div className="col-12 col-lg-5">
                  <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f8fafc, #eff6ff)' }}>
                    <div className="card-body p-4">
                      <h5 className="fw-bold mb-1">📢 Soạn thông báo mới</h5>
                      <p className="text-secondary small mb-4">Gửi đến tất cả người dùng đang online qua realtime socket.</p>

                      <form onSubmit={handleSendBroadcast}>
                        <div className="mb-3">
                          <label className="form-label fw-semibold small">Tiêu đề thông báo *</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="VD: Khuyến mãi đặc biệt cuối tuần!"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={120}
                            required
                          />
                          <div className="text-end text-muted" style={{ fontSize: '0.72rem' }}>{title.length}/120</div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold small">Nội dung thông báo *</label>
                          <textarea
                            className="form-control"
                            rows={4}
                            placeholder="VD: Giảm 20% tất cả vé xem phim cuối tuần 7-8/6..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            maxLength={500}
                            required
                          />
                          <div className="text-end text-muted" style={{ fontSize: '0.72rem' }}>{content.length}/500</div>
                        </div>

                        <div className="mb-4">
                          <label className="form-label fw-semibold small">
                            📧 Email người nhận
                            <span className="text-muted fw-normal ms-1">(để trống = gửi tất cả)</span>
                          </label>
                          <div className="position-relative">
                            <input
                              type="email"
                              className={`form-control ${
                                targetEmail && targetUser ? 'is-valid' :
                                targetEmail && emailError ? 'is-invalid' : ''
                              }`}
                              placeholder="VD: staff@cinema.vn"
                              value={targetEmail}
                              onChange={(e) => handleEmailChange(e.target.value)}
                            />
                            {emailSearching && (
                              <span className="position-absolute top-50 end-0 translate-middle-y pe-3">
                                <span className="spinner-border spinner-border-sm text-secondary" />
                              </span>
                            )}
                          </div>
                          {targetUser && (
                            <div className="mt-2 p-2 rounded-2 d-flex align-items-center gap-2"
                              style={{ background: '#f0fdf4', border: '1px solid #86efac', fontSize: '0.82rem' }}>
                              <span>✅</span>
                              <div>
                                <strong className="text-success">
                                  {targetUser.firstName
                                    ? `${targetUser.firstName} ${targetUser.lastName || ''}`.trim()
                                    : targetUser.username || targetUser.email}
                                </strong>
                                <span className="text-muted ms-1">({targetUser.email})</span>
                                <span className="badge ms-2" style={{
                                  fontSize: '0.6rem',
                                  background: targetUser.role === 'ADMIN' ? '#7c3aed' : targetUser.role === 'STAFF' ? '#0369a1' : '#64748b'
                                }}>{targetUser.role}</span>
                              </div>
                            </div>
                          )}
                          {emailError && (
                            <div className="mt-1 text-danger" style={{ fontSize: '0.8rem' }}>❌ {emailError}</div>
                          )}
                        </div>

                        {sendResult && (
                          <div className={`alert ${sendResult.ok ? 'alert-success' : 'alert-danger'} py-2 px-3 small mb-3`}>
                            {sendResult.ok ? '✅ ' : '❌ '}{sendResult.message}
                          </div>
                        )}

                        <button
                          type="submit"
                          className="btn btn-primary w-100 fw-bold"
                          disabled={sending || !title.trim() || !content.trim() || (targetEmail.trim() && !targetUser)}
                        >
                          {sending ? (
                            <><span className="spinner-border spinner-border-sm me-2" />Đang gửi...</>
                          ) : targetUser
                              ? `📨 Gửi đến ${targetUser.firstName || targetUser.username || targetUser.email}`
                              : '📢 Gửi đến tất cả người dùng'}
                        </button>
                      </form>

                      <div className="mt-3 p-3 rounded-3 bg-warning bg-opacity-10 border border-warning border-opacity-25">
                        <p className="small mb-0 text-warning-emphasis">
                          <strong>⚠️ Lưu ý:</strong> Để trống email = gửi broadcast đến toàn bộ người dùng. Nhập email cụ thể để gửi riêng cho user/staff đó.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Broadcast history */}
                <div className="col-12 col-lg-7">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0">📋 Lịch sử broadcast ({broadcastTotal})</h5>
                  </div>

                  {loadingBroadcast ? (
                    <div className="text-center py-4 text-secondary">Đang tải...</div>
                  ) : broadcasts.length === 0 ? (
                    <div className="text-center py-5 text-secondary border rounded-3 bg-light">
                      <div className="fs-1 mb-2">📭</div>
                      <p className="mb-0">Chưa có broadcast nào được gửi.</p>
                    </div>
                  ) : (
                    <div className="vstack gap-3" style={{ maxHeight: '520px', overflowY: 'auto' }}>
                      {broadcasts.map((b) => {
                        const senderName = b.sentBy?.firstName
                          ? `${b.sentBy.firstName} ${b.sentBy.lastName || ''}`.trim()
                          : b.sentBy?.username || b.sentBy?.email || 'Admin'
                        return (
                          <div
                            key={b._id}
                            onClick={() => handleOpenDetails(b)}
                            className="card border-0 shadow-sm"
                            style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)'
                              e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)'
                              e.currentTarget.style.boxShadow = 'none'
                            }}
                          >
                            <div className="card-body p-3">
                              <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                                <div className="d-flex align-items-center gap-2">
                                  <span
                                    className="badge"
                                    style={{
                                      fontSize: '0.65rem',
                                      background: b.targetAudience === 'ALL' ? '#10b981' : '#7c3aed'
                                    }}
                                  >
                                    {b.targetAudience === 'ALL' ? '📢 BROADCAST' : '📨 RIÊNG'}
                                  </span>
                                  <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>{b.title}</span>
                                </div>
                                <small className="text-muted text-nowrap">{formatDateTime(b.createdAt)}</small>
                              </div>
                              <p className="text-secondary mb-2" style={{ fontSize: '0.83rem', whiteSpace: 'pre-line' }}>{b.content}</p>
                              <div className="d-flex align-items-center gap-3" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                <span>👤 Gửi bởi: <strong>{senderName}</strong></span>
                                {b.targetAudience === 'ALL'
                                  ? <span>👁️ {b.readBy?.length || 0} người đã đọc</span>
                                  : <span>📧 Gửi đến: <strong>{b.userId?.email || 'user cụ thể'}</strong></span>
                                }
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {broadcastPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                      <span className="text-secondary small">Trang {broadcastPage} / {broadcastPages}</span>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          disabled={broadcastPage <= 1 || loadingBroadcast}
                          onClick={() => { setBroadcastPage(p => p - 1); fetchBroadcasts(broadcastPage - 1) }}
                        >Trước</button>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          disabled={broadcastPage >= broadcastPages || loadingBroadcast}
                          onClick={() => { setBroadcastPage(p => p + 1); fetchBroadcasts(broadcastPage + 1) }}
                        >Sau</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedBroadcast && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg text-dark" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold">
                  {isEditing ? '📝 Sửa Thông Báo Broadcast' : '📢 Chi Tiết Broadcast'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal} disabled={updating || deleting} />
              </div>
              <div className="modal-body pt-3">
                {modalResult && (
                  <div className={`alert ${modalResult.ok ? 'alert-success' : 'alert-danger'} py-2 px-3 small mb-3`}>
                    {modalResult.ok ? '✅ ' : '❌ '}{modalResult.message}
                  </div>
                )}

                {isEditing ? (
                  <form onSubmit={handleUpdateBroadcast}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold small">Tiêu đề thông báo *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="VD: Khuyến mãi đặc biệt..."
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        maxLength={120}
                        required
                        disabled={updating}
                      />
                      <div className="text-end text-muted small mt-1" style={{ fontSize: '0.72rem' }}>{editTitle.length}/120</div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold small">Nội dung thông báo *</label>
                      <textarea
                        className="form-control"
                        rows={5}
                        placeholder="VD: Giảm giá..."
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        maxLength={500}
                        required
                        disabled={updating}
                      />
                      <div className="text-end text-muted small mt-1" style={{ fontSize: '0.72rem' }}>{editContent.length}/500</div>
                    </div>

                    <div className="d-flex gap-2 justify-content-end border-top pt-3 mt-3">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm px-3"
                        onClick={() => { setIsEditing(false); setModalResult(null); }}
                        disabled={updating}
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm px-3 fw-bold"
                        disabled={updating || !editTitle.trim() || !editContent.trim()}
                      >
                        {updating ? (
                          <><span className="spinner-border spinner-border-sm me-2" />Đang lưu...</>
                        ) : 'Lưu thay đổi'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="mb-3">
                      <span className="badge bg-success mb-2" style={{ fontSize: '0.7rem' }}>BROADCAST</span>
                      <h4 className="h5 fw-bold text-dark mb-1">{selectedBroadcast.title}</h4>
                      <small className="text-muted">{formatDateTime(selectedBroadcast.createdAt)}</small>
                    </div>

                    <div className="p-3 bg-light rounded-3 mb-3 text-secondary" style={{ whiteSpace: 'pre-line', fontSize: '0.9rem' }}>
                      {selectedBroadcast.content}
                    </div>

                    <div className="d-flex flex-column gap-1 border-top pt-3 mb-2" style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      <div className="d-flex align-items-center gap-1">
                        <span>👤 Gửi bởi:</span>
                        <strong className="text-dark">
                          {selectedBroadcast.sentBy?.firstName
                            ? `${selectedBroadcast.sentBy.firstName} ${selectedBroadcast.sentBy.lastName || ''}`.trim()
                            : selectedBroadcast.sentBy?.username || selectedBroadcast.sentBy?.email || 'Admin'}
                        </strong>
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <span>👁️ Người đã đọc:</span>
                        <strong className="text-dark">{selectedBroadcast.readBy?.length || 0} người</strong>
                      </div>
                    </div>

                    <div className="d-flex gap-2 justify-content-between border-top pt-3 mt-3">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                        onClick={handleDeleteBroadcast}
                        disabled={deleting}
                      >
                        🗑️ Xóa
                      </button>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm px-3"
                          onClick={() => setIsEditing(true)}
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm px-3"
                          onClick={handleCloseModal}
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal chi tiết Booking */}
      {showBookingModal && (
        <div
          className="modal d-block"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
          onClick={(e) => e.target === e.currentTarget && setShowBookingModal(false)}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="modal-header bg-dark text-white border-0 py-3 px-4">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  🎟️ Chi Tiết Đơn Đặt Vé
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowBookingModal(false)} />
              </div>
              <div className="modal-body p-4">
                {loadingBooking ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                    <p className="mt-2 text-secondary">Đang tải chi tiết đơn hàng...</p>
                  </div>
                ) : viewBooking?.error ? (
                  <div className="alert alert-danger py-3">
                    ❌ {viewBooking.error}
                  </div>
                ) : !viewBooking ? (
                  <div className="text-center py-4 text-muted">Không tìm thấy thông tin đơn hàng.</div>
                ) : (
                  <div className="row g-4">
                    {/* Mã đơn & Trạng thái */}
                    <div className="col-12 col-md-6">
                      <div className="p-3 bg-light rounded-3 h-100">
                        <small className="text-uppercase fw-bold text-secondary d-block mb-1">Mã đơn hàng</small>
                        <code className="fs-6 fw-bold text-dark">{viewBooking._id}</code>
                        
                        <div className="mt-3">
                          <small className="text-uppercase fw-bold text-secondary d-block mb-1">Trạng thái</small>
                          <span className={`badge ${
                            viewBooking.status === 'PAID' ? 'bg-success' :
                            viewBooking.status === 'PENDING' ? 'bg-warning text-dark' :
                            viewBooking.status === 'CANCELLED' ? 'bg-danger' : 'bg-info'
                          } px-3 py-2 fs-7`}>
                            {
                              viewBooking.status === 'PAID' ? 'Đã thanh toán' :
                              viewBooking.status === 'PENDING' ? 'Chờ thanh toán' :
                              viewBooking.status === 'CANCELLED' ? 'Đã hủy' : 'Đã hoàn tiền'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-3 bg-light rounded-3 h-100">
                        <small className="text-uppercase fw-bold text-secondary d-block mb-1">Phương thức thanh toán</small>
                        <span className="badge bg-secondary px-3 py-2 fs-7 text-uppercase">
                          {viewBooking.payment?.paymentMethod || 'CASH'}
                        </span>

                        <div className="mt-3">
                          <small className="text-uppercase fw-bold text-secondary d-block mb-1">Thời gian đặt</small>
                          <span className="text-dark small fw-semibold">
                            {formatDateTime(viewBooking.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Khách hàng */}
                    <div className="col-12">
                      <h6 className="fw-bold border-bottom pb-2 mb-3">👤 Thông tin khách hàng</h6>
                      <div className="row g-3">
                        <div className="col-6">
                          <small className="text-muted d-block">Tên khách hàng</small>
                          <span className="fw-semibold">
                            {viewBooking.user?.username || viewBooking.customerName || 'Khách vãng lai'}
                          </span>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Email</small>
                          <span className="fw-semibold">
                            {viewBooking.user?.email || viewBooking.customerEmail || '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Phim & Suất chiếu */}
                    <div className="col-12">
                      <h6 className="fw-bold border-bottom pb-2 mb-3">🎬 Phim & Suất chiếu</h6>
                      <div className="row g-3">
                        <div className="col-12 col-md-6">
                          <small className="text-muted d-block">Tên phim</small>
                          <span className="fw-bold text-danger" style={{ fontSize: '1.05rem' }}>
                            {viewBooking.showtime?.movie?.title || 'Phim đã xóa'}
                          </span>
                        </div>
                        <div className="col-6 col-md-3">
                          <small className="text-muted d-block">Phòng chiếu</small>
                          <span className="fw-semibold">
                            {viewBooking.showtime?.auditorium?.name || 'Phòng chiếu'}
                          </span>
                        </div>
                        <div className="col-6 col-md-3">
                          <small className="text-muted d-block">Suất chiếu</small>
                          <span className="fw-semibold text-primary">
                            {formatDateTime(viewBooking.showtime?.startTime)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Danh sách vé */}
                    {viewBooking.tickets && viewBooking.tickets.length > 0 && (
                      <div className="col-12">
                        <h6 className="fw-bold border-bottom pb-2 mb-2">🎟️ Danh sách vé ({viewBooking.tickets.length} vé)</h6>
                        <div className="table-responsive">
                          <table className="table table-sm table-hover table-bordered align-middle">
                            <thead className="table-light">
                              <tr>
                                <th style={{ width: '50px' }} className="text-center">STT</th>
                                <th>Mã vé</th>
                                <th className="text-center">Ghế</th>
                                <th className="text-end">Giá vé</th>
                              </tr>
                            </thead>
                            <tbody>
                              {viewBooking.tickets.map((t, index) => (
                                <tr key={t._id}>
                                  <td className="text-center">{index + 1}</td>
                                  <td><code>{t._id}</code></td>
                                  <td className="text-center fw-bold text-success">{t.seat?.name || 'N/A'}</td>
                                  <td className="text-end fw-semibold text-dark">{t.finalPrice?.toLocaleString('vi-VN')}đ</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Dịch vụ bắp nước (nếu có) */}
                    {viewBooking.bookingExtras && viewBooking.bookingExtras.length > 0 && (
                      <div className="col-12">
                        <h6 className="fw-bold border-bottom pb-2 mb-2">🍿 Dịch vụ bắp nước đi kèm</h6>
                        <div className="table-responsive">
                          <table className="table table-sm table-hover table-bordered align-middle">
                            <thead className="table-light">
                              <tr>
                                <th style={{ width: '50px' }} className="text-center">STT</th>
                                <th>Dịch vụ</th>
                                <th className="text-center">Số lượng</th>
                                <th className="text-end">Thành tiền</th>
                              </tr>
                            </thead>
                            <tbody>
                              {viewBooking.bookingExtras.map((extra, index) => (
                                <tr key={extra._id}>
                                  <td className="text-center">{index + 1}</td>
                                  <td>{extra.service?.name || 'Dịch vụ'}</td>
                                  <td className="text-center fw-bold">{extra.quantity}</td>
                                  <td className="text-end fw-semibold text-dark">{extra.totalPrice?.toLocaleString('vi-VN')}đ</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Tổng cộng */}
                    <div className="col-12 pt-2 border-top">
                      <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded-3">
                        <span className="fw-bold text-dark fs-5">TỔNG CỘNG:</span>
                        <span className="fw-black text-danger fs-4">{viewBooking.totalAmount?.toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 bg-light py-3">
                <button type="button" className="btn btn-secondary px-4 fw-bold" onClick={() => setShowBookingModal(false)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInFav {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </section>
  )
}
