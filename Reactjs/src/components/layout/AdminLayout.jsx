import { useState, useEffect } from 'react'
import { useAuth } from '../context/auth.context.jsx'
import NotificationBell from './NotificationBell.jsx'
import AdminMovies from '../../pages/admin/AdminMovies.jsx'
import AdminShowtimes from '../../pages/admin/AdminShowtimes.jsx'
import AdminAuditoriums from '../../pages/admin/AdminAuditoriums.jsx'
import AdminGenres from '../../pages/admin/AdminGenres.jsx'
import AdminSeatTypes from '../../pages/admin/AdminSeatTypes.jsx'
import AdminUsers from '../../pages/admin/AdminUsers.jsx'
import TicketCheck from '../../pages/admin/TicketCheck.jsx'
import UserProfilePage from '../../pages/userProfile.jsx'
import AdminServices from '../../pages/admin/AdminServices.jsx'
import AdminPromotions from '../../pages/admin/AdminPromotions.jsx'
import AdminPayments from '../../pages/admin/AdminPayments.jsx'
import AdminReviews from '../../pages/admin/AdminReviews.jsx'
import AdminUserPoints from '../../pages/admin/AdminUserPoints.jsx'
import AdminNotifications from '../../pages/admin/AdminNotifications.jsx'
import AdminStatistics from '../../pages/admin/AdminStatistics.jsx'
import AdminRevenueStats from '../../pages/admin/AdminRevenueStats.jsx'

export default function AdminLayout({ activePage, onNavigate }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [notiBadge, setNotiBadge] = useState(0)
  const { user, isAdmin, isStaff, logout } = useAuth()

  useEffect(() => {
    const handler = () => {
      if (activePage !== '/admin/notifications' && activePage !== '/staff/notifications') {
        setNotiBadge((c) => c + 1)
      }
    }
    window.addEventListener('admin:new-notification', handler)
    return () => window.removeEventListener('admin:new-notification', handler)
  }, [activePage])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activePage === '/admin/notifications' || activePage === '/staff/notifications') setNotiBadge(0)
  }, [activePage])

  const handleLogout = async () => {
    await logout()
    onNavigate('/login')
  }

  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.username || user?.email || 'Administrator'
  const avatarText = displayName.trim().charAt(0).toUpperCase()

  let adminTabs = []
  if (isAdmin) {
    adminTabs = [
      { to: '/admin/statistics', label: 'Tổng quan', icon: '📊' },
      { to: '/admin/revenue-stats', label: 'Doanh thu', icon: '💰' },
      { to: '/admin/users', label: 'Quản lí người dùng', icon: '👥' },
      { to: '/admin/movies', label: 'Quản lý Phim', icon: '🎬' },
      { to: '/admin/genres', label: 'Thể loại', icon: '🗂️' },
      { to: '/admin/seat-types', label: 'Loại Ghế', icon: '💺' },
      { to: '/admin/auditoriums', label: 'Phòng Chiếu', icon: '🏗️' },
      { to: '/admin/showtimes', label: 'Lịch Chiếu', icon: '📅' },
      { to: '/admin/services', label: 'Dịch vụ', icon: '🍿' },
      { to: '/admin/promotions', label: 'Khuyến mãi', icon: '🎁' },
      { to: '/admin/payments', label: 'Thanh toán', icon: '💳' },
      { to: '/admin/reviews', label: 'Đánh giá phim', icon: '⭐' },
      { to: '/admin/user-points', label: 'Quản lý điểm', icon: '🏆' },
      { to: '/admin/notifications', label: 'Thông báo', icon: '🔔', badge: notiBadge },
    ]
  } else if (isStaff) {
    adminTabs = [
      { to: '/staff/dashboard', label: 'Tổng quan', icon: '📊' },
      { to: '/staff/check-ticket', label: 'Kiểm tra vé', icon: '🎟️' },
      { to: '/staff/movies', label: 'Quản lý Phim', icon: '🎬' },
      { to: '/staff/genres', label: 'Thể loại', icon: '🗂️' },
      { to: '/staff/seat-types', label: 'Loại Ghế', icon: '💺' },
      { to: '/staff/auditoriums', label: 'Phòng Chiếu', icon: '🏛️' },
      { to: '/staff/showtimes', label: 'Lịch Chiếu', icon: '📅' },
      { to: '/staff/services', label: 'Dịch vụ', icon: '🍿' },
      { to: '/staff/promotions', label: 'Khuyến mãi', icon: '🎁' },
      { to: '/staff/payments', label: 'Thanh toán', icon: '💳' },
      { to: '/staff/reviews', label: 'Đánh giá phim', icon: '⭐' },
      { to: '/staff/notifications', label: 'Thông báo', icon: '🔔', badge: notiBadge },
    ]
  }

  const renderContent = () => {
    switch (activePage) {
      case '/admin/dashboard':
      case '/staff/dashboard':
      case '/admin/statistics': return <AdminStatistics />
      case '/admin/revenue-stats': return <AdminRevenueStats />
      case '/admin/users': return <AdminUsers />
      case '/admin/movies':
      case '/staff/movies': return <AdminMovies />
      case '/admin/genres':
      case '/staff/genres': return <AdminGenres />
      case '/admin/seat-types':
      case '/staff/seat-types': return <AdminSeatTypes />
      case '/admin/auditoriums':
      case '/staff/auditoriums': return <AdminAuditoriums />
      case '/admin/showtimes':
      case '/staff/showtimes': return <AdminShowtimes />
      case '/staff/check-ticket': return <TicketCheck />
      case '/admin/services':
      case '/staff/services': return <AdminServices />
      case '/admin/promotions':
      case '/staff/promotions': return <AdminPromotions />
      case '/admin/payments':
      case '/staff/payments': return <AdminPayments />
      case '/admin/reviews':
      case '/staff/reviews': return <AdminReviews />
      case '/admin/notifications':
      case '/staff/notifications': return <AdminNotifications />
      case '/admin/user-points': return <AdminUserPoints />
      case '/admin/profile':
      case '/staff/profile': return <UserProfilePage onBackHome={() => onNavigate('/')} />
      default: return <AdminStatistics />
    }
  }

  return (
    <div className="d-flex bg-body-tertiary text-dark" style={{ height: '100vh', overflow: 'hidden' }}>
      <aside
        className="d-flex flex-column text-white shadow"
        style={{
          width: isSidebarOpen ? '274px' : '88px',
          minWidth: isSidebarOpen ? '274px' : '88px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          transition: 'width 0.28s ease',
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        }}
      >
        <div className="border-bottom border-secondary-subtle px-3 d-flex align-items-center" style={{ minHeight: '76px' }}>
          <div className="d-flex align-items-center gap-2 w-100" style={{ cursor: 'pointer' }} onClick={() => onNavigate('/')}>
            <span className="badge rounded-pill text-bg-warning px-2 py-2">CM</span>
            {isSidebarOpen ? <span className="fw-bold text-uppercase small">Cinema Manager</span> : null}
          </div>
        </div>

        <nav className="flex-grow-1 p-3 sidebar-nav" style={{ overflowY: 'auto' }}>
          <ul className="nav flex-column gap-2">
            {adminTabs.map((item) => {
              const isActive = activePage === item.to || (activePage.startsWith('/admin') && item.to === '/admin/dashboard' && activePage === '/admin') || (activePage.startsWith('/staff') && item.to === '/staff/dashboard' && activePage === '/staff')
              return (
                <li className="nav-item" key={item.to}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.to)}
                    className={`nav-link w-100 text-start rounded-3 d-flex align-items-center border-0 ${isActive ? 'bg-primary text-white shadow-sm' : 'text-light-emphasis bg-transparent'}`}
                    style={{ gap: '12px', padding: '11px 12px' }}
                    title={!isSidebarOpen ? item.label : ''}
                  >
                    <span className="fs-6">{item.icon}</span>
                    {isSidebarOpen ? <span className="small fw-semibold text-truncate">{item.label}</span> : null}
                    {item.badge > 0 && (
                      <span className="badge bg-danger rounded-pill ms-auto" style={{ fontSize: '0.6rem', minWidth: '18px' }}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>


      </aside>

      <div className="flex-grow-1 d-flex flex-column min-w-0" style={{ height: '100vh', overflow: 'hidden' }}>
        <header className="bg-white border-bottom shadow-sm px-3 px-md-4 py-3" style={{ position: 'sticky', top: 0, zIndex: 20 }}>
          <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                ☰
              </button>
              <div>
                <h1 className="h5 mb-0">Quản lý Hệ thống</h1>
                <p className="text-secondary mb-0 small d-none d-sm-block">Trang dành cho nhân viên quản trị</p>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              {(isAdmin || isStaff) && (
                <NotificationBell navigateToPage={onNavigate} dark={true} />
              )}

              <div className="d-flex align-items-center profile-menu position-relative">
              <button
                type="button"
                className="btn d-flex align-items-center gap-2 border-0 bg-transparent text-start"
                onClick={() => setProfileMenuOpen((current) => !current)}
              >
                <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center fw-bold" style={{ width: 38, height: 38 }}>
                  {avatarText || 'A'}
                </div>
                <div className="d-none d-md-block text-dark">
                  <div className="fw-semibold lh-1">{displayName}</div>
                  <small className="badge text-bg-primary mt-1">{user?.role || 'ADMIN'}</small>
                </div>
                <span className="dropdown-caret text-secondary ms-1">▾</span>
              </button>

              {profileMenuOpen ? (
                <div className="profile-dropdown shadow-sm border" style={{ background: '#fff', borderRadius: '16px', right: '10px' }}>
                  <div className="profile-summary text-dark border-bottom-0 pb-1">
                    <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center fw-bold" style={{ width: 38, height: 38 }}>
                      {avatarText || 'A'}
                    </div>
                    <div>
                      <strong>{displayName}</strong>
                      <p className="mb-0 small text-secondary">{user?.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}</p>
                    </div>
                  </div>
                  <div className="border-top my-1"></div>
                  <button
                    type="button"
                    className="dropdown-item-custom text-dark"
                    onClick={() => {
                      onNavigate(isAdmin ? '/admin/profile' : '/staff/profile')
                      setProfileMenuOpen(false)
                    }}
                  >
                    Hồ sơ của tôi
                  </button>
                  <button
                    type="button"
                    className="dropdown-item-custom text-dark"
                    onClick={() => {
                      onNavigate('/')
                      setProfileMenuOpen(false)
                    }}
                  >
                    Xem màn hình khách
                  </button>
                  <button
                    type="button"
                    className="dropdown-item-custom text-danger"
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </button>
                </div>
                ) : null}
            </div>
            </div>
          </div>
        </header>

        <main className="flex-grow-1 overflow-auto p-3 p-md-4 d-flex flex-column" style={{ background: 'linear-gradient(180deg, #eef2ff 0%, #f8fafc 48%, #f1f5f9 100%)', overscrollBehavior: 'contain' }}>
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
