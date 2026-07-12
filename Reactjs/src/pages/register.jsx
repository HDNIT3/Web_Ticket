import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { registerUser, clearError } from '../store/registerSlice.js'
import { AuthPromo } from '../components/auth/AuthPromo.jsx'
import { InputField } from '../components/auth/InputField.jsx'
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

export default function RegisterPage({ onBackHome, onLoginClick, onFlash, onRegisterSuccess }) {
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.register)

  const [form, setForm] = useState({
    name: '',
    username: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [localError, setLocalError] = useState('')
  const errorTimerRef = useRef(null)

  const displayError = localError || error
  useEffect(() => {
    if (!displayError) return
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    errorTimerRef.current = setTimeout(() => {
      setLocalError('')
      dispatch(clearError())
    }, 4000)
  }, [displayError])

  const setField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLocalError('')

    if (form.password !== form.confirmPassword) {
      setLocalError('Mật khẩu xác nhận không khớp.')
      return
    }

    const result = await dispatch(
      registerUser({
        firstName: form.name,
        username: form.username || undefined,
        phoneNumber: form.phoneNumber || undefined,
        email: form.email,
        password: form.password,
      }),
    )

    if (registerUser.fulfilled.match(result)) {
      onFlash('Đăng ký thành công! Kiểm tra email để lấy mã OTP.', 'success')
      onRegisterSuccess()
    }
  }


  return (
    <section className="auth-page container-fluid px-3 px-lg-4">
      <div className="auth-card">
        <AuthPromo
          eyebrow="MovieGate"
          title="Tham gia thế giới điện ảnh ngay hôm nay"
          subtitle="Tạo tài khoản miễn phí để xem phim không giới hạn, lưu danh sách yêu thích và nhận gợi ý cá nhân."
          badges={['Miễn phí', 'Ultra HD', 'Không quảng cáo']}
          movies={PROMO_MOVIES}
        />

        <div className="auth-panel">
          <div className="auth-panel__header">
            <p className="eyebrow">Đăng ký</p>
            <h2>Tạo tài khoản mới</h2>
            <p>Chỉ mất 30 giây để bắt đầu trải nghiệm.</p>
          </div>

          <AlertMessage message={displayError} variant="danger" />

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <InputField
              id="reg-name"
              label="Họ và tên"
              icon="👤"
              type="text"
              placeholder="Nguyễn Văn A"
              value={form.name}
              onChange={setField('name')}
              required
              autoComplete="name"
            />

            <InputField
              id="reg-email"
              label="Email"
              icon="✉"
              type="email"
              placeholder="ban@email.com"
              value={form.email}
              onChange={setField('email')}
              required
              autoComplete="email"
            />

            <InputField
              id="reg-username"
              label="Tên đăng nhập"
              icon="🪪"
              type="text"
              placeholder="vd: moviefan2024"
              value={form.username}
              onChange={setField('username')}
              autoComplete="username"
            />

            <InputField
              id="reg-phone"
              label="Số điện thoại"
              icon="📱"
              type="tel"
              placeholder="0912 345 678"
              value={form.phoneNumber}
              onChange={setField('phoneNumber')}
              autoComplete="tel"
            />

            <InputField
              id="reg-password"
              label="Mật khẩu"
              icon="🔒"
              type="password"
              placeholder="Ít nhất 8 ký tự"
              value={form.password}
              onChange={setField('password')}
              required
              minLength={8}
              autoComplete="new-password"
            />

            <InputField
              id="reg-confirm-password"
              label="Xác nhận mật khẩu"
              icon="🔑"
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={form.confirmPassword}
              onChange={setField('confirmPassword')}
              required
              autoComplete="new-password"
            />

            <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
              <button type="button" className="link-button" onClick={onLoginClick}>
                Đã có tài khoản? Đăng nhập
              </button>
              <button type="button" className="link-button" onClick={onBackHome}>
                Quay lại trang chủ
              </button>
            </div>

            <SubmitButton
              loading={loading}
              loadingLabel="Đang đăng ký..."
              label="Đăng ký ngay"
            />

            <div className="auth-footer-note">
              Bằng cách đăng ký, bạn đồng ý với{' '}
              <button type="button" className="link-button">
                Điều khoản dịch vụ
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

