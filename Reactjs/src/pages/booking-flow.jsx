import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../components/context/auth.context.jsx'
import { showtimeApi } from '../services/showtime.api.js'
import { seatApi } from '../services/seat.api.js'
import { getServices } from '../services/service.api.js'
import { bookingApi } from '../services/booking.api.js'
import { paymentApi } from '../services/payment.api.js'
import { pointApi } from '../services/point.api.js'
import { notifyError, notifySuccess } from '../util/notify.js'

import SeatSelection from '../components/booking/SeatSelection.jsx'
import ServiceConcessions from '../components/booking/ServiceConcessions.jsx'
import PaymentMethodSelection from '../components/booking/PaymentMethodSelection.jsx'
import BillingSidebar from '../components/booking/BillingSidebar.jsx'
import ConfirmModal from '../components/booking/ConfirmModal.jsx'

export default function BookingPage({ showtimeId, onNavigate }) {
  const { user, isAdmin, isStaff } = useAuth()
  
  // Steps: 1 = Seat Selection, 2 = Service Concessions, 3 = Promo & Payment
  const [step, setStep] = useState(1)
  const [showtime, setShowtime] = useState(null)
  const [seats, setSeats] = useState([])
  const [concessions, setConcessions] = useState([])
  
  const [selectedSeats, setSelectedSeats] = useState([])
  const [selectedServices, setSelectedServices] = useState({}) // { [serviceId]: quantity }
  
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [promoError, setPromoError] = useState('')
  const [promoSuccess, setPromoSuccess] = useState('')
  
  // Staff/Admin defaults to CASH at counter, online users default to VNPAY
  const [paymentMethod, setPaymentMethod] = useState(() => (isAdmin || isStaff) ? 'CASH' : 'VNPAY')
  
  // Counter guest sales details
  const [counterCustomerName, setCounterCustomerName] = useState('')
  const [counterCustomerPhone, setCounterCustomerPhone] = useState('')
  const [counterCustomerEmail, setCounterCustomerEmail] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Point redemption state
  const [pointBalance, setPointBalance] = useState(null)   // { totalPoints, maxRedeemPoints, maxRedeemVnd, pointValueVnd }
  const [usePoints, setUsePoints] = useState(false)        // user có toggle dùng điểm không

  // 1. Load Showtime, Seat Map, and Concessions
  useEffect(() => {
    let active = true
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')
        
        const stRes = await showtimeApi.getById(showtimeId)
        if (!active) return
        if (stRes) {
          setShowtime(stRes)
        } else {
          setError('Không thể tải thông tin suất chiếu.')
          setLoading(false)
          return
        }

        const seatsRes = await seatApi.getSeatsByShowtime(showtimeId)
        if (!active) return
        if (seatsRes) {
          setSeats(seatsRes)
        } else {
          setError('Không thể tải sơ đồ ghế.')
        }

        const servicesRes = await getServices({ isActive: true, limit: 100 })
        if (!active) return
        if (servicesRes) {
          setConcessions(Array.isArray(servicesRes) ? servicesRes : (servicesRes.items || []))
        }
        
      } catch (err) {
        if (active) {
          setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchData()
    return () => {
      active = false
    }
  }, [showtimeId])

  // 2. Group seats by Row Index for rendering
  const seatRows = useMemo(() => {
    const rows = {}
    seats.forEach((seat) => {
      const r = seat.rowIndex
      if (!rows[r]) rows[r] = []
      rows[r].push(seat)
    })
    
    Object.keys(rows).forEach((r) => {
      rows[r].sort((a, b) => a.columnIndex - b.columnIndex)
    })
    
    return rows
  }, [seats])

  // 3. Selection handlers
  const handleSelectSeat = (seat) => {
    if (seat.status !== 'AVAILABLE') return

    const isAlreadySelected = selectedSeats.some((s) => s._id === seat._id)
    if (isAlreadySelected) {
      setSelectedSeats(selectedSeats.filter((s) => s._id !== seat._id))
    } else {
      setSelectedSeats([...selectedSeats, seat])
    }
    
    setAppliedPromo(null)
    setPromoSuccess('')
    setPromoError('')
  }

  const handleUpdateServiceQuantity = (serviceId, increment) => {
    const currentQty = selectedServices[serviceId] || 0
    const newQty = increment ? currentQty + 1 : Math.max(currentQty - 1, 0)
    
    setSelectedServices({
      ...selectedServices,
      [serviceId]: newQty,
    })

    setAppliedPromo(null)
    setPromoSuccess('')
    setPromoError('')
  }

  // 4. Calculations
  const ticketsPrice = useMemo(() => {
    if (!showtime) return 0
    return selectedSeats.reduce((sum, seat) => {
      const surcharge = seat.seatType?.surchargeAmount || 0
      return sum + showtime.baseTicketPrice + surcharge
    }, 0)
  }, [selectedSeats, showtime])

  const concessionsPrice = useMemo(() => {
    return Object.entries(selectedServices).reduce((sum, [serviceId, qty]) => {
      const item = concessions.find((c) => c._id === serviceId)
      if (!item) return sum
      return sum + item.unitPrice * qty
    }, 0)
  }, [selectedServices, concessions])

  const subtotal = ticketsPrice + concessionsPrice

  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0
    return appliedPromo.discountAmount
  }, [appliedPromo])

  // Giảm từ điểm: mỗi điểm = 1.000 đ, tối đa 50 điểm/lần
  const pointDiscountAmount = useMemo(() => {
    if (!usePoints || !pointBalance || (isAdmin || isStaff)) return 0
    return pointBalance.maxRedeemVnd || 0
  }, [usePoints, pointBalance, isAdmin, isStaff])

  const grandTotal = Math.max(subtotal - discountAmount - pointDiscountAmount, 0)

  // 5. Promo code verification
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Vui lòng nhập mã khuyến mãi.')
      return
    }
    
    try {
      setPromoError('')
      setPromoSuccess('')
      
      const res = await bookingApi.validatePromoCode({
        code: promoCode,
        totalAmount: subtotal,
        ticketCount: selectedSeats.length
      })

      if (res) {
        setAppliedPromo(res)
        setPromoSuccess(`Áp dụng mã thành công! Bạn được giảm ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(res.discountAmount)}`)
      } else {
        setPromoError('Mã khuyến mãi không hợp lệ.')
        setAppliedPromo(null)
      }
    } catch (err) {
      setPromoError(err.message || 'Có lỗi xảy ra khi xác thực mã.')
      setAppliedPromo(null)
    }
  }

  // 6. Complete Booking Action (online redirects to real MoMo/VNPay sandbox gateway URL)
  const handlePlaceBooking = async () => {
    try {
      setBookingLoading(true)
      setError('')
      setShowConfirmModal(false)

      const isCounter = isAdmin || isStaff

      if (isCounter) {
        if (!counterCustomerName.trim()) {
          notifyError('Vui lòng nhập Họ tên khách hàng tại quầy.')
          setBookingLoading(false)
          return
        }
        if (!counterCustomerPhone.trim()) {
          notifyError('Vui lòng nhập Số điện thoại khách hàng tại quầy.')
          setBookingLoading(false)
          return
        }
        const phoneRegex = /^[0-9]{10,11}$/
        if (!phoneRegex.test(counterCustomerPhone.trim())) {
          notifyError('Số điện thoại không hợp lệ (Phải từ 10 đến 11 chữ số).')
          setBookingLoading(false)
          return
        }
      }

      const serviceList = Object.entries(selectedServices)
        .filter(([_, qty]) => qty > 0)
        .map(([serviceId, qty]) => ({
          serviceId,
          quantity: qty
        }))

      const res = await bookingApi.createBooking({
        showtimeId,
        seatIds: selectedSeats.map((s) => s._id),
        services: serviceList,
        promoCode: appliedPromo ? appliedPromo.code : undefined,
        paymentMethod: isCounter ? 'CASH' : paymentMethod,
        bookingSource: isCounter ? 'COUNTER' : 'ONLINE',
        customerName: isCounter ? counterCustomerName : undefined,
        customerPhone: isCounter ? counterCustomerPhone : undefined,
        customerEmail: isCounter ? counterCustomerEmail : undefined,
        // Truyền số điểm muốn dùng (chỉ online)
        usePoints: (!isCounter && usePoints && pointBalance) ? pointBalance.maxRedeemPoints : 0
      })

      if (res && res._id) {
        if (isCounter) {
          // Counter: booking marked PAID at counter cash sales
          onNavigate('/staff/check-ticket')
        } else {
          // Online Checkout: call backend payment gateway URL generator
          const payRes = await paymentApi.createPayment(res._id, paymentMethod.toLowerCase())
          if (payRes && payRes.url) {
            // Redirect the user directly to the real gateway URL
            window.location.href = payRes.url
          } else {
            setError('Không lấy được URL thanh toán từ cổng. Vui lòng thử lại.')
          }
        }
      } else {
        setError('Có lỗi xảy ra khi tạo đơn đặt vé.')
      }
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi kết nối với máy chủ.')
      if (err.message && (err.message.includes('khóa giữ chỗ') || err.message.includes('đã bị khóa hoặc đã được mua'))) {
        setStep(1)
        try {
          const seatsRes = await seatApi.getSeatsByShowtime(showtimeId)
          if (seatsRes) {
            setSeats(seatsRes)
            setSelectedSeats((prev) =>
              prev.filter((s) =>
                seatsRes.some((newS) => newS._id === s._id && newS.status === 'AVAILABLE')
              )
            )
          }
        } catch (seatErr) {
          console.error('[BookingFlow] Error refetching seats:', seatErr)
        }
      }
    } finally {
      setBookingLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-5 text-center mt-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-secondary mt-3">Đang tải sơ đồ rạp và thông tin đặt vé...</p>
      </div>
    )
  }

  if (error && !showtime) {
    return (
      <div className="container py-5 mt-5">
        <div className="alert alert-danger text-center shadow-lg border-0 rounded-4">
          <h4 className="fw-bold mb-2">Đã xảy ra lỗi</h4>
          <p>{error}</p>
          <button className="btn btn-danger mt-3 px-4 rounded-3" onClick={() => onNavigate('/movies')}>
            Về danh sách phim
          </button>
        </div>
      </div>
    )
  }

  const movie = showtime?.movie

  return (
    <section className="container-fluid py-4 px-3 px-lg-5" style={{ backgroundColor: '#030712', minHeight: 'calc(100vh - 88px)' }}>
      {error && (
        <div className="alert alert-danger alert-modern mb-4 shadow-sm" role="alert">
          ⚠️ {error}
        </div>
      )}

      {/* Top flow steps indicator */}
      <div className="row justify-content-center mb-4">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="d-flex align-items-center justify-content-between position-relative px-2">
            <div className="position-absolute start-0 end-0 top-50 translate-y-middle bg-secondary" style={{ height: '2px', zIndex: 0 }} />
            <div className="position-absolute start-0 bg-danger top-50 translate-y-middle" style={{ height: '2px', width: `${((step - 1) / 2) * 100}%`, zIndex: 0, transition: 'width 0.3s ease' }} />
            
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                className={`btn rounded-circle fw-bold d-flex align-items-center justify-content-center border-2`}
                style={{
                  width: '45px',
                  height: '45px',
                  zIndex: 1,
                  backgroundColor: s === step ? '#dc3545' : (s < step ? '#198754' : '#1f2937'),
                  color: '#fff',
                  borderColor: s === step ? '#dc3545' : (s < step ? '#198754' : '#4b5563'),
                  transition: 'all 0.3s ease'
                }}
                disabled={s > step && selectedSeats.length === 0}
                onClick={() => setStep(s)}
              >
                {s < step ? '✓' : s}
              </button>
            ))}
          </div>
          <div className="d-flex justify-content-between mt-2 text-center text-white-50 px-0" style={{ fontSize: '0.82rem' }}>
            <span className={step === 1 ? 'text-danger fw-bold' : ''}>Chọn ghế</span>
            <span className={step === 2 ? 'text-danger fw-bold' : ''}>Dịch vụ & Khuyến mãi</span>
            <span className={step === 3 ? 'text-danger fw-bold' : ''}>Thanh toán</span>
          </div>
        </div>
      </div>

      <div className="row g-4 mt-1">
        {/* LEFT COLUMN: ACTIVE STEP PANEL */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 bg-dark text-light p-4 rounded-4 shadow-lg mb-4" style={{ backgroundColor: '#0f172a' }}>
            {step === 1 && (
              <SeatSelection 
                seatRows={seatRows} 
                selectedSeats={selectedSeats} 
                onSelectSeat={handleSelectSeat} 
              />
            )}
            {step === 2 && (
              <ServiceConcessions 
                concessions={concessions} 
                selectedServices={selectedServices} 
                onUpdateServiceQuantity={handleUpdateServiceQuantity} 
                promoCode={promoCode}
                setPromoCode={setPromoCode}
                onApplyPromo={handleApplyPromo}
                promoError={promoError}
                promoSuccess={promoSuccess}
                bookingLoading={bookingLoading}
              />
            )}
            {step === 3 && (
              <PaymentMethodSelection 
                isAdmin={isAdmin}
                isStaff={isStaff}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                counterCustomerName={counterCustomerName}
                setCounterCustomerName={setCounterCustomerName}
                counterCustomerPhone={counterCustomerPhone}
                setCounterCustomerPhone={setCounterCustomerPhone}
                counterCustomerEmail={counterCustomerEmail}
                setCounterCustomerEmail={setCounterCustomerEmail}
                bookingLoading={bookingLoading}
                // Điểm tích lũy
                pointBalance={pointBalance}
                setPointBalance={setPointBalance}
                usePoints={usePoints}
                setUsePoints={setUsePoints}
              />
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: STICKY BILLING SIDEBAR PANEL */}
        <div className="col-12 col-lg-4">
          <BillingSidebar 
            movie={movie}
            showtime={showtime}
            selectedSeats={selectedSeats}
            selectedServices={selectedServices}
            concessions={concessions}
            step={step}
            setStep={setStep}
            ticketsPrice={ticketsPrice}
            concessionsPrice={concessionsPrice}
            appliedPromo={appliedPromo}
            discountAmount={discountAmount}
            pointDiscountAmount={pointDiscountAmount}
            grandTotal={grandTotal}
            bookingLoading={bookingLoading}
            isAdmin={isAdmin}
            isStaff={isStaff}
            onShowConfirmModal={() => {
              if (isAdmin || isStaff) {
                if (!counterCustomerName.trim()) {
                  notifyError('Vui lòng nhập Họ tên khách hàng tại quầy.')
                  return
                }
                if (!counterCustomerPhone.trim()) {
                  notifyError('Vui lòng nhập Số điện thoại khách hàng tại quầy.')
                  return
                }
                const phoneRegex = /^[0-9]{10,11}$/
                if (!phoneRegex.test(counterCustomerPhone.trim())) {
                  notifyError('Số điện thoại không hợp lệ (Phải từ 10 đến 11 chữ số).')
                  return
                }
              }
              setError('')
              setShowConfirmModal(true)
            }}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      {/* WARNING CONFIRMATION MODAL OVERLAY */}
      {showConfirmModal && (
        <ConfirmModal 
          bookingLoading={bookingLoading}
          selectedSeats={selectedSeats}
          selectedServices={selectedServices}
          concessions={concessions}
          grandTotal={grandTotal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handlePlaceBooking}
        />
      )}
    </section>
  )
}
