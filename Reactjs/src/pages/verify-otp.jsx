import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { verifyOtp, resetRegister, clearError, resendOtp } from '../store/registerSlice.js'
import { AuthPromo } from '../components/auth/AuthPromo.jsx'
import { SubmitButton } from '../components/auth/SubmitButton.jsx'
import { AlertMessage } from '../components/auth/AlertMessage.jsx'

const PROMO_MOVIES = [
  {
    title: 'Vùng Đất Bóng Tối',
    genre: 'Hành động · Kịch tính',
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
    genre: 'Tình cảm · Thanh xuân',
    poster:
      'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=800&q=80',
  },
]

const OTP_LENGTH = 6

export default function VerifyOtpPage({ onVerifySuccess, onBackRegister, onFlash }) {
  const dispatch = useDispatch()
  const { loading, error, email, step } = useSelector((state) => state.register)

  const [otp, setOtp] = useState('')
  const errorTimerRef = useRef(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (!error) return
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    errorTimerRef.current = setTimeout(() => dispatch(clearError()), 4000)
  }, [error])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  useEffect(() => {
    if (step === 'success') {
      onFlash('Xác thực thành công! Bạn có thể đăng nhập ngay.', 'success')
      dispatch(resetRegister())
      onVerifySuccess()
    }
  }, [step, onFlash, onVerifySuccess, dispatch])

  const handleOtpChange = (event) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH)
    setOtp(value)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (otp.length < OTP_LENGTH) return
    dispatch(verifyOtp({ email, otp }))
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    const result = await dispatch(resendOtp(email))
    if (resendOtp.fulfilled.match(result)) {
      onFlash('Mã OTP mới đã được gửi tới email của bạn.', 'success')
      setCooldown(60)
    }
  }

  return (
    <section className="auth-page container-fluid px-3 px-lg-4">
      <div className="auth-card">
        <AuthPromo
          eyebrow="MovieGate"
          title="Gần xong rồi! Xác thực email của bạn"
          subtitle="Chúng tôi đã gửi mã OTP 6 chữ số tới email của bạn. Kiểm tra hộp thư đến (và thư mục spam nếu không thấy)."
          badges={['Bảo mật cao', 'Mã hết hạn sau 5 phút']}
          movies={PROMO_MOVIES}
        />

        <div className="auth-panel">
          <div className="auth-panel__header">
            <p className="eyebrow">Xác thực OTP</p>
            <h2>Nhập mã xác thực</h2>
            <p>
              Mã OTP đã được gửi đến{' '}
              <strong style={{ color: '#93c5fd' }}>{email || 'email của bạn'}</strong>
            </p>
          </div>

          <AlertMessage message={error} variant="danger" />

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="form-field" htmlFor="otp-input">
              <span className="field-label">Mã OTP (6 chữ số)</span>
              <div className="input-shell">
                <span className="field-icon">🔐</span>
                <input
                  id="otp-input"
                  className="form-control otp-input"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  placeholder="_ _ _ _ _ _"
                  value={otp}
                  onChange={handleOtpChange}
                  maxLength={OTP_LENGTH}
                  required
                  autoComplete="one-time-code"
                />
              </div>
              <span className="otp-counter">{otp.length} / {OTP_LENGTH}</span>
            </label>

            <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
              <button type="button" className="link-button" onClick={onBackRegister}>
                ← Quay lại đăng ký
              </button>
              <button
                type="button"
                className="link-button"
                onClick={handleResend}
                disabled={cooldown > 0}
                style={{ opacity: cooldown > 0 ? 0.5 : 1 }}
              >
                {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại mã'}
              </button>
            </div>

            <SubmitButton
              loading={loading}
              loadingLabel="Đang xác thực..."
              label="Xác thực ngay"
              disabled={loading || otp.length < OTP_LENGTH}
            />

            <div className="auth-footer-note">
              Mã sẽ hết hạn sau <strong style={{ color: '#fdba74' }}>5 phút</strong>. Không nhận được mã?{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => onFlash('Kiểm tra hộp thư spam hoặc thử gửi lại.', 'info')}
              >
                Trợ giúp
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

