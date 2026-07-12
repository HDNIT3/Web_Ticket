import { useEffect, useRef, useState } from 'react'
import { AuthPromo } from '../components/auth/AuthPromo.jsx'
import { InputField } from '../components/auth/InputField.jsx'
import { SubmitButton } from '../components/auth/SubmitButton.jsx'
import { AlertMessage } from '../components/auth/AlertMessage.jsx'
import { forgotPassword, resetPassword } from '../services/auth.api.js'

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

const OTP_LENGTH = 6

export default function ResetPasswordPage({ onBackLogin, onBackForgot, onFlash, onResetSuccess }) {
  const [form, setForm] = useState(() => {
    const hashQuery = window.location.hash.split('?')[1] || ''
    const params = new URLSearchParams(hashQuery || window.location.search)
    const emailParam = params.get('email')
    return { email: emailParam || '', otp: '', newPassword: '' }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const errorTimerRef = useRef(null)

  useEffect(() => {
    if (!error) return
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    errorTimerRef.current = setTimeout(() => setError(''), 4000)
  }, [error])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])


  const setField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleOtpChange = (event) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH)
    setForm((current) => ({ ...current, otp: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.email.trim()) {
      setError('Email là bắt buộc.')
      return
    }

    if (form.otp.length < OTP_LENGTH) {
      setError('OTP phải là 6 chữ số.')
      return
    }

    if (form.newPassword.trim().length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }

    setLoading(true)
    try {
      const result = await resetPassword({
        email: form.email,
        otp: form.otp,
        newPassword: form.newPassword,
      })

      if (typeof onFlash === 'function') {
        const message =
          result?.message || 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại.'
        onFlash(message, 'success')
      }

      if (typeof onResetSuccess === 'function') {
        onResetSuccess()
      }
    } catch (err) {
      setError(err.message || 'Đặt lại mật khẩu thất bại.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return

    if (!form.email.trim()) {
      setError('Email là bắt buộc.')
      return
    }

    try {
      const result = await forgotPassword(form.email)
      if (typeof onFlash === 'function') {
        const message = result?.message || 'Đã gửi lại mã OTP. Vui lòng kiểm tra email.'
        onFlash(message, 'success')
      }
      setCooldown(60)
    } catch (err) {
      setError(err.message || 'Không thể gửi lại mã. Vui lòng thử lại.')
    }
  }

  return (
    <section className="auth-page container-fluid px-3 px-lg-4">
      <div className="auth-card">
        <AuthPromo
          eyebrow="MovieGate"
          title="Đặt lại mật khẩu an toàn"
          subtitle="Nhập email, mã OTP và mật khẩu mới để hoàn tất quá trình đặt lại."
          badges={['Mã OTP 6 chữ số', 'Hiệu lực 5 phút', 'Bảo mật tài khoản']}
          movies={PROMO_MOVIES}
        />

        <div className="auth-panel">
          <div className="auth-panel__header">
            <p className="eyebrow">Đặt lại mật khẩu</p>
            <h2>Nhập thông tin xác thực</h2>
            <p>OTP đã được gửi tới email của bạn.</p>
          </div>

          <AlertMessage message={error} variant="danger" />

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <InputField
              id="reset-email"
              label="Email"
              icon="@"
              type="email"
              placeholder="ban@email.com"
              value={form.email}
              onChange={setField('email')}
              required
              autoComplete="email"
            />

            <label className="form-field" htmlFor="reset-otp">
              <span className="field-label">Mã OTP (6 chữ số)</span>
              <div className="input-shell">
                <span className="field-icon">OTP</span>
                <input
                  id="reset-otp"
                  className="form-control otp-input"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  placeholder="_ _ _ _ _ _"
                  value={form.otp}
                  onChange={handleOtpChange}
                  maxLength={OTP_LENGTH}
                  required
                  autoComplete="one-time-code"
                />
              </div>
              <span className="otp-counter">
                {form.otp.length} / {OTP_LENGTH}
              </span>
            </label>

            <InputField
              id="reset-password"
              label="Mật khẩu mới"
              icon="*"
              type="password"
              placeholder="Ít nhất 6 ký tự"
              value={form.newPassword}
              onChange={setField('newPassword')}
              minLength={6}
              required
              autoComplete="new-password"
            />

            <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
              <button type="button" className="link-button" onClick={onBackForgot}>
                Quay lại quên mật khẩu
              </button>
              <button type="button" className="link-button" onClick={onBackLogin}>
                Quay lại đăng nhập
              </button>
            </div>

            <button
              type="button"
              className="link-button"
              onClick={handleResend}
              disabled={cooldown > 0}
              style={{ opacity: cooldown > 0 ? 0.5 : 1 }}
            >
              {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại mã OTP'}
            </button>

            <SubmitButton
              loading={loading}
              loadingLabel="Đang đặt lại..."
              label="Đặt lại mật khẩu"
              disabled={loading}
            />

            <div className="auth-footer-note">
              Mã OTP sẽ hết hạn sau 5 phút. Nếu không nhận được mã, hãy gửi lại.
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
