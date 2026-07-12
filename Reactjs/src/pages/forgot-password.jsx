import { useEffect, useRef, useState } from 'react'
import { AuthPromo } from '../components/auth/AuthPromo.jsx'
import { InputField } from '../components/auth/InputField.jsx'
import { SubmitButton } from '../components/auth/SubmitButton.jsx'
import { AlertMessage } from '../components/auth/AlertMessage.jsx'
import { forgotPassword } from '../services/auth.api.js'

const PROMO_MOVIES = [
  {
    title: 'Vùng Đất Bóng Tối',
    genre: 'Hành động - Kịch tính',
    poster:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Horizon 2049',
    genre: 'Khoa học viễn tưởng',
    poster:
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Mùa Hè Cuối Cùng',
    genre: 'Tình cảm - Thanh xuân',
    poster:
      'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=800&q=80',
  },
]

export default function ForgotPasswordPage({ onBackHome, onBackLogin, onFlash, onSentOtp }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const errorTimerRef = useRef(null)

  useEffect(() => {
    if (!error) return
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    errorTimerRef.current = setTimeout(() => setError(''), 4000)
  }, [error])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await forgotPassword(email)
      if (typeof onFlash === 'function') {
        const message =
          result?.message ||
          'Mã xác thực đã được gửi đi. Vui lòng kiểm tra hộp thư.'
        onFlash(message, 'success')
      }
      if (typeof onSentOtp === 'function') {
        onSentOtp(email)
      }
    } catch (err) {
      setError(err.message || 'Không thể gửi OTP. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-page container-fluid px-3 px-lg-4">
      <div className="auth-card">
        <AuthPromo
          eyebrow="MovieGate"
          title="Khôi phục mật khẩu tài khoản"
          subtitle="Nhập email đăng ký. Hệ thống sẽ gửi mã OTP để đặt lại mật khẩu (hiệu lực 5 phút)."
          badges={['Bảo mật cao', 'Nhanh chóng', 'Hỗ trợ 24/7']}
          movies={PROMO_MOVIES}
        />

        <div className="auth-panel">
          <div className="auth-panel__header">
            <p className="eyebrow">Quên mật khẩu</p>
            <h2>Lấy lại tài khoản</h2>
            <p>Nhập email để nhận mã OTP đặt lại mật khẩu.</p>
          </div>

          <AlertMessage message={error} variant="danger" />

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <InputField
              id="forgot-email"
              label="Email"
              icon="@"
              type="email"
              placeholder="ban@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />

            <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
              <button type="button" className="link-button" onClick={onBackLogin}>
                Quay lại đăng nhập
              </button>
              <button type="button" className="link-button" onClick={onBackHome}>
                Quay lại trang chủ
              </button>
            </div>

            <SubmitButton
              loading={loading}
              loadingLabel="Đang gửi mã..."
              label="Gửi mã OTP"
              disabled={loading}
            />

            <div className="auth-footer-note">
              Nếu không nhận được mã, hãy kiểm tra thư mục spam hoặc thử lại sau vài phút.
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
