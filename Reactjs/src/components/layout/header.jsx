import { useState } from 'react'
import { useAuth } from '../context/auth.context.jsx'
import NotificationBell from './NotificationBell.jsx'

function Avatar({ name, avatarUrl }) {
  const initials = (name || 'MV')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return <span className="avatar-circle">{avatarUrl ? <img src={avatarUrl} alt={name} /> : initials}</span>
}

export default function Header({ searchTerm, onSearchChange, onLoginClick, onRegisterClick, onNavigateHome, onNavigatePage, onFlash, activePage }) {
  const { isAuthenticated, user, logout } = useAuth()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileName = user?.username || user?.email || 'Người xem'
  const isManager = user?.role === 'ADMIN' || user?.role === 'STAFF'
  const profilePage = isManager ? '/admin/dashboard' : '/user/profile'
  const tabs = [
    { label: 'Home', path: '/' },
    { label: 'Movies', path: '/movies' },
    { label: 'Promotions', path: '/promotions' },
    { label: 'Services', path: '/services' },
  ]

  const activeTab = activePage || window.location.hash.replace(/^#/, '') || '/'
  const headerActiveTab = activeTab.startsWith('/movie/') ? '/movies' : activeTab

  return (
    <header className="app-header navbar navbar-expand-lg navbar-dark fixed-top">
      <div className="container-fluid px-3 px-lg-4 py-2 gap-3 header-inner">
        <button className="brand-mark btn btn-link p-0 text-decoration-none" type="button" onClick={onNavigateHome}>
          <span className="brand-logo">CH</span>
          <span className="brand-text">
            <strong>CinemaHCMUTE</strong>
            <small>Trải nghiệm điện ảnh đỉnh cao</small>
          </span>
        </button>

        <nav className="header-tabs order-3 order-lg-2">
          {tabs.map((tab) => (
            <button
              key={tab.path}
              type="button"
              className={`header-tab ${headerActiveTab === tab.path ? 'header-tab--active' : ''}`}
              onClick={() => (onNavigatePage || onNavigateHome)(tab.path)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="header-search flex-grow-1 order-2 order-lg-3">
          <div className="search-box">
            <span className="search-icon">⌕</span>
            <input
              type="search"
              className="form-control"
              placeholder="Tìm phim, thể loại, diễn viên..."
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
        </div>

        <div className="header-actions order-4 order-lg-4 d-flex align-items-center gap-2">
          {isAuthenticated ? (
            <>
              <NotificationBell navigateToPage={onNavigatePage || onNavigateHome} />
              
              <div className="profile-menu">
                <button
                  type="button"
                  className="btn btn-profile"
                  onClick={() => setProfileMenuOpen((current) => !current)}
                >
                  <Avatar name={profileName} avatarUrl={user?.avatarUrl} />
                  <span className="d-none d-md-inline text-start">
                    <strong>{profileName}</strong>
                    <small>Tài khoản</small>
                  </span>
                  <span className="dropdown-caret">▾</span>
                </button>

                {profileMenuOpen ? (
                  <div className="profile-dropdown shadow-lg">
                    <div className="profile-summary">
                      <Avatar name={profileName} avatarUrl={user?.avatarUrl} />
                      <div>
                        <strong>{profileName}</strong>
                        <p>{user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'STAFF' ? 'Nhân viên' : 'Người xem'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="dropdown-item-custom"
                      onClick={() => {
                        onNavigateHome(profilePage)
                        setProfileMenuOpen(false)
                      }}
                    >
                      {isManager ? 'Trang quản trị' : 'Hồ sơ của tôi'}
                    </button>
                    <button
                      type="button"
                      className="dropdown-item-custom"
                      onClick={() => {
                        onNavigateHome('/my-tickets')
                        setProfileMenuOpen(false)
                      }}
                    >
                      Vé của tôi 🎟️
                    </button>
                    {!isManager && (
                      <button
                        type="button"
                        className="dropdown-item-custom"
                        onClick={() => {
                          onNavigateHome('/user/points')
                          setProfileMenuOpen(false)
                        }}
                      >
                        Điểm tích lũy ⭐
                      </button>
                    )}
                    <button
                      type="button"
                      className="dropdown-item-custom"
                      onClick={() => {
                        onNavigateHome('/user/favorites')
                        setProfileMenuOpen(false)
                      }}
                    >
                      Phim yêu thích ❤️
                    </button>
                    <button
                      type="button"
                      className="dropdown-item-custom"
                      onClick={() => {
                        onNavigateHome('/user/watch-history')
                        setProfileMenuOpen(false)
                      }}
                    >
                      Lịch sử đã xem 🎬
                    </button>
                    <button
                      type="button"
                      className="dropdown-item-custom dropdown-item-custom--danger"
                      onClick={async () => {
                        await logout()
                        setProfileMenuOpen(false)
                        onFlash('Bạn đã đăng xuất khỏi thiết bị này.', 'info')
                        onNavigateHome()
                      }}
                    >
                      Đăng xuất
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-login" onClick={onLoginClick}>
                Đăng nhập
              </button>
              <button type="button" className="btn btn-outline-light btn-signup" onClick={onRegisterClick}>
                Đăng ký
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

