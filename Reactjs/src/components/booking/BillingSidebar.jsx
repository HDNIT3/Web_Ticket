import React from 'react'

function formatPrice(amount) {
  if (!amount && amount !== 0) return '0đ'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatTime(value) {
  if (!value) return '--:--'
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export default function BillingSidebar({
  movie,
  showtime,
  selectedSeats,
  selectedServices,
  concessions,
  step,
  setStep,
  ticketsPrice,
  concessionsPrice,
  appliedPromo,
  discountAmount,
  pointDiscountAmount,
  grandTotal,
  bookingLoading,
  isAdmin,
  isStaff,
  onShowConfirmModal,
  onNavigate
}) {
  return (
    <div className="card border-0 bg-dark text-light p-4 rounded-4 shadow-lg sticky-lg-top billing-sidebar" style={{ backgroundColor: '#0f172a', top: '100px' }}>
      
      {/* Header Info */}
      {movie ? (
        <div className="d-flex gap-3 mb-4 pb-3 border-bottom border-secondary border-opacity-30">
          {movie.posterUrl ? (
            <img 
              src={movie.posterUrl} 
              alt={movie.title} 
              className="rounded object-fit-cover" 
              style={{ width: '60px', height: '86px' }} 
            />
          ) : null}
          <div>
            <h6 className="fw-bold text-light mb-1">{movie.title}</h6>
            <span className="d-block small text-warning mb-1">🎭 {movie.genres?.map((g) => g?.name).filter(Boolean).join(' · ')}</span>
            <span className="small text-white-50">🔞 {movie.ageRating || 'Đang cập nhật'}</span>
          </div>
        </div>
      ) : null}

      {/* Showtime Info */}
      {showtime ? (
        <div className="vstack gap-2 mb-4 pb-3 border-bottom border-secondary border-opacity-30" style={{ fontSize: '0.85rem' }}>
          <div className="d-flex justify-content-between">
            <span className="text-white-50">Rạp phim:</span>
            <span className="fw-bold text-light">Movie Group 9 Cinema</span>
          </div>
          <div className="d-flex justify-content-between">
            <span className="text-white-50">Phòng chiếu:</span>
            <span className="fw-bold text-light">{showtime.auditorium?.name || 'Phòng chiếu'}</span>
          </div>
          <div className="d-flex justify-content-between">
            <span className="text-white-50">Suất chiếu:</span>
            <span className="fw-bold text-danger">{formatTime(showtime.startTime)}</span>
          </div>
          <div className="d-flex justify-content-between">
            <span className="text-white-50">Ngày chiếu:</span>
            <span className="fw-bold text-light">{formatDate(showtime.startTime)}</span>
          </div>
        </div>
      ) : null}

      {/* Selections Summary */}
      <div className="vstack gap-2 mb-4 border-bottom border-secondary border-opacity-30 pb-3" style={{ fontSize: '0.85rem' }}>
        <div>
          <span className="text-white-50 d-block mb-1" style={{ fontSize: '0.8rem' }}>Ghế đã chọn:</span>
          {selectedSeats.length === 0 ? (
            <span className="fw-bold text-white-50 italic small">Chưa chọn ghế</span>
          ) : (
            <div className="fw-bold text-light fs-6">
              {selectedSeats.map((seat) => seat.name).join(', ')} 
              <span className="text-white-50 small fw-normal ms-2">({selectedSeats.length} vé)</span>
            </div>
          )}
        </div>

        <div className="mt-2">
          <span className="text-white-50 d-block mb-1" style={{ fontSize: '0.8rem' }}>Dịch vụ đi kèm:</span>
          {Object.entries(selectedServices).filter(([_, q]) => q > 0).length === 0 ? (
            <span className="fw-bold text-white-50 italic small">Chưa chọn dịch vụ</span>
          ) : (
            <div className="fw-bold text-light small" style={{ lineHeight: '1.4' }}>
              {Object.entries(selectedServices)
                .filter(([_, q]) => q > 0)
                .map(([serviceId, qty]) => {
                  const item = concessions.find((c) => c._id === serviceId)
                  return item ? `${item.name} (x${qty})` : ''
                })
                .filter(Boolean)
                .join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Bill Breakdown */}
      <div className="vstack gap-2 mb-4" style={{ fontSize: '0.9rem' }}>
        <div className="d-flex justify-content-between">
          <span className="text-white-50">Tạm tính vé:</span>
          <span className="text-light fw-bold">{formatPrice(ticketsPrice)}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span className="text-white-50">Tạm tính dịch vụ đi kèm:</span>
          <span className="text-light fw-bold">{formatPrice(concessionsPrice)}</span>
        </div>
        {appliedPromo && (
          <div className="d-flex justify-content-between text-success fw-bold">
            <span>Giảm giá khuyến mãi:</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}
        {pointDiscountAmount > 0 && (
          <div className="d-flex justify-content-between fw-bold" style={{ color: '#a78bfa' }}>
            <span>⭐ Dùng điểm tích lũy:</span>
            <span>-{formatPrice(pointDiscountAmount)}</span>
          </div>
        )}
        
        <div className="d-flex justify-content-between border-top border-secondary border-opacity-30 pt-3 mt-2">
          <span className="fs-5 fw-bold text-light">Tổng cộng:</span>
          <span className="fs-5 fw-bold text-warning">{formatPrice(grandTotal)}</span>
        </div>
      </div>

      {/* Step Buttons */}
      <div className="vstack gap-2 mt-4">
        {step === 1 && (
          <button
            type="button"
            className="btn btn-danger btn-lg w-100 py-3 rounded-3 fw-bold"
            disabled={selectedSeats.length === 0}
            onClick={() => setStep(2)}
          >
            Chọn dịch vụ đi kèm →
          </button>
        )}
        
        {step === 2 && (
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary flex-grow-1 py-3 rounded-3 fw-bold text-light"
              onClick={() => setStep(1)}
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              ← Trở lại
            </button>
            <button
              type="button"
              className="btn btn-danger flex-grow-1 py-3 rounded-3 fw-bold"
              onClick={() => setStep(3)}
            >
              Thanh toán →
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary py-3 rounded-3 fw-bold text-light"
              onClick={() => setStep(2)}
              disabled={bookingLoading}
              style={{ borderColor: 'rgba(255,255,255,0.1)', width: '60px' }}
            >
              ←
            </button>
            <button
              type="button"
              className="btn btn-success flex-grow-1 py-3 rounded-3 fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 text-white"
              onClick={onShowConfirmModal}
              disabled={bookingLoading}
            >
              {bookingLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Đang tạo đơn...
                </>
              ) : (isAdmin || isStaff) ? (
                <>💵 XUẤT HÓA ĐƠN & KÍCH HOẠT VÉ</>
              ) : (
                <>🎟 ĐẶT VÉ NGAY</>
              )}
            </button>
          </div>
        )}

        <button
          type="button"
          className="btn btn-link text-white-50 small mt-2 text-decoration-none"
          onClick={() => onNavigate(`/movie/${movie?._id || movie?.id}`)}
          disabled={bookingLoading}
        >
          Hủy giao dịch & Quay lại
        </button>
      </div>

    </div>
  )
}
