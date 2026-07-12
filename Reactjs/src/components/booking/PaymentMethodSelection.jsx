import React, { useEffect } from 'react'
import { pointApi } from '../../services/point.api.js'

export default function PaymentMethodSelection({
  isAdmin,
  isStaff,
  paymentMethod,
  setPaymentMethod,
  counterCustomerName,
  setCounterCustomerName,
  counterCustomerPhone,
  setCounterCustomerPhone,
  counterCustomerEmail,
  setCounterCustomerEmail,
  bookingLoading,
  // Điểm tích lũy
  pointBalance,
  setPointBalance,
  usePoints,
  setUsePoints
}) {
  // Load điểm của user khi bước thanh toán mở ra
  useEffect(() => {
    if (isAdmin || isStaff) return
    pointApi.getBalance()
      .then(res => {
        // requestJson trả về payload.data trực tiếp
        setPointBalance(res)
      })
      .catch(() => {})
  }, [isAdmin, isStaff, setPointBalance])

  return (
    <div className="payment-method-container animate-fade-in">
      <h4 className="fw-bold mb-3 text-center text-light d-flex align-items-center justify-content-center gap-2">
        {(isAdmin || isStaff) ? '🏢 THÔNG TIN XUẤT VÉ & THANH TOÁN' : '💳 PHƯƠNG THỨC THANH TOÁN'}
      </h4>
      <p className="text-white-50 text-center small mb-4">
        {(isAdmin || isStaff) 
          ? 'Nhập thông tin khách hàng vãng lai để hệ thống xuất hóa đơn và vé giấy tại quầy.' 
          : 'Vui lòng chọn cổng thanh toán trực tuyến bảo mật để hoàn tất đặt vé của bạn.'}
      </p>

      {/* STAFF / ADMIN: COUNTER SALE SYSTEM */}
      {(isAdmin || isStaff) ? (
        <div className="vstack gap-4">
          {/* Green Cash Alert Banner */}
          <div
            className="d-flex align-items-center gap-3 p-4 rounded-4"
            style={{
              background: 'linear-gradient(135deg, rgba(20, 83, 45, 0.4) 0%, rgba(6, 78, 36, 0.4) 100%)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="fs-1 p-2 bg-success bg-opacity-20 rounded-3">💵</div>
            <div className="flex-grow-1">
              <strong className="d-block text-success fw-bold fs-5 mb-1">TIỀN MẶT TẠI QUẦY (CASH ONLY)</strong>
              <span className="small text-white-50 d-block">Nhân viên nhận tiền mặt trực tiếp từ khách hàng. Vé sau khi xác nhận sẽ tự động chuyển sang trạng thái <strong className="text-success">ĐÃ THANH TOÁN (PAID)</strong> và tự động in hóa đơn.</span>
            </div>
            <span className="badge bg-success text-white px-3 py-2 rounded-pill fw-bold text-uppercase tracking-wider shadow-sm">Auto Paid</span>
          </div>

          {/* Customer Input Card */}
          <div 
            className="card bg-black bg-opacity-40 p-4 rounded-4 text-light border-dashed" 
            style={{ 
              borderColor: 'rgba(34, 197, 94, 0.4)',
              borderWidth: '1.5px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
            }}
          >
            <h6 className="fw-bold text-success mb-3 d-flex align-items-center gap-2">
              <span>👤</span> THÔNG TIN KHÁCH HÀNG BẮT BUỘC
            </h6>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small text-white-50 fw-semibold mb-1">Họ và tên khách hàng <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control form-control-lg bg-dark bg-opacity-50 border-secondary border-opacity-30 text-light rounded-3"
                  placeholder="Nguyễn Văn A"
                  value={counterCustomerName}
                  onChange={(e) => setCounterCustomerName(e.target.value)}
                  style={{ fontSize: '0.95rem' }}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small text-white-50 fw-semibold mb-1">Số điện thoại <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control form-control-lg bg-dark bg-opacity-50 border-secondary border-opacity-30 text-light rounded-3"
                  placeholder="09xxxxxxxx"
                  value={counterCustomerPhone}
                  onChange={(e) => setCounterCustomerPhone(e.target.value)}
                  style={{ fontSize: '0.95rem' }}
                />
              </div>
              <div className="col-12">
                <label className="form-label small text-white-50 fw-semibold mb-1">Địa chỉ Email (Để gửi hóa đơn điện tử & QR Code)</label>
                <input
                  type="email"
                  className="form-control form-control-lg bg-dark bg-opacity-50 border-secondary border-opacity-30 text-light rounded-3"
                  placeholder="khachhang@example.com"
                  value={counterCustomerEmail}
                  onChange={(e) => setCounterCustomerEmail(e.target.value)}
                  style={{ fontSize: '0.95rem' }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ONLINE USER: GORGEOUS PREMIUM PAYMENT METHOD GRID */
        <div className="vstack gap-4">
          {/* === ĐIỂM TÍCH LŨY CARD === */}
          {pointBalance && pointBalance.totalPoints > 0 && (
            <div
              className="rounded-4 p-4"
              style={{
                background: usePoints
                  ? 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(139,92,246,0.12) 100%)'
                  : 'rgba(15,23,42,0.6)',
                border: usePoints ? '1.5px solid rgba(139,92,246,0.6)' : '1.5px solid rgba(255,255,255,0.08)',
                boxShadow: usePoints ? '0 0 24px rgba(139,92,246,0.18)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <div className="d-flex align-items-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: 48, height: 48,
                      background: usePoints ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.06)',
                      fontSize: 24
                    }}
                  >
                    ⭐
                  </div>
                  <div>
                    <div className="fw-bold text-light" style={{ fontSize: '0.95rem' }}>
                      Dùng điểm tích lũy
                    </div>
                    <div className="text-white-50 small mt-1">
                      Bạn có <strong className="text-warning">{pointBalance.totalPoints} điểm</strong>
                      {' '}· Có thể dùng tối đa{' '}
                      <strong className="text-warning">{pointBalance.maxRedeemPoints} điểm</strong>
                      {' '}={' '}
                      <strong className="text-success">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pointBalance.maxRedeemVnd)}
                      </strong>
                    </div>
                    <div className="text-white-50 mt-1" style={{ fontSize: '0.72rem' }}>
                      1 điểm = 1.000đ · Tối đa 50 điểm/lần
                    </div>
                  </div>
                </div>

                {/* Toggle button */}
                <button
                  type="button"
                  onClick={() => !bookingLoading && setUsePoints(v => !v)}
                  disabled={bookingLoading}
                  className="btn btn-sm fw-bold rounded-pill px-4 py-2 flex-shrink-0"
                  style={{
                    background: usePoints
                      ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
                      : 'rgba(255,255,255,0.08)',
                    color: usePoints ? '#fff' : '#94a3b8',
                    border: 'none',
                    transition: 'all 0.2s ease',
                    minWidth: 80
                  }}
                >
                  {usePoints ? '✓ Đã áp dụng' : 'Áp dụng'}
                </button>
              </div>

              {usePoints && (
                <div
                  className="mt-3 pt-3 border-top d-flex align-items-center gap-2"
                  style={{ borderColor: 'rgba(139,92,246,0.3)' }}
                >
                  <span style={{ fontSize: 16 }}>🎉</span>
                  <span className="text-light small">
                    Giảm ngay{' '}
                    <strong className="text-success">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pointBalance.maxRedeemVnd)}
                    </strong>
                    {' '}từ {pointBalance.maxRedeemPoints} điểm tích lũy
                  </span>
                </div>
              )}
            </div>
          )}

          {/* === PHƯƠNG THỨC THANH TOÁN === */}
          <div className="row g-3">
          {/* VNPay Method Option */}
          <div className="col-12 col-md-6">
            <div
              onClick={() => !bookingLoading && setPaymentMethod('VNPAY')}
              className={`position-relative p-4 rounded-4 border text-start h-100 d-flex flex-column justify-content-between transition-all`}
              style={{
                cursor: bookingLoading ? 'not-allowed' : 'pointer',
                backgroundColor: paymentMethod === 'VNPAY' ? 'rgba(30, 64, 175, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                borderColor: paymentMethod === 'VNPAY' ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
                boxShadow: paymentMethod === 'VNPAY' ? '0 0 25px rgba(59, 130, 246, 0.25)' : 'none',
                transform: paymentMethod === 'VNPAY' ? 'translateY(-4px)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {/* Recommended Badge */}
              <span 
                className="position-absolute badge rounded-pill px-2.5 py-1 text-uppercase font-monospace text-xs"
                style={{
                  top: '12px',
                  right: '12px',
                  fontSize: '0.62rem',
                  fontWeight: 'bold',
                  background: paymentMethod === 'VNPAY' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'rgba(255,255,255,0.06)',
                  color: paymentMethod === 'VNPAY' ? '#fff' : '#94a3b8',
                  letterSpacing: '0.05em'
                }}
              >
                Phổ biến
              </span>

              <div className="mb-4">
                {/* VNPay Styled Graphical Logo */}
                <div 
                  className="d-inline-flex align-items-center gap-1.5 px-3 py-2 rounded-3 mb-3"
                  style={{ 
                    background: 'linear-gradient(135deg, #004b93 0%, #007cc2 100%)',
                    boxShadow: '0 4px 12px rgba(0,75,147,0.3)'
                  }}
                >
                  <span className="fw-black text-white italic tracking-wider font-monospace" style={{ fontSize: '1.1rem', fontWeight: 900 }}>VN</span>
                  <span className="fw-bold px-1.5 py-0.5 rounded text-dark bg-white font-sans" style={{ fontSize: '0.78rem', fontWeight: 800 }}>PAY</span>
                </div>

                <h5 className="fw-bold text-light mb-1 d-flex align-items-center gap-2">
                  Cổng thanh toán VNPAY
                </h5>
                <p className="text-white-50 mb-0 small" style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>
                  Thanh toán an toàn qua Ứng dụng ngân hàng qua mã QR-Pay, thẻ ATM nội địa, thẻ quốc tế Visa/MasterCard.
                </p>
              </div>

              <div className="d-flex align-items-center justify-content-between mt-2 pt-3 border-top border-secondary border-opacity-10">
                <span className="small text-white-50">Phí giao dịch: <strong className="text-success">Miễn phí</strong></span>
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: paymentMethod === 'VNPAY' ? '#3b82f6' : 'transparent',
                    border: paymentMethod === 'VNPAY' ? 'none' : '2px solid rgba(255,255,255,0.2)'
                  }}
                >
                  {paymentMethod === 'VNPAY' && <span className="text-white fw-bold" style={{ fontSize: '0.75rem' }}>✓</span>}
                </div>
              </div>
            </div>
          </div>

          {/* MoMo Method Option */}
          <div className="col-12 col-md-6">
            <div
              onClick={() => !bookingLoading && setPaymentMethod('MOMO')}
              className={`position-relative p-4 rounded-4 border text-start h-100 d-flex flex-column justify-content-between transition-all`}
              style={{
                cursor: bookingLoading ? 'not-allowed' : 'pointer',
                backgroundColor: paymentMethod === 'MOMO' ? 'rgba(219, 39, 119, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                borderColor: paymentMethod === 'MOMO' ? '#db2777' : 'rgba(255, 255, 255, 0.08)',
                boxShadow: paymentMethod === 'MOMO' ? '0 0 25px rgba(219, 39, 119, 0.25)' : 'none',
                transform: paymentMethod === 'MOMO' ? 'translateY(-4px)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <div className="mb-4">
                {/* MoMo Stylized Graphical Logo */}
                <div 
                  className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                  style={{ 
                    width: '38px',
                    height: '38px',
                    backgroundColor: '#a50064',
                    boxShadow: '0 4px 12px rgba(165,0,100,0.3)',
                    border: '1.5px solid #fff'
                  }}
                >
                  <span className="fw-bold text-white text-center tracking-tight" style={{ fontSize: '0.74rem', fontWeight: 900 }}>momo</span>
                </div>

                <h5 className="fw-bold text-light mb-1">
                  Ví điện tử MoMo
                </h5>
                <p className="text-white-50 mb-0 small" style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>
                  Thanh toán cực nhanh bằng quét mã QR MoMo hoặc mở trực tiếp ứng dụng MoMo trên điện thoại di động của bạn.
                </p>
              </div>

              <div className="d-flex align-items-center justify-content-between mt-2 pt-3 border-top border-secondary border-opacity-10">
                <span className="small text-white-50">Phí giao dịch: <strong className="text-success">Miễn phí</strong></span>
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: paymentMethod === 'MOMO' ? '#db2777' : 'transparent',
                    border: paymentMethod === 'MOMO' ? 'none' : '2px solid rgba(255,255,255,0.2)'
                  }}
                >
                  {paymentMethod === 'MOMO' && <span className="text-white fw-bold" style={{ fontSize: '0.75rem' }}>✓</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  )
}
