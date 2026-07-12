import { useEffect, useRef, useState } from 'react'
import { Provider } from 'react-redux'
import './App.css'
import store from './store/store.js'
import { AuthProvider, useAuth } from './components/context/auth.context.jsx'
import { SocketProvider } from './components/context/socket.context.jsx'
import Header from './components/layout/header.jsx'
import Footer from './components/layout/footer.jsx'
import HomePage from './pages/home.jsx'
import MoviePage from './pages/movie.jsx'
import MovieDetailPage from './pages/movie-detail.jsx'
import PromotionsPage from './pages/promotions.jsx'
import ServicesPage from './pages/services.jsx'
import LoginPage from './pages/login.jsx'
import RegisterPage from './pages/register.jsx'
import VerifyOtpPage from './pages/verify-otp.jsx'
import ForgotPasswordPage from './pages/forgot-password.jsx'
import ResetPasswordPage from './pages/reset-password.jsx'
import UserProfilePage from './pages/userProfile.jsx'
import AdminLayout from './components/layout/AdminLayout.jsx'
import BookingPage from './pages/booking-flow.jsx'
import MyTicketsPage from './pages/my-tickets.jsx'
import BookingResultPage from './pages/booking-result.jsx'
import ToastContainer from './components/layout/ToastContainer.jsx'
import UserPoints from './pages/UserPoints.jsx'
import FavoritesPage from './pages/FavoritesPage.jsx'
import WatchHistoryPage from './pages/WatchHistoryPage.jsx'
import ChatbotWidget from './components/chatbot/ChatbotWidget.jsx'

function getCurrentPage() {
  const rawHash = window.location.hash.replace(/^#/, '')

  if (rawHash) {
    return rawHash.startsWith('/') ? rawHash : `/${rawHash}`
  }

  return window.location.pathname || '/'
}

function AppShell() {
  const { isAuthenticated, isBootstrapping, isAdmin, isStaff } = useAuth()
  const [page, setPage] = useState(() => getCurrentPage())
  const [searchTerm, setSearchTerm] = useState('')
  const [flash, setFlash] = useState({ message: '', variant: 'info' })
  const authPages = ['/login', '/register', '/verify-otp', '/forgot-password', '/reset-password']

  const routePath = page.split('?')[0]
  const headerPath = routePath.startsWith('/movie/') || routePath.startsWith('/booking/') ? '/movies' : routePath
  const movieDetailId = routePath.startsWith('/movie/') ? routePath.replace('/movie/', '') : ''
  const isBookingPage = routePath.startsWith('/booking/') && !routePath.startsWith('/booking/result')
  const bookingShowtimeId = isBookingPage ? routePath.replace('/booking/', '') : ''
  const isResultPage = routePath.startsWith('/booking/result')

  const flashTimerRef = useRef(null)

  const setFlashMessage = (message, variant = 'info') => {
    setFlash({ message, variant })

    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => {
      setFlash({ message: '', variant: 'info' })
    }, 4000)
  }

  useEffect(() => {
    const path = window.location.pathname
    if (path.startsWith('/api/payment/')) {
      const search = window.location.search
      window.location.href = `/#/booking/result${search}`
    }
  }, [])

  useEffect(() => {
    const handleRouteChange = () => {
      setPage(getCurrentPage())
    }

    window.addEventListener('hashchange', handleRouteChange)
    window.addEventListener('popstate', handleRouteChange)

    handleRouteChange()

    return () => {
      window.removeEventListener('hashchange', handleRouteChange)
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [])

  useEffect(() => {
    if (!isBootstrapping && isBookingPage && !isAuthenticated) {
      setFlashMessage('Vui lòng đăng nhập để thực hiện đặt vé.', 'warning')
      handleNavigatePage('/login')
    }
  }, [isBookingPage, isAuthenticated, isBootstrapping])

  const handleNavigatePage = (nextPage = '/') => {
    const targetPage = nextPage.startsWith('/') ? nextPage : `/${nextPage}`
    const nextHash = `#${targetPage}`

    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash
    }

    setPage(targetPage)
  }

  const handleLoginSuccess = (nextPage = '/') => {
    handleNavigatePage(nextPage)
  }

  const handleForgotSent = (email) => {
    if (email) {
      handleNavigatePage(`/reset-password?email=${encodeURIComponent(email)}`)
      return
    }

    handleNavigatePage('/reset-password')
  }

  const renderRolePage = () => {
    if (page === '/admin/profile' || page === '/staff/profile') {
      return (
        <UserProfilePage
          onFlash={setFlashMessage}
          onBackHome={() => handleNavigatePage('/')}
        />
      )
    }

    if (page === '/user/profile') {
      return (
        <UserProfilePage
          onFlash={setFlashMessage}
          onBackHome={() => handleNavigatePage('/')}
        />
      )
    }

    return null
  }



  if (isBootstrapping) {
    return (
      <div className="app-shell app-shell--loading">
        <div className="loading-card">
          <div className="loading-orb" />
          <div className="loading-text">
            <p className="eyebrow mb-2">Movie Group 9</p>
            <h1 className="h3 mb-2 text-white">Đang đồng bộ phiên đăng nhập</h1>
            <p className="mb-0 text-white-50">Vui lòng chờ trong giây lát...</p>
          </div>
        </div>
      </div>
    )
  }

  const isAdminPage = routePath.startsWith('/admin') || routePath.startsWith('/staff')

  return (
    <div className={`app-shell ${isAdminPage ? 'app-shell--admin' : ''}`}>
      {!isAdminPage && (
        <Header
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onLoginClick={() => handleNavigatePage('/login')}
          onRegisterClick={() => handleNavigatePage('/register')}
          onNavigateHome={handleNavigatePage}
          onNavigatePage={handleNavigatePage}
          onFlash={setFlashMessage}
          activePage={headerPath}
        />
      )}

      <main className={`app-main ${isAdminPage ? 'p-0 m-0 border-0' : ''} ${authPages.includes(routePath) && !isAuthenticated ? 'app-main--login' : ''}`}>
        {flash.message ? (
          <div className="container-fluid px-3 px-lg-4 pt-3 pt-lg-0">
            <div className={`alert alert-${flash.variant} alert-modern mb-4`} role="alert">
              {flash.message}
            </div>
          </div>
        ) : null}

        {routePath === '/login' && !isAuthenticated ? (
          <LoginPage
            onBackHome={() => handleNavigatePage('/')}
            onLoginSuccess={handleLoginSuccess}
            onFlash={setFlashMessage}
            onForgotPassword={() => handleNavigatePage('/forgot-password')}
            onRegisterClick={() => handleNavigatePage('/register')}
          />
        ) : routePath === '/register' && !isAuthenticated ? (
          <RegisterPage
            onBackHome={() => handleNavigatePage('/')}
            onLoginClick={() => handleNavigatePage('/login')}
            onFlash={setFlashMessage}
            onRegisterSuccess={() => handleNavigatePage('/verify-otp')}
          />
        ) : routePath === '/verify-otp' && !isAuthenticated ? (
          <VerifyOtpPage
            onVerifySuccess={() => handleNavigatePage('/login')}
            onBackRegister={() => handleNavigatePage('/register')}
            onFlash={setFlashMessage}
          />
        ) : routePath === '/forgot-password' && !isAuthenticated ? (
          <ForgotPasswordPage
            onBackHome={() => handleNavigatePage('/')}
            onBackLogin={() => handleNavigatePage('/login')}
            onFlash={setFlashMessage}
            onSentOtp={handleForgotSent}
          />
        ) : routePath === '/reset-password' && !isAuthenticated ? (
          <ResetPasswordPage
            onBackForgot={() => handleNavigatePage('/forgot-password')}
            onBackLogin={() => handleNavigatePage('/login')}
            onFlash={setFlashMessage}
            onResetSuccess={() => handleNavigatePage('/login')}
          />
        ) : routePath === '/user/profile' ? (
          renderRolePage()
        ) : routePath === '/user/points' ? (
          !isAuthenticated ? (
            <div className="container mt-5 text-center py-5 bg-white rounded-4 shadow-sm border border-light max-w-md mx-auto" style={{ maxWidth: '480px' }}>
              <span className="fs-1 d-block mb-3">🔒</span>
              <h5 className="fw-bold text-dark">Yêu cầu đăng nhập</h5>
              <p className="text-secondary small mb-4">Vui lòng đăng nhập để xem điểm tích lũy của bạn.</p>
              <button className="btn btn-danger px-4 rounded-3 py-2 fw-bold" onClick={() => handleNavigatePage('/login')}>Đăng nhập ngay</button>
            </div>
          ) : (
            <UserPoints />
          )
        ) : routePath === '/user/favorites' ? (
          !isAuthenticated ? (
            <div className="container mt-5 text-center py-5 bg-white rounded-4 shadow-sm border border-light max-w-md mx-auto" style={{ maxWidth: '480px' }}>
              <span className="fs-1 d-block mb-3">🔒</span>
              <h5 className="fw-bold text-dark">Yêu cầu đăng nhập</h5>
              <p className="text-secondary small mb-4">Vui lòng đăng nhập để xem danh sách phim yêu thích của bạn.</p>
              <button className="btn btn-danger px-4 rounded-3 py-2 fw-bold" onClick={() => handleNavigatePage('/login')}>Đăng nhập ngay</button>
            </div>
          ) : (
            <FavoritesPage onNavigate={handleNavigatePage} />
          )
        ) : routePath === '/user/watch-history' ? (
          !isAuthenticated ? (
            <div className="container mt-5 text-center py-5 bg-white rounded-4 shadow-sm border border-light max-w-md mx-auto" style={{ maxWidth: '480px' }}>
              <span className="fs-1 d-block mb-3">🔒</span>
              <h5 className="fw-bold text-dark">Yêu cầu đăng nhập</h5>
              <p className="text-secondary small mb-4">Vui lòng đăng nhập để xem lịch sử phim đã xem.</p>
              <button className="btn btn-danger px-4 rounded-3 py-2 fw-bold" onClick={() => handleNavigatePage('/login')}>Đăng nhập ngay</button>
            </div>
          ) : (
            <WatchHistoryPage onNavigate={handleNavigatePage} />
          )
        ) : routePath === '/movies' ? (
          <MoviePage searchTerm={searchTerm} onOpenMovie={(id) => handleNavigatePage(`/movie/${id}`)} />
        ) : routePath === '/promotions' ? (
          <PromotionsPage />
        ) : routePath === '/services' ? (
          <ServicesPage />
        ) : routePath.startsWith('/movie/') ? (
          <MovieDetailPage
            movieId={movieDetailId}
            onBackMovies={() => handleNavigatePage('/movies')}
            onOpenMovie={(id) => handleNavigatePage(`/movie/${id}`)}
          />
        ) : routePath === '/my-tickets' ? (
          !isAuthenticated ? (
            <div className="container mt-5 text-center py-5 bg-white rounded-4 shadow-sm border border-light max-w-md mx-auto" style={{ maxWidth: '480px' }}>
              <span className="fs-1 d-block mb-3">🔒</span>
              <h5 className="fw-bold text-dark">Quyền truy cập riêng tư</h5>
              <p className="text-secondary small mb-4">Vui lòng đăng nhập tài khoản để xem và quản lý danh sách vé của bạn.</p>
              <button className="btn btn-danger px-4 rounded-3 py-2 fw-bold" onClick={() => handleNavigatePage('/login')}>Đăng nhập ngay</button>
            </div>
          ) : (
            <MyTicketsPage onNavigate={handleNavigatePage} />
          )
        ) : isBookingPage ? (
          !isAuthenticated ? null : (
            <BookingPage
              showtimeId={bookingShowtimeId}
              onNavigate={handleNavigatePage}
            />
          )
        ) : isResultPage ? (
          <BookingResultPage
            onNavigate={handleNavigatePage}
          />
        ) : isAdminPage ? (
          (!isAuthenticated) ? (
            <div className="container mt-5 text-center">
              <h4>Vui lòng đăng nhập để truy cập trang quản trị</h4>
              <button className="btn btn-primary mt-3" onClick={() => handleNavigatePage('/login')}>Đăng nhập</button>
            </div>
          ) : (!isAdmin && !isStaff) ? (
            <div className="container mt-5 text-center">
              <h4 className="text-danger">Bạn không có quyền truy cập trang quản trị</h4>
              <button className="btn btn-primary mt-3" onClick={() => handleNavigatePage('/')}>Về trang chủ</button>
            </div>
          ) : (
            <AdminLayout activePage={page} onNavigate={handleNavigatePage} />
          )
        ) : (
          <HomePage
            searchTerm={searchTerm}
            onOpenMovies={() => handleNavigatePage('/movies')}
            onOpenMovie={(id) => handleNavigatePage(`/movie/${id}`)}
          />
        )}
      </main>
      {!isAdminPage && <Footer />}
      {!isAdminPage && <ChatbotWidget onNavigate={handleNavigatePage} />}
    </div>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <SocketProvider>
          <AppShell />
          <ToastContainer />
        </SocketProvider>
      </AuthProvider>
    </Provider>
  )
}

