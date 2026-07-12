import { useState, useEffect, useCallback } from 'react'
import { getUsersByAdmin, updateUserByAdmin } from '../../services/user.api.js'
import { notifyError, notifySuccess } from '../../util/notify.js'

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value))
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  // Filters
  const [searchVal, setSearchVal] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Edit Modal State
  const [selectedUser, setSelectedUser] = useState(null)
  const [editRole, setEditRole] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const fetchUsers = useCallback(async (targetPage = 1) => {
    setLoading(true)
    try {
      const data = await getUsersByAdmin({
        page: targetPage,
        limit: 10,
        q: searchVal,
        role: roleFilter,
        status: statusFilter
      })
      setUsers(data.items || [])
      setTotal(data.total || 0)
      setPage(data.page || 1)
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      console.error(err)
      notifyError(err.message || 'Lỗi hệ thống khi tải danh sách người dùng.')
    } finally {
      setLoading(false)
    }
  }, [searchVal, roleFilter, statusFilter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers(1)
  }, [roleFilter, statusFilter, fetchUsers])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchUsers(1)
  }

  const handleResetFilters = () => {
    setSearchVal('')
    setRoleFilter('')
    setStatusFilter('')
    setTimeout(() => {
      getUsersByAdmin({ page: 1, limit: 10 }).then(data => {
        setUsers(data.items || [])
        setTotal(data.total || 0)
        setPage(data.page || 1)
        setTotalPages(data.totalPages || 1)
      }).catch(err => {
        console.error(err)
        notifyError(err.message || 'Lỗi khi đặt lại bộ lọc.')
      })
    }, 0)
  }

  const handleOpenModal = (user) => {
    setSelectedUser(user)
    setEditRole(user.role || 'USER')
    setEditStatus(user.status || 'PENDING')
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setSelectedUser(null)
    setShowModal(false)
  }

  const handleSaveChanges = async (e) => {
    e.preventDefault()
    if (!selectedUser) return
    setSaving(true)
    try {
      await updateUserByAdmin(selectedUser.id, {
        role: editRole,
        status: editStatus
      })
      notifySuccess('Cập nhật người dùng thành công!')
      handleCloseModal()
      fetchUsers(page)
    } catch (err) {
      console.error(err)
      notifyError(err.message || 'Lỗi khi cập nhật thông tin người dùng.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="container-fluid px-2 px-md-3 px-xl-4 h-100 animate-fade-in">
      <div className="card border-0 shadow-sm h-100 d-flex flex-column" style={{ borderRadius: '16px' }}>
        <div className="card-body p-3 p-md-4 d-flex flex-column">

          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <h2 className="h4 mb-1 fw-bold text-dark">
                👤 Quản Lý Người Dùng
              </h2>
              <p className="text-secondary mb-0 small">
                Xem danh sách người dùng, thay đổi vai trò (cấp quyền nhân viên) và quản lý trạng thái tài khoản.
              </p>
            </div>
            <button
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
              style={{ borderRadius: '8px' }}
              onClick={() => fetchUsers(page)}
              disabled={loading}
            >
              🔄 {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>

          {/* Search & Filters */}
          <div className="bg-light p-3 rounded-4 mb-4 border border-light-subtle">
            <form onSubmit={handleSearchSubmit} className="row g-3 align-items-end">
              <div className="col-12 col-md-5 col-lg-4">
                <label className="form-label small fw-semibold text-secondary">Từ khóa tìm kiếm</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Email, username, SĐT, họ tên..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  style={{ borderRadius: '10px' }}
                />
              </div>

              <div className="col-6 col-md-3 col-lg-2">
                <label className="form-label small fw-semibold text-secondary">Vai trò</label>
                <select
                  className="form-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{ borderRadius: '10px' }}
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="USER">Khách hàng (USER)</option>
                  <option value="STAFF">Nhân viên (STAFF)</option>
                  <option value="ADMIN">Quản trị (ADMIN)</option>
                </select>
              </div>

              <div className="col-6 col-md-3 col-lg-2">
                <label className="form-label small fw-semibold text-secondary">Trạng thái</label>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ borderRadius: '10px' }}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                  <option value="PENDING">Chờ kích hoạt (PENDING)</option>
                  <option value="INACTIVE">Khóa (INACTIVE)</option>
                </select>
              </div>

              <div className="col-12 col-md-4 col-lg-4 d-flex gap-2">
                <button type="submit" className="btn btn-primary px-3 flex-grow-1" style={{ borderRadius: '10px' }} disabled={loading}>
                  🔍 Tìm kiếm
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary px-3"
                  onClick={handleResetFilters}
                  style={{ borderRadius: '10px' }}
                  disabled={loading}
                >
                  Đặt lại
                </button>
              </div>
            </form>
          </div>

          {/* Table */}
          <div className="flex-grow-1 table-responsive" style={{ minHeight: '350px' }}>
            {loading ? (
              <div className="d-flex justify-content-center align-items-center py-5 h-100">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-5 text-secondary border rounded-4 bg-light d-flex flex-column align-items-center justify-content-center h-100">
                <div className="fs-1 mb-2">👥</div>
                <h5 className="fw-bold text-dark">Không tìm thấy người dùng nào</h5>
                <p className="small text-muted mb-0">Thử thay đổi từ khóa hoặc bộ lọc để tìm kiếm.</p>
              </div>
            ) : (
              <table className="table table-hover align-middle border-light-subtle">
                <thead className="table-light text-secondary">
                  <tr>
                    <th scope="col" className="ps-3" style={{ borderTopLeftRadius: '12px' }}>Người dùng</th>
                    <th scope="col">Thông tin liên hệ</th>
                    <th scope="col" className="text-center">Điểm tích lũy</th>
                    <th scope="col" className="text-center">Vai trò</th>
                    <th scope="col" className="text-center">Trạng thái</th>
                    <th scope="col" className="text-center">Ngày đăng ký</th>
                    <th scope="col" className="text-center pe-3" style={{ borderTopRightRadius: '12px', width: '150px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const initials = (u.firstName ? u.firstName.charAt(0) : u.username ? u.username.charAt(0) : 'U').toUpperCase()
                    const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || 'Chưa cập nhật'

                    return (
                      <tr key={u.id}>
                        <td className="ps-3 py-3">
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                              style={{ width: '40px', height: '40px', fontSize: '1.1rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                            >
                              {initials}
                            </div>
                            <div>
                              <div className="fw-bold text-dark">{fullName}</div>
                              <small className="text-muted">@{u.username || 'no-username'}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="small text-dark fw-medium">{u.email}</div>
                          <small className="text-secondary">{u.phoneNumber || 'SĐT: Chưa có'}</small>
                        </td>
                        <td className="text-center fw-semibold text-primary">{u.loyaltyPoints?.toLocaleString('vi-VN') || 0}</td>
                        <td className="text-center">
                          <span
                            className={`badge px-3 py-2 rounded-pill fw-semibold ${
                              u.role === 'ADMIN'
                                ? 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25'
                                : u.role === 'STAFF'
                                ? 'bg-info bg-opacity-10 text-info border border-info border-opacity-25'
                                : 'bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25'
                            }`}
                            style={{ fontSize: '0.75rem' }}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="text-center">
                          <span
                            className={`badge px-3 py-2 rounded-pill fw-semibold ${
                              u.status === 'ACTIVE'
                                ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'
                                : u.status === 'PENDING'
                                ? 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25'
                                : 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25'
                            }`}
                            style={{ fontSize: '0.75rem' }}
                          >
                            {u.status === 'ACTIVE' ? 'Hoạt động' : u.status === 'PENDING' ? 'Chờ kích hoạt' : 'Bị khóa'}
                          </span>
                        </td>
                        <td className="text-center text-secondary small">{formatDate(u.createdAt)}</td>
                        <td className="text-center pe-3">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary fw-semibold px-3"
                            style={{ borderRadius: '8px' }}
                            onClick={() => handleOpenModal(u)}
                          >
                            ⚙️ Phân quyền
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <span className="text-secondary small">Hiển thị trang {page} / {totalPages} (Tổng số {total} người dùng)</span>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-secondary btn-sm px-3"
                  disabled={page <= 1}
                  onClick={() => fetchUsers(page - 1)}
                  style={{ borderRadius: '8px' }}
                >
                  Trước
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm px-3"
                  disabled={page >= totalPages}
                  onClick={() => fetchUsers(page + 1)}
                  style={{ borderRadius: '8px' }}
                >
                  Sau
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Edit User Role/Status Modal */}
      {showModal && selectedUser && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg text-dark" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-bold text-dark">⚙️ Thiết Lập Quyền Hạn</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal} disabled={saving} />
              </div>
              <form onSubmit={handleSaveChanges}>
                <div className="modal-body p-4">
                  {/* User preview */}
                  <div className="p-3 bg-light rounded-4 mb-4 border border-light-subtle d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                      style={{ width: '46px', height: '46px', fontSize: '1.2rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    >
                      {(selectedUser.firstName ? selectedUser.firstName.charAt(0) : selectedUser.username ? selectedUser.username.charAt(0) : 'U').toUpperCase()}
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0 text-dark">
                        {[selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(' ') || selectedUser.username}
                      </h6>
                      <small className="text-secondary">{selectedUser.email}</small>
                    </div>
                  </div>

                  {/* Role selection */}
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">Vai trò hệ thống</label>
                    <select
                      className="form-select form-select-lg"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      style={{ borderRadius: '10px', fontSize: '0.95rem' }}
                      required
                    >
                      <option value="USER">Khách hàng (USER) - Chỉ được phép xem phim, đặt vé</option>
                      <option value="STAFF">Nhân viên (STAFF) - Quản lý suất chiếu, dịch vụ, bán vé & hỗ trợ khách hàng</option>
                      <option value="ADMIN">Quản trị viên (ADMIN) - Toàn quyền quản trị hệ thống</option>
                    </select>
                  </div>

                  {/* Status selection */}
                  <div className="mb-4">
                    <label className="form-label fw-bold small text-secondary">Trạng thái tài khoản</label>
                    <select
                      className="form-select form-select-lg"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      style={{ borderRadius: '10px', fontSize: '0.95rem' }}
                      required
                    >
                      <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                      <option value="PENDING">Chờ kích hoạt (PENDING)</option>
                      <option value="INACTIVE">Khóa tài khoản (INACTIVE) - Người dùng không thể đăng nhập</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top-0 pt-0 pb-4 px-4 d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 flex-grow-1"
                    onClick={handleCloseModal}
                    style={{ borderRadius: '10px' }}
                    disabled={saving}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 flex-grow-1"
                    style={{ borderRadius: '10px' }}
                    disabled={saving}
                  >
                    {saving ? (
                      <><span className="spinner-border spinner-border-sm me-2" />Đang lưu...</>
                    ) : (
                      'Lưu thay đổi'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
