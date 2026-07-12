import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../components/context/auth.context.jsx'
import { AuthPromo } from '../components/auth/AuthPromo.jsx'
import { InputField } from '../components/auth/InputField.jsx'

const PROMO_MOVIES = [
  {
    title: 'Vùng Đất Bóng Tối',
    genre: 'Hành động · Kịch tính',
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Horizon 2049',
    genre: 'Khoa học viễn tưởng',
    poster: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Mùa Hè Cuối Cùng',
    genre: 'Tình cảm · Thanh xuân',
    poster: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1200&q=80',
  },
]

export default function LoginPage({ onBackHome, onLoginSuccess, onFlash, onRegisterClick, onForgotPassword }) {
  const { login, loginGoogle } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const googleBtnInitialized = useRef(false)

  useEffect(() => {
    const handleGoogleCallback = async (response) => {
      setIsSubmitting(true)
      setErrorMessage('')
      try {
        const sessionUser = await loginGoogle(response.credential)
        onFlash('Đăng nhập thành công. Chào mừng bạn quay lại!', 'success')
        const defaultUrl = sessionUser?.role === 'ADMIN' ? '/admin/dashboard' : sessionUser?.role === 'STAFF' ? '/staff/dashboard' : '/'
        onLoginSuccess(defaultUrl)
      } catch (error) {
        setErrorMessage(error.message || 'Đăng nhập Google thất bại.')
      } finally {
        setIsSubmitting(false)
      }
    }

    const initGoogleSignIn = () => {
      const btnContainer = document.getElementById('google-signin-btn')
      if (window.google && btnContainer && !googleBtnInitialized.current) {
        googleBtnInitialized.current = true
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
          callback: handleGoogleCallback,
          cancel_on_tap_outside: true,
        })
        window.google.accounts.id.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: btnContainer.offsetWidth || '250',
        })
      }
    }

    let script = document.getElementById('google-gsi-client')
    if (!script) {
      script = document.createElement('script')
      script.id = 'google-gsi-client'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initGoogleSignIn
      document.body.appendChild(script)
    } else {
      initGoogleSignIn()
    }
  }, [loginGoogle, onFlash, onLoginSuccess])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const sessionUser = await login(form)
      onFlash('Đăng nhập thành công. Chào mừng bạn quay lại!', 'success')
      const defaultUrl = sessionUser?.role === 'ADMIN' ? '/admin/dashboard' : sessionUser?.role === 'STAFF' ? '/staff/dashboard' : '/'
      onLoginSuccess(defaultUrl)
    } catch (error) {
      setErrorMessage(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page container-fluid px-3 px-lg-4">
      <div className="auth-card">
        <AuthPromo
          eyebrow="MovieGate"
          title="Chào mừng bạn quay lại thế giới điện ảnh"
          subtitle="Đăng nhập để tiếp tục xem các bộ phim đang hot, lưu lịch sử xem và nhận gợi ý dành riêng cho bạn."
          movies={PROMO_MOVIES}
          onBackHome={onBackHome}
        />

        <div className="auth-panel">
          <div className="auth-panel__header">
            <p className="eyebrow">Đăng nhập</p>
            <h2>Vào phim nhanh hơn, gọn hơn</h2>
            <p>Giao diện tiếng Việt, tối giản, phù hợp cả mobile.</p>
          </div>

          {errorMessage ? <div className="alert alert-danger alert-modern">{errorMessage}</div> : null}

          <form className="auth-form" onSubmit={handleSubmit}>
            <InputField
              id="login-email"
              label="Email"
              icon="✉"
              type="email"
              placeholder="nhap@email.com"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
              autoComplete="email"
            />

            <InputField
              id="login-password"
              label="Mật khẩu"
              icon="🔒"
              type="password"
              placeholder="Nhập mật khẩu"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              required
              autoComplete="current-password"
            />

            <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
              <button type="button" className="link-button" onClick={onForgotPassword}>
                Quên mật khẩu?
              </button>
              <button type="button" className="link-button" onClick={onBackHome}>
                Quay lại trang chủ
              </button>
            </div>

            <button type="submit" className="btn btn-primary btn-login-submit text-white" disabled={isSubmitting}>
              {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>

            <div className="social-login">
              <p>Hoặc đăng nhập bằng</p>
              <div className="social-login__buttons d-flex flex-column align-items-center justify-content-center">
                <div id="google-signin-btn" style={{ minHeight: '40px', width: '100%', display: 'flex', justifyContent: 'center' }}></div>
              </div>
            </div>

            <div className="auth-footer-note">
              Chưa có tài khoản?{' '}
              <button type="button" className="link-button" onClick={onRegisterClick}>
                Đăng ký ngay
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}


