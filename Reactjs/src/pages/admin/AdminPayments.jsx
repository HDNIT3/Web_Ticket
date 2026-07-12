import { useCallback, useEffect, useState, useMemo } from 'react'
import { getPayments, getPaymentById } from '../../services/payment.api'
import { notifyError } from '../../util/notify'

const PAYMENT_METHOD_OPTIONS = ['VNPAY', 'MOMO', 'CASH']
const BOOKING_STATUS_OPTIONS = [
  { value: 'PAID', label: 'Đã thanh toán', color: 'text-bg-success' },
  { value: 'PENDING', label: 'Chờ thanh toán', color: 'text-bg-warning' },
  { value: 'CANCELLED', label: 'Đã huỷ', color: 'text-bg-danger' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền', color: 'text-bg-info' },
]

const PAGE_SIZE = 10

function formatPrice(val) {
  if (val == null || val === '') return '-'
  return Number(val).toLocaleString('vi-VN') + 'đ'
}

function formatDateTime(val) {
  if (!val) return '-'
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return d.toLocaleString('vi-VN')
}

function getBookingStatusOption(status) {
  return BOOKING_STATUS_OPTIONS.find((o) => o.value === status) ?? { label: status ?? '-', color: 'text-bg-secondary' }
}

function getMethodBadgeColor(method) {
  if (method === 'VNPAY') return 'text-bg-primary'
  if (method === 'MOMO') return 'text-bg-danger'
  if (method === 'CASH') return 'text-bg-success'
  return 'text-bg-secondary'
}

function getUserName(user) {
  if (!user) return '-'
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim()
  return name || user.username || user.email || '-'
}

function AdminPayments() {
  const [statusCounts, setStatusCounts] = useState({ PAID: 0, PENDING: 0, CANCELLED: 0, REFUNDED: 0 })
  const [payments, setPayments] = useState([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [keyword, setKeyword] = useState('')
  const [inputKeyword, setInputKeyword] = useState('')
  const [filterMethod, setFilterMethod] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [viewItem, setViewItem] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)

  const fetchStatusCounts = useCallback(async (currentKeyword, currentMethod) => {
    try {
      const data = await getPayments({
        page: 1,
        limit: 1000,
        method: currentMethod,
        q: currentKeyword,
        status: ''
      })
      const items = data?.items ?? []
      const counts = { PAID: 0, PENDING: 0, CANCELLED: 0, REFUNDED: 0 }
      items.forEach(p => {
        const s = p.booking?.status
        if (s && counts[s] !== undefined) {
          counts[s]++
        }
      })
      setStatusCounts(counts)
    } catch (err) {
      console.error(err)
    }
  }, [])

  const fetchPayments = useCallback(async (params = {}) => {
    setLoading(true)
    setError('')
    try {
      const activeKeyword = params.q !== undefined ? params.q : keyword
      const activeMethod = params.method !== undefined ? params.method : filterMethod
      const activeStatus = params.status !== undefined ? params.status : filterStatus
      const activePage = params.page !== undefined ? params.page : page

      const data = await getPayments({
        page: activePage,
        limit: PAGE_SIZE,
        method: activeMethod,
        status: activeStatus,
        q: activeKeyword,
      })

      const items = data?.items ?? []
      setPayments(items)
      setTotalItems(data?.total ?? items.length)
      setTotalPages(data?.totalPage ?? 1)

      fetchStatusCounts(activeKeyword, activeMethod)
    } catch (err) {
      setError(err?.message ?? 'Không thể tải danh sách thanh toán.')
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [page, filterMethod, filterStatus, keyword, fetchStatusCounts])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const handleSearch = (e) => {
    e.preventDefault()
    const kw = inputKeyword.trim()
    setKeyword(kw)
    setPage(1)
    fetchPayments({ page: 1, q: kw })
  }

  const handleReset = () => {
    setInputKeyword(''); setKeyword('')
    setFilterMethod(''); setFilterStatus('')
    setPage(1)
    fetchPayments({ page: 1, method: '', status: '', q: '' })
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchPayments({ page: newPage })
  }

  const handleFilterMethod = (val) => {
    setFilterMethod(val)
    setPage(1)
    fetchPayments({ page: 1, method: val })
  }

  const handleFilterStatus = (val) => {
    setFilterStatus(val)
    setPage(1)
    fetchPayments({ page: 1, status: val })
  }

  const openView = async (item) => {
    const id = item?._id ?? item?.id
    if (!id) return
    setViewLoading(true)
    setViewItem(item) // show loading immediately
    try {
      const detail = await getPaymentById(id)
      setViewItem(detail ?? item)
    } catch {
      // fall back to list data
    } finally {
      setViewLoading(false)
    }
  }

  const closeView = () => setViewItem(null)

  // Stats from loaded payments
  const stats = useMemo(() => {
    const paid = payments.filter((p) => p.booking?.status === 'PAID')
    const total = paid.reduce((sum, p) => sum + (p.booking?.totalAmount || 0), 0)
    return { total, count: paid.length }
  }, [payments])

  return (
    <section className="container-fluid px-2 px-md-3 px-xl-4 d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
      <div className="card border-0 shadow-sm d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
        <div className="card-body p-3 p-md-4 d-flex flex-column" style={{ minHeight: 0 }}>

          {/* Header */}
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
            <div>
              <h2 className="h4 mb-1">💳 Quản lý Thanh toán</h2>
              <p className="text-secondary mb-0">
                Tổng: {totalItems} giao dịch
                {stats.count > 0 && (
                  <> · Trang này: <span className="text-success fw-semibold">{stats.count} PAID – {formatPrice(stats.total)}</span></>
                )}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => fetchPayments()}
              disabled={loading}
            >
              {loading ? <><span className="spinner-border spinner-border-sm me-1" />Đang tải...</> : '🔄 Làm mới'}
            </button>
          </div>

          {/* Summary cards */}
          <div className="row g-3 mb-4">
            {BOOKING_STATUS_OPTIONS.map((opt) => {
              const count = statusCounts[opt.value] || 0
              return (
                <div key={opt.value} className="col-6 col-md-3">
                  <div
                    className={`card border-0 text-center p-3 cursor-pointer ${filterStatus === opt.value ? 'border border-primary shadow' : ''}`}
                    style={{ background: '#f8fafc', cursor: 'pointer' }}
                    onClick={() => handleFilterStatus(filterStatus === opt.value ? '' : opt.value)}
                  >
                    <div className="fw-bold fs-4">{count}</div>
                    <span className={`badge ${opt.color} mt-1`}>{opt.label}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Filter */}
          <form className="row g-2 mb-3" onSubmit={handleSearch}>
            <div className="col-12 col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Tìm email, tên khách, phim..."
                value={inputKeyword}
                onChange={(e) => setInputKeyword(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-3">
              <select
                className="form-select"
                value={filterMethod}
                onChange={(e) => handleFilterMethod(e.target.value)}
              >
                <option value="">Tất cả phương thức</option>
                {PAYMENT_METHOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-2">
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => handleFilterStatus(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                {BOOKING_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="col-auto d-flex gap-2">
              <button type="submit" className="btn btn-outline-primary" disabled={loading}>
                {loading ? 'Đang tìm...' : 'Tìm kiếm'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleReset}
                disabled={loading || (!keyword && !inputKeyword && !filterMethod && !filterStatus)}
              >
                Làm mới
              </button>
            </div>
          </form>

          {error && <div className="alert alert-danger py-2 px-3">{error}</div>}

          {/* Table */}
          <div className="table-responsive border rounded-3 bg-white flex-grow-1 overflow-auto">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light sticky-top">
                <tr>
                  <th style={{ width: 48 }}>STT</th>
                  <th>Khách hàng</th>
                  <th>Phim</th>
                  <th>Phương thức</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                  <th>Thời gian TT</th>
                  <th className="text-end" style={{ minWidth: 90 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="text-center text-secondary py-5">
                      <div className="spinner-border spinner-border-sm me-2" />Đang tải...
                    </td>
                  </tr>
                )}
                {!loading && payments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-secondary py-5">
                      {keyword || filterMethod || filterStatus ? 'Không tìm thấy giao dịch phù hợp.' : 'Chưa có giao dịch nào.'}
                    </td>
                  </tr>
                )}
                {payments.map((item, idx) => {
                  const id = item?._id ?? item?.id
                  const booking = item?.booking
                  const user = booking?.user
                  const movie = booking?.showtime?.movie
                  const statusOpt = getBookingStatusOption(booking?.status)

                  return (
                    <tr key={id}>
                      <td className="text-center text-secondary">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td>
                        <div className="fw-semibold">{booking?.customerName || getUserName(user)}</div>
                        <small className="text-secondary">{booking?.customerPhone || user?.email || item?.email || '-'}</small>
                      </td>
                      <td>
                        <div className="small">{movie?.title || '-'}</div>
                        {booking?.showtime?.startTime && (
                          <small className="text-secondary">{formatDateTime(booking.showtime.startTime)}</small>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${getMethodBadgeColor(item?.paymentMethod)}`}>
                          {item?.paymentMethod || '-'}
                        </span>
                      </td>
                      <td className="fw-semibold text-success">{formatPrice(booking?.totalAmount)}</td>
                      <td>
                        <span className={`badge ${statusOpt.color}`}>{statusOpt.label}</span>
                      </td>
                      <td className="small text-secondary">{formatDateTime(item?.paytime ?? item?.createdAt)}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-info"
                          onClick={() => openView(item)}
                          title="Xem chi tiết"
                        >👁️</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-secondary small">
                Trang {page} / {totalPages} · {totalItems} giao dịch
              </span>
              <div className="d-flex gap-1">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >‹ Trước</button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const pageNum = totalPages <= 7 ? i + 1 : (page <= 4 ? i + 1 : (page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i))
                  return (
                    <button
                      key={pageNum}
                      className={`btn btn-sm ${page === pageNum ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => handlePageChange(pageNum)}
                    >{pageNum}</button>
                  )
                })}
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >Sau ›</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal View Detail */}
      {viewItem && (
        <div
          className="modal d-block"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
          onClick={(e) => e.target === e.currentTarget && closeView()}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">💳 Chi tiết giao dịch</h5>
                <button type="button" className="btn-close" onClick={closeView} />
              </div>
              <div className="modal-body">
                {viewLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border" /><p className="mt-2 text-secondary">Đang tải chi tiết...</p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {/* Payment info */}
                    <div className="col-12">
                      <h6 className="fw-bold text-muted text-uppercase small mb-2">📄 Thông tin thanh toán</h6>
                      <table className="table table-bordered table-sm">
                        <tbody>
                          <tr>
                            <th style={{ width: 160 }}>Mã giao dịch</th>
                            <td><code className="small">{viewItem?._id ?? viewItem?.id ?? '-'}</code></td>
                          </tr>
                          <tr>
                            <th>Phương thức</th>
                            <td>
                              <span className={`badge ${getMethodBadgeColor(viewItem?.paymentMethod)}`}>
                                {viewItem?.paymentMethod || '-'}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <th>Thời gian TT</th>
                            <td>{formatDateTime(viewItem?.paytime ?? viewItem?.createdAt)}</td>
                          </tr>
                          <tr>
                            <th>Ghi chú</th>
                            <td>{viewItem?.message || <span className="text-secondary">Không có</span>}</td>
                          </tr>
                          {viewItem?.email && <tr><th>Email TT</th><td>{viewItem.email}</td></tr>}
                          {viewItem?.number && <tr><th>Số TK</th><td>{viewItem.number}</td></tr>}
                        </tbody>
                      </table>
                    </div>

                    {/* Booking info */}
                    {viewItem?.booking && (
                      <>
                        <div className="col-12">
                          <h6 className="fw-bold text-muted text-uppercase small mb-2">🎟️ Thông tin đặt vé</h6>
                          <table className="table table-bordered table-sm">
                            <tbody>
                              <tr>
                                <th style={{ width: 160 }}>Mã booking</th>
                                <td><code className="small">{viewItem.booking._id ?? viewItem.booking.id ?? '-'}</code></td>
                              </tr>
                              <tr>
                                <th>Trạng thái</th>
                                <td>
                                  {(() => {
                                    const s = getBookingStatusOption(viewItem.booking.status)
                                    return <span className={`badge ${s.color}`}>{s.label}</span>
                                  })()}
                                </td>
                              </tr>
                              <tr>
                                <th>Tổng tiền</th>
                                <td className="text-success fw-bold">{formatPrice(viewItem.booking.totalAmount)}</td>
                              </tr>
                              <tr>
                                <th>Nguồn đặt</th>
                                <td>{viewItem.booking.bookingSource === 'COUNTER' ? '🏢 Quầy' : '🌐 Online'}</td>
                              </tr>
                              <tr>
                                <th>Ngày đặt</th>
                                <td>{formatDateTime(viewItem.booking.createdAt)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Customer info */}
                        {(viewItem.booking.user || viewItem.booking.customerName || viewItem.booking.customerPhone) && (
                          <div className="col-12">
                            <h6 className="fw-bold text-muted text-uppercase small mb-2">👤 Khách hàng</h6>
                            <table className="table table-bordered table-sm">
                              <tbody>
                                {viewItem.booking.user ? (
                                  <>
                                    <tr><th style={{ width: 160 }}>Tên</th><td>{getUserName(viewItem.booking.user)}</td></tr>
                                    <tr><th>Email</th><td>{viewItem.booking.user.email || '-'}</td></tr>
                                    <tr><th>Username</th><td>{viewItem.booking.user.username || '-'}</td></tr>
                                  </>
                                ) : (
                                  <>
                                    <tr><th style={{ width: 160 }}>Tên (Tại quầy)</th><td>{viewItem.booking.customerName || 'Khách vãng lai'}</td></tr>
                                    <tr><th>Số điện thoại</th><td>{viewItem.booking.customerPhone || '-'}</td></tr>
                                    {viewItem.booking.customerEmail && <tr><th>Email</th><td>{viewItem.booking.customerEmail}</td></tr>}
                                  </>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Movie/Showtime */}
                        {viewItem.booking.showtime && (
                          <div className="col-12">
                            <h6 className="fw-bold text-muted text-uppercase small mb-2">🎬 Phim & Suất chiếu</h6>
                            <table className="table table-bordered table-sm">
                              <tbody>
                                <tr>
                                  <th style={{ width: 160 }}>Phim</th>
                                  <td className="fw-semibold">{viewItem.booking.showtime.movie?.title || '-'}</td>
                                </tr>
                                <tr>
                                  <th>Suất chiếu</th>
                                  <td>{formatDateTime(viewItem.booking.showtime.startTime)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Tickets */}
                        {viewItem.booking.tickets && viewItem.booking.tickets.length > 0 && (
                          <div className="col-12">
                            <h6 className="fw-bold text-muted text-uppercase small mb-2">
                              🎟️ Vé ({viewItem.booking.tickets.length})
                            </h6>
                            <div className="table-responsive">
                              <table className="table table-bordered table-sm">
                                <thead className="table-light">
                                  <tr>
                                    <th>STT</th>
                                    <th>Mã vé</th>
                                    <th>Ghế</th>
                                    <th>Giá</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {viewItem.booking.tickets.map((ticket, i) => (
                                    <tr key={ticket._id ?? i}>
                                      <td>{i + 1}</td>
                                      <td><code className="small">{ticket._id ?? '-'}</code></td>
                                      <td>{ticket.seatLabel ?? ticket.seat ?? '-'}</td>
                                      <td>{formatPrice(ticket.price)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer border-0">
                <span className={`badge ${getBookingStatusOption(viewItem?.booking?.status).color} me-auto`}>
                  {getBookingStatusOption(viewItem?.booking?.status).label}
                </span>
                <button type="button" className="btn btn-secondary" onClick={closeView}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminPayments
