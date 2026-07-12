import React from 'react'

function formatPrice(amount) {
  if (!amount && amount !== 0) return '0đ'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export default function ConfirmModal({
  bookingLoading,
  selectedSeats,
  selectedServices,
  concessions,
  grandTotal,
  onClose,
  onConfirm
}) {
  return (
    <div 
      className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center p-3 confirm-modal-overlay"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.85)', 
        backdropFilter: 'blur(10px)',
        zIndex: 1050 
      }}
    >
      <div 
        className="card border-0 bg-dark text-light p-4 rounded-4 shadow-2xl max-w-md w-100"
        style={{ 
          maxWidth: '480px',
          backgroundColor: '#1e293b',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div className="text-center mb-3">
          <span className="fs-1 d-block mb-2">⚠️</span>
          <h5 className="fw-bold text-warning text-uppercase">Xác Nhận Đơn Đặt Vé</h5>
        </div>
        
        <div className="text-white-50 mb-4" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
          <p className="mb-2">Bạn đang thực hiện tạo một đơn đặt vé với các chi tiết sau:</p>
          <ul className="ps-3 mb-3 text-light">
            <li>Ghế: <strong>{selectedSeats.map((s) => s.name).join(', ')}</strong></li>
            <li>Dịch vụ: <strong>{
              Object.entries(selectedServices)
                .filter(([_, q]) => q > 0)
                .map(([id, q]) => `${concessions.find((c) => c._id === id)?.name} (x${q})`)
                .join(', ') || 'Không chọn'
            }</strong></li>
            <li>Tổng tiền thanh toán: <strong className="text-warning">{formatPrice(grandTotal)}</strong></li>
          </ul>
          <p className="mb-0">
            Nếu đồng ý, hệ thống sẽ tiến hành **tạo Booking ngay lập tức** và khóa các ghế ngồi này cho bạn trong vòng **10 phút** để tiến hành thanh toán.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button 
            type="button" 
            className="btn btn-outline-secondary flex-grow-1 py-2.5 rounded-3 fw-bold text-light"
            onClick={onClose}
            disabled={bookingLoading}
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            Hủy bỏ
          </button>
          <button 
            type="button" 
            className="btn btn-success flex-grow-1 py-2.5 rounded-3 fw-bold text-white"
            onClick={onConfirm}
            disabled={bookingLoading}
          >
            Đồng ý, Đặt vé
          </button>
        </div>
      </div>
    </div>
  )
}
