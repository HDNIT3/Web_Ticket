import React from 'react'

function formatPrice(amount) {
  if (!amount && amount !== 0) return '0đ'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export default function ServiceConcessions({ 
  concessions, 
  selectedServices, 
  onUpdateServiceQuantity,
  promoCode,
  setPromoCode,
  onApplyPromo,
  promoError,
  promoSuccess,
  bookingLoading
}) {
  return (
    <div className="service-concessions-container animate-fade-in">
      <h4 className="fw-bold mb-4 text-center border-bottom border-secondary border-opacity-30 pb-3 text-light">
        🍿 DỊCH VỤ & KHUYẾN MÃI
      </h4>
      
      {concessions.length === 0 ? (
        <p className="text-secondary text-center py-4">Hiện không có dịch vụ nào đang hoạt động.</p>
      ) : (
        <div className="row g-3 row-cols-1 row-cols-md-2 mb-4" style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
          {concessions.map((item) => {
            const qty = selectedServices[item._id] || 0
            return (
              <div key={item._id} className="col">
                <div className="card bg-black bg-opacity-40 border-secondary h-100 rounded-3 p-3 text-light" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="d-flex align-items-center gap-3">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="rounded object-fit-cover" 
                        style={{ width: '74px', height: '74px' }} 
                      />
                    ) : (
                      <div className="bg-dark bg-opacity-50 rounded text-center d-flex align-items-center justify-content-center text-secondary font-monospace" style={{ width: '74px', height: '74px', fontSize: '2rem' }}>
                        🥤
                      </div>
                    )}
                    <div className="flex-grow-1 min-w-0">
                      <h6 className="text-light mb-1 text-truncate fw-bold">{item.name}</h6>
                      <p className="text-white-50 small mb-2 text-truncate" style={{ fontSize: '0.78rem' }}>{item.description || 'Hương vị tuyệt hảo rạp phim.'}</p>
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="text-warning fw-bold">{formatPrice(item.unitPrice)}</span>
                        
                        {/* Plus Minus Quantity Selector */}
                        <div className="d-flex align-items-center gap-2 border border-secondary border-opacity-30 rounded-pill p-1 px-2" style={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)' }}>
                          <button 
                            type="button" 
                            className="btn btn-sm btn-link p-0 text-white-50 fs-5 line-height-1 text-decoration-none" 
                            onClick={() => onUpdateServiceQuantity(item._id, false)}
                            disabled={qty === 0}
                            style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            -
                          </button>
                          <span className="fw-bold text-light px-2" style={{ minWidth: '20px', textAlign: 'center', fontSize: '0.9rem' }}>{qty}</span>
                          <button 
                            type="button" 
                            className="btn btn-sm btn-link p-0 text-white-50 fs-5 line-height-1 text-decoration-none" 
                            onClick={() => onUpdateServiceQuantity(item._id, true)}
                            style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Promo Code Section */}
      <div 
        className="mt-4 p-4 rounded-4"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 0.3) 100%)',
          border: '1.5px dashed rgba(220, 53, 69, 0.25)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}
      >
        <h6 className="fw-bold text-light mb-2 d-flex align-items-center gap-2">
          <span>🎁</span> Áp dụng mã khuyến mãi (Tùy chọn)
        </h6>
        <p className="text-white-50 small mb-3">Nhập mã giảm giá của bạn để nhận ưu đãi giảm giá trực tiếp vào hóa đơn vé xem phim.</p>
        <div className="d-flex gap-2" style={{ maxWidth: '480px' }}>
          <input 
            type="text" 
            className="form-control form-control-lg bg-black text-light border-secondary border-opacity-30 rounded-3 font-monospace"
            placeholder="MÃ GIẢM GIÁ (VD: NHOM09)"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            disabled={bookingLoading}
            style={{ fontSize: '0.9rem', borderColor: 'rgba(255,255,255,0.1)' }}
          />
          <button 
            type="button" 
            className="btn btn-danger px-4 rounded-3 fw-bold text-nowrap"
            onClick={onApplyPromo}
            disabled={bookingLoading}
          >
            Áp dụng
          </button>
        </div>
        {promoError && <div className="text-danger small mt-2 d-flex align-items-center gap-1"><span>❌</span> {promoError}</div>}
        {promoSuccess && <div className="text-success small mt-2 d-flex align-items-center gap-1"><span>✅</span> {promoSuccess}</div>}
      </div>
    </div>
  )
}
