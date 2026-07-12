import React from 'react'

export default function SeatSelection({ seatRows, selectedSeats, onSelectSeat }) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  return (
    <div className="seat-selection-container animate-fade-in">
      <h4 className="fw-bold mb-4 text-center border-bottom border-secondary border-opacity-30 pb-3 text-light">
        🎬 CHỌN SƠ ĐỒ GHẾ NGỒI
      </h4>
      
      {/* Cinema Screen component */}
      <div className="w-100 text-center mb-5 position-relative">
        <div 
          className="mx-auto" 
          style={{
            height: '10px',
            width: '80%',
            background: 'linear-gradient(to right, transparent, rgba(56, 189, 248, 0.6) 20%, rgba(56, 189, 248, 0.6) 80%, transparent)',
            borderRadius: '50% 50% 0 0',
            boxShadow: '0 8px 30px rgba(56, 189, 248, 0.45)',
          }}
        />
        <small className="text-secondary fw-semibold text-uppercase tracking-wider mt-2 d-block">MÀN HÌNH CHIẾU</small>
      </div>

      {/* Interactive Seat map */}
      <div className="table-responsive py-2 text-center overflow-auto" style={{ maxHeight: '420px' }}>
        <div className="d-inline-block text-nowrap px-4 py-2">
          {Object.entries(seatRows).map(([rowIndex, rowSeats]) => {
            const letter = alphabet[parseInt(rowIndex) - 1] || `R${rowIndex}`
            return (
              <div key={rowIndex} className="d-flex align-items-center justify-content-center mb-2 gap-2">
                {/* Row Indicator Left */}
                <span className="fw-bold text-danger me-3 text-center" style={{ width: '24px', fontSize: '1.05rem' }}>{letter}</span>
                
                {rowSeats.map((seat) => {
                  let seatBgColor = '#374151' // Default STANDARD
                  let borderStyle = '1px solid rgba(255, 255, 255, 0.15)'
                  let cursor = 'pointer'
                  let title = `${seat.name} (${seat.seatType?.name})`
                  let isCouple = seat.seatType?.name === 'COUPLE'
                  
                  const isSelected = selectedSeats.some((s) => s._id === seat._id)
                  
                  if (isSelected) {
                    seatBgColor = '#10b981' // emerald green selecting
                    borderStyle = '1px solid #10b981'
                  } else if (seat.status === 'BOOKED') {
                    seatBgColor = 'rgba(239, 68, 68, 0.2)' // dimmed red for booked
                    borderStyle = '1px solid rgba(239, 68, 68, 0.3)'
                    cursor = 'not-allowed'
                  } else if (seat.status === 'LOCKED') {
                    seatBgColor = '#f59e0b'; // orange for lock
                    borderStyle = '1px solid #f59e0b';
                    cursor = 'not-allowed';
                  } else {
                    if (seat.seatType?.name === 'VIP') {
                      seatBgColor = '#6366f1' // Indigo
                      borderStyle = '1px solid #4f46e5'
                    } else if (isCouple) {
                      seatBgColor = '#ec4899' // pink rose couple
                      borderStyle = '1px solid #db2777'
                    }
                  }

                  return (
                    <button
                      key={seat._id}
                      type="button"
                      className="position-relative d-flex align-items-center justify-content-center p-0 seat-btn"
                      style={{
                        width: isCouple ? '72px' : '34px',
                        height: '32px',
                        backgroundColor: seatBgColor,
                        border: borderStyle,
                        borderRadius: isCouple ? '10px' : '6px',
                        cursor: cursor,
                        color: '#fff',
                        fontSize: '0.78rem',
                        fontWeight: 'bold',
                        transition: 'all 0.18s ease-in-out',
                        boxShadow: isSelected ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
                      }}
                      disabled={seat.status !== 'AVAILABLE'}
                      onClick={() => onSelectSeat(seat)}
                      title={title}
                    >
                      {seat.status === 'BOOKED' ? (
                        <i className="bi bi-x-circle text-danger-emphasis" style={{ fontSize: '0.85rem' }}></i>
                      ) : seat.status === 'LOCKED' ? (
                        <i className="bi bi-lock-fill text-warning-emphasis" style={{ fontSize: '0.85rem' }}></i>
                      ) : (
                        seat.name
                      )}
                    </button>
                  )
                })}
                
                {/* Row Indicator Right */}
                <span className="fw-bold text-danger ms-3 text-center" style={{ width: '24px', fontSize: '1.05rem' }}>{letter}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Color Legends */}
      <div className="mt-5 border-top border-secondary border-opacity-30 pt-4">
        <h6 className="fw-semibold text-secondary text-uppercase mb-3 text-center">Màu sắc đánh dấu trạng thái ghế</h6>
        
        <div className="row g-2 text-center row-cols-2 row-cols-sm-3 row-cols-md-5 justify-content-center mb-4">
          <div className="d-flex align-items-center gap-2 justify-content-center">
            <div style={{ width: '20px', height: '20px', backgroundColor: '#374151', borderRadius: '4px' }} />
            <small className="text-light">Ghế Thường</small>
          </div>
          <div className="d-flex align-items-center gap-2 justify-content-center">
            <div style={{ width: '20px', height: '20px', backgroundColor: '#6366f1', borderRadius: '4px' }} />
            <small className="text-light">Ghế VIP</small>
          </div>
          <div className="d-flex align-items-center gap-2 justify-content-center">
            <div style={{ width: '20px', height: '20px', backgroundColor: '#ec4899', borderRadius: '4px' }} />
            <small className="text-light">Ghế Couple</small>
          </div>
          <div className="d-flex align-items-center gap-2 justify-content-center">
            <div style={{ width: '20px', height: '20px', backgroundColor: '#10b981', borderRadius: '4px' }} />
            <small className="text-light">Đang chọn</small>
          </div>
          <div className="d-flex align-items-center gap-2 justify-content-center">
            <div className="d-flex align-items-center justify-content-center bg-danger bg-opacity-25" style={{ width: '20px', height: '20px', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '4px' }}>
              <i className="bi bi-x-circle text-danger" style={{ fontSize: '0.65rem' }} />
            </div>
            <small className="text-light">Đã mua</small>
          </div>
          <div className="d-flex align-items-center gap-2 justify-content-center">
            <div className="d-flex align-items-center justify-content-center bg-warning bg-opacity-25" style={{ width: '20px', height: '20px', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '4px' }}>
              <i className="bi bi-lock-fill text-warning" style={{ fontSize: '0.65rem' }} />
            </div>
            <small className="text-light">Đã khóa</small>
          </div>
        </div>
      </div>
    </div>
  )
}
