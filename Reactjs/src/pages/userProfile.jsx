import { useEffect, useState } from 'react'
import { useAuth } from '../components/context/auth.context.jsx'
import { getProfile, updateProfile } from '../services/user.api.js'

const emptyForm = { firstName: '', lastName: '', address: '', phoneNumber: '' }

function getRoleLabel(role) {
  if (role === 'ADMIN') return 'Quản trị viên'
  if (role === 'STAFF') return 'Nhân viên'
  return 'Thành viên'
}

function getRoleClass(role) {
  if (role === 'ADMIN') return 'role-admin'
  if (role === 'STAFF') return 'role-staff'
  return 'role-user'
}

export default function UserProfilePage({ onFlash, onBackHome }) {
  const { user, syncUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await getProfile()
        if (!alive) return
        setProfile(data)
        setForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          address: data.address || '',
          phoneNumber: data.phoneNumber || '',
        })
        syncUser({ ...(user || {}), ...data })
        setStatus({ type: '', message: '' })
      } catch (err) {
        if (!alive) return
        const message = err.message || 'Không thể tải hồ sơ.'
        setStatus({ type: 'error', message })
        if (typeof onFlash === 'function') onFlash(message, 'danger')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setStatus({ type: '', message: '' })

    const payload = {}
    if (form.firstName !== (profile?.firstName || '')) payload.firstName = form.firstName
    if (form.lastName !== (profile?.lastName || '')) payload.lastName = form.lastName
    if (form.address !== (profile?.address || '')) payload.address = form.address
    if (form.phoneNumber !== (profile?.phoneNumber || '')) payload.phoneNumber = form.phoneNumber

    if (!Object.keys(payload).length) {
      const message = 'Chưa có thay đổi nào để lưu.'
      setStatus({ type: 'info', message })
      if (typeof onFlash === 'function') onFlash(message, 'info')
      setSaving(false)
      return
    }

    try {
      const updated = await updateProfile(payload)
      setProfile(updated)
      setForm({
        firstName: updated.firstName || '',
        lastName: updated.lastName || '',
        address: updated.address || '',
        phoneNumber: updated.phoneNumber || '',
      })
      syncUser({ ...(user || {}), ...updated })
      const message = 'Cập nhật hồ sơ thành công!'
      setStatus({ type: 'success', message })
      if (typeof onFlash === 'function') onFlash(message, 'success')
    } catch (err) {
      const message = err.message || 'Cập nhật thất bại.'
      setStatus({ type: 'error', message })
      if (typeof onFlash === 'function') onFlash(message, 'danger')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
        <p className="mt-3 text-muted">Đang tải thông tin cá nhân...</p>
      </div>
    )
  }

  const alertVariant =
    status.type === 'success' ? 'success' : status.type === 'info' ? 'info' : status.type === 'error' ? 'danger' : ''

  return (
    <div className="container py-5">
      <style>{`
        .profile-card {
          background: rgba(11, 19, 35, 0.7) !important;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 22px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3) !important;
          overflow: hidden;
        }
        .profile-sidebar {
          background: linear-gradient(180deg, rgba(21, 32, 54, 0.95) 0%, rgba(10, 15, 28, 0.98) 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
        }
        .profile-main {
          background: rgba(13, 22, 38, 0.25) !important;
          color: #e2e8f0;
        }
        .profile-avatar {
          background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%) !important;
          color: #fff !important;
          box-shadow: 0 8px 24px rgba(79, 70, 229, 0.35);
          border: 3px solid rgba(255, 255, 255, 0.1) !important;
        }
        .profile-role-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 16px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }
        .role-admin {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.35);
        }
        .role-staff {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.35);
        }
        .role-user {
          background: rgba(148, 163, 184, 0.15);
          color: #94a3b8;
          border: 1px solid rgba(148, 163, 184, 0.35);
        }
        .profile-label {
          color: #94a3b8 !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .profile-input {
          background: rgba(10, 15, 28, 0.6) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          color: #f1f5f9 !important;
          border-radius: 12px !important;
          padding: 12px 16px !important;
          transition: all 0.25s ease;
        }
        .profile-input:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important;
          background: rgba(10, 15, 28, 0.8) !important;
        }
        .profile-input::placeholder {
          color: #4b5563 !important;
        }
        .profile-btn-submit {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
          border: none !important;
          padding: 14px !important;
          border-radius: 12px !important;
          font-weight: 700 !important;
          font-size: 15px !important;
          letter-spacing: 0.5px;
          color: #fff !important;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3) !important;
          transition: all 0.2s ease;
        }
        .profile-btn-submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45) !important;
          background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%) !important;
        }
        .profile-btn-submit:disabled {
          opacity: 0.6;
          transform: none !important;
          box-shadow: none !important;
        }
        .profile-btn-back {
          color: #94a3b8 !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-radius: 10px !important;
          font-weight: 600 !important;
          background: transparent !important;
          transition: all 0.2s ease;
        }
        .profile-btn-back:hover {
          color: #f1f5f9 !important;
          background: rgba(255, 255, 255, 0.06) !important;
          border-color: rgba(255, 255, 255, 0.25) !important;
        }
        .profile-alert-success {
          background: rgba(16, 185, 129, 0.1) !important;
          border: 1px solid rgba(16, 185, 129, 0.2) !important;
          color: #34d399 !important;
          border-radius: 12px !important;
        }
        .profile-alert-info {
          background: rgba(59, 130, 246, 0.1) !important;
          border: 1px solid rgba(59, 130, 246, 0.2) !important;
          color: #60a5fa !important;
          border-radius: 12px !important;
        }
        .profile-alert-danger {
          background: rgba(239, 68, 68, 0.1) !important;
          border: 1px solid rgba(239, 68, 68, 0.2) !important;
          color: #f87171 !important;
          border-radius: 12px !important;
        }
      `}</style>

      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card border-0 profile-card">
            <div className="row g-0">
              <div className="col-md-4 profile-sidebar p-4 p-lg-5 d-flex flex-column justify-content-center align-items-center text-center">
                <div className="mb-4">
                  <div className="avatar-placeholder rounded-circle profile-avatar d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '100px', height: '100px', fontSize: '2.5rem', fontWeight: 'bold' }}>
                    {(profile?.firstName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <h3 className="h4 mb-1">{profile?.firstName} {profile?.lastName}</h3>
                  <span className={`profile-role-badge ${getRoleClass(profile?.role)} mb-3`}>
                    {getRoleLabel(profile?.role)}
                  </span>
                </div>
                <div className="w-100 pt-3 border-top border-white border-opacity-10">
                  <p className="small mb-1 opacity-50">Email liên hệ</p>
                  <p className="fw-medium text-light opacity-90">{profile?.email}</p>
                </div>
              </div>

              <div className="col-md-8 p-4 p-lg-5 profile-main">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2 className="h4 mb-0 fw-bold text-white">Thiết lập hồ sơ</h2>
                  <button type="button" className="btn btn-sm profile-btn-back" onClick={onBackHome}>
                    <i className="bi bi-arrow-left me-1"></i> Quay lại
                  </button>
                </div>

                {status.message && (
                  <div className={`alert profile-alert-${alertVariant} d-flex align-items-center mb-4`} role="alert">
                    <div>{status.message}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label profile-label text-uppercase">Họ</label>
                      <input
                        type="text"
                        className="form-control form-control-lg profile-input"
                        value={form.lastName}
                        onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))}
                        placeholder="Nguyễn"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label profile-label text-uppercase">Tên</label>
                      <input
                        type="text"
                        className="form-control form-control-lg profile-input"
                        value={form.firstName}
                        onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))}
                        placeholder="An"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label profile-label text-uppercase">Số điện thoại</label>
                      <input
                        type="tel"
                        className="form-control form-control-lg profile-input"
                        value={form.phoneNumber}
                        onChange={(e) => setForm((s) => ({ ...s, phoneNumber: e.target.value }))}
                        placeholder="09xxx"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label profile-label text-uppercase">Địa chỉ</label>
                      <textarea
                        className="form-control form-control-lg profile-input"
                        rows="2"
                        value={form.address}
                        onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                        placeholder="Nhập địa chỉ của bạn"
                      />
                    </div>

                    <div className="col-12 mt-4">
                      <button 
                        type="submit" 
                        className="btn profile-btn-submit btn-lg w-100 shadow-sm" 
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Đang lưu...
                          </>
                        ) : 'Cập nhật thay đổi'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}