import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../components/context/auth.context.jsx'
import { bookingApi } from '../services/booking.api.js'
import { requestJson } from '../services/api.client.js'

function formatPrice(amount) {
  if (!amount && amount !== 0) return '0đ'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatTimeOnly(value) {
  if (!value) return '--:--'
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatDateOnly(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export default function BookingResultPage({ onNavigate }) {
  const { user, isAdmin, isStaff } = useAuth()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentFailed, setPaymentFailed] = useState(false)
  const [paymentCancelled, setPaymentCancelled] = useState(false)

  // Extract hash queries: bookingId, status, message
  const hashPart = window.location.hash.split('?')[1] || ''
  const searchParams = new URLSearchParams(hashPart)
  const bookingId = searchParams.get('bookingId')

  // Check if this is a callback returning from VNPay or MoMo
  const isVnpayCallback = searchParams.has('vnp_SecureHash') || searchParams.has('vnp_ResponseCode')
  const isMomoCallback = searchParams.has('resultCode') || searchParams.has('partnerCode')

  // Dùng ref để đảm bảo chỉ chạy 1 lần duy nhất (tránh StrictMode double-invoke gây loop)
  const hasRun = useRef(false)

  useEffect(() => {
    // Chỉ chạy 1 lần — tránh vòng lặp vô tận do hashPart/paymentFailed thay đổi
    if (hasRun.current) return
    hasRun.current = true

    const handleCallbackAndLoad = async () => {
      // Dùng biến local thay vì state để tránh stale closure
      let localFailed = false

      try {
        setLoading(true)
        setError('')
        setPaymentFailed(false)

        let targetBookingId = bookingId
        let paymentStatus = 'FAILED'
        let paymentMsg = ''

        if (isVnpayCallback) {
          try {
            const verifyRes = await requestJson(`/api/payment/vnpay/callback?${hashPart}`)
            targetBookingId = verifyRes.bookingId || targetBookingId
            paymentStatus = verifyRes.status || 'FAILED'
            paymentMsg = verifyRes.message || 'Thanh toán qua VNPAY thất bại.'

            if (paymentStatus === 'PAID' && targetBookingId) {
              await bookingApi.payBooking(targetBookingId, { paymentMethod: 'VNPAY' })
            } else if (paymentStatus === 'CANCELLED') {
              localFailed = false
              setPaymentCancelled(true)
              setError(paymentMsg)
              if (targetBookingId) {
                bookingApi.cancelBooking(targetBookingId).catch(e =>
                  console.warn('[BookingResult] Không thể hủy booking sau khi thanh toán thất bại:', e.message)
                )
              }
            } else {
              localFailed = true
              setPaymentFailed(true)
              setError(paymentMsg)
              // Tự động hủy booking để giải phóng ghế và HOÀN ĐIỂM tích lũy
              if (targetBookingId) {
                bookingApi.cancelBooking(targetBookingId).catch(e =>
                  console.warn('[BookingResult] Không thể hủy booking sau khi thanh toán thất bại:', e.message)
                )
              }
            }
          } catch (err) {
            localFailed = true
            setPaymentFailed(true)
            setError(err.message || 'Xác thực chữ ký VNPAY thất bại.')
          }
        } else if (isMomoCallback) {
          try {
            const verifyRes = await requestJson(`/api/payment/momo/callback?${hashPart}`)
            targetBookingId = verifyRes.bookingId || targetBookingId
            paymentStatus = verifyRes.status || 'FAILED'
            paymentMsg = verifyRes.message || 'Thanh toán qua MOMO thất bại.'

            if (paymentStatus === 'PAID' && targetBookingId) {
              await bookingApi.payBooking(targetBookingId, { paymentMethod: 'MOMO' })
            } else if (paymentStatus === 'CANCELLED') {
              localFailed = false
              setPaymentCancelled(true)
              setError(paymentMsg)
              if (targetBookingId) {
                bookingApi.cancelBooking(targetBookingId).catch(e =>
                  console.warn('[BookingResult] Không thể hủy booking sau khi thanh toán thất bại:', e.message)
                )
              }
            } else {
              localFailed = true
              setPaymentFailed(true)
              setError(paymentMsg)
              // Tự động hủy booking để giải phóng ghế và HOÀN ĐIỂM tích lũy
              if (targetBookingId) {
                bookingApi.cancelBooking(targetBookingId).catch(e =>
                  console.warn('[BookingResult] Không thể hủy booking sau khi thanh toán thất bại:', e.message)
                )
              }
            }
          } catch (err) {
            localFailed = true
            setPaymentFailed(true)
            setError(err.message || 'Xác thực chữ ký MOMO thất bại.')
          }
        }

        const finalBookingId = targetBookingId || bookingId
        if (!finalBookingId) {
          throw new Error('Thiếu thông tin đơn hàng.')
        }

        // Vẫn tải chi tiết booking để hiển thị thông tin đơn hàng
        const res = await bookingApi.getBookingDetails(finalBookingId)
        if (res) {
          setBooking(res)
        } else if (!localFailed) {
          throw new Error('Không thể lấy thông tin đơn đặt vé.')
        }
      } catch (err) {
        if (!localFailed) {
          setError(err.message || 'Có lỗi xảy ra trong quá trình xử lý đơn hàng.')
        }
      } finally {
        setLoading(false)
      }
    }

    handleCallbackAndLoad()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Chạy đúng 1 lần khi mount — hashPart/bookingId đã được đọc ở thời điểm này

  const handlePrintTicket = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="container py-5 text-center mt-5" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-secondary mt-3">Đang cập nhật trạng thái đơn hàng...</p>
      </div>
    )
  }

  if (error && !booking) {
    return (
      <div className="container py-5 mt-5" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="alert alert-danger text-center shadow-lg border-0 rounded-4 max-w-md mx-auto" style={{ maxWidth: '480px' }}>
          <h4 className="fw-bold mb-2">Đã xảy ra lỗi</h4>
          <p>{error}</p>
          <button className="btn btn-danger mt-3 px-4 rounded-3 fw-bold" onClick={() => onNavigate('/movies')}>
            Quay lại trang chủ
          </button>
        </div>
      </div>
    )
  }

  const finalStatus = paymentFailed ? 'FAILED' : (paymentCancelled ? 'CANCELLED' : (booking?.status || 'FAILED'))
  const showtime = booking?.showtime
  const movie = showtime?.movie

  return (
    <section className="container py-5 px-3 px-lg-5 text-light" style={{ backgroundColor: '#030712', minHeight: 'calc(100vh - 88px)' }}>

      <div className="row justify-content-center mt-3">
        <div className="col-12 col-lg-8">

          {/* SUCCESS STATUS - PAID */}
          {finalStatus === 'PAID' && (
            <div className="card border-0 text-center p-5 rounded-4 shadow-lg mb-4 text-light bg-dark animate-fade-in" style={{ backgroundColor: '#0f172a' }}>
              <div className="mb-3 text-success">
                <span className="fs-1 d-block mb-1">🎉</span>
                <h3 className="fw-bold tracking-tight text-success">ĐẶT VÉ THÀNH CÔNG</h3>
                <p className="text-white-50">Cảm ơn bạn đã lựa chọn dịch vụ của Movie Group 9!</p>
              </div>

              {/* Luxury Invoice Bill */}
              <div className="bg-black border border-secondary border-opacity-30 rounded-4 p-4 text-start mx-auto my-4 w-100 print-area" style={{ maxWidth: '460px', boxShadow: '0 4px 25px rgba(0,0,0,0.4)' }}>
                <div className="text-center border-bottom border-secondary border-opacity-30 pb-3 mb-3">
                  <h5 className="fw-bold text-light mb-1">🎟 HÓA ĐƠN ĐƠN HÀNG</h5>
                  <small className="text-white-50 small font-monospace">Mã đơn: {booking?._id}</small>
                </div>

                {movie && (
                  <h6 className="fw-bold text-danger fs-5 mb-3 text-uppercase text-center">{movie.title}</h6>
                )}

                <div className="vstack gap-2" style={{ fontSize: '0.88rem' }}>
                  <div className="d-flex justify-content-between">
                    <span className="text-white-50">Phòng chiếu:</span>
                    <strong className="text-light">{showtime?.auditorium?.name}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-white-50">Suất chiếu:</span>
                    <strong className="text-danger fw-bold">{formatTimeOnly(showtime?.startTime)}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-white-50">Ngày chiếu:</span>
                    <strong className="text-light">{formatDateOnly(showtime?.startTime)}</strong>
                  </div>

                  {booking?.bookingSource === 'COUNTER' && (
                    <>
                      <div className="d-flex justify-content-between border-top border-secondary border-opacity-10 pt-1 mt-1">
                        <span className="text-white-50">Khách hàng:</span>
                        <strong className="text-success">{booking.customerName}</strong>
                      </div>
                      {booking.customerPhone && (
                        <div className="d-flex justify-content-between">
                          <span className="text-white-50">Số điện thoại:</span>
                          <strong className="text-light">{booking.customerPhone}</strong>
                        </div>
                      )}
                      {booking.customerEmail && (
                        <div className="d-flex justify-content-between" style={{ wordBreak: 'break-all' }}>
                          <span className="text-white-50">Email:</span>
                          <strong className="text-light text-end" style={{ maxWidth: '240px' }}>{booking.customerEmail}</strong>
                        </div>
                      )}
                    </>
                  )}

                  <div className="d-flex justify-content-between border-top border-secondary border-opacity-30 pt-2 mt-1">
                    <span className="text-white-50">Ghế ngồi:</span>
                    <strong className="text-light">
                      {booking?.tickets?.map((t) => t.seat?.name).join(', ')}
                    </strong>
                  </div>

                  {booking?.bookingExtras?.length > 0 && (
                    <div className="d-flex justify-content-between">
                      <span className="text-white-50">Dịch vụ đi kèm:</span>
                      <span className="text-light text-end fw-bold" style={{ maxWidth: '240px' }}>
                        {booking.bookingExtras.map((e) => `${e.service?.name} (x${e.quantity})`).join(', ')}
                      </span>
                    </div>
                  )}

                  <div className="d-flex justify-content-between border-top border-secondary border-opacity-30 pt-2 mt-2">
                    <span className="text-white-50">Hình thức:</span>
                    <span className="text-info fw-bold">{booking?.payment?.paymentMethod || 'VNPAY'}</span>
                  </div>

                  <div className="d-flex justify-content-between mt-1 border-top border-secondary border-opacity-30 pt-2">
                    <span className="text-light fw-bold">Tổng thanh toán:</span>
                    <strong className="text-danger fs-5 fw-bold">{formatPrice(booking?.totalAmount)}</strong>
                  </div>
                </div>
              </div>

              {/* Tickets List with QR Codes */}
              <div className="mt-4 pt-4 border-top border-secondary border-opacity-30 border-dashed">
                <h5 className="fw-bold text-light text-center mb-3">🎟️ VÉ XEM PHIM CỦA BẠN</h5>
                <div className="row g-3 row-cols-1 row-cols-sm-2 justify-content-center">
                  {booking?.tickets?.map((ticket, index) => {
                    const qrUrl = ticket.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticket._id}`
                    return (
                      <div key={ticket._id} className="col" style={{ maxWidth: '380px' }}>
                        <div className="card bg-black border border-secondary border-opacity-50 shadow-lg h-100 rounded-3 p-3 text-light text-start" style={{ backgroundColor: '#0f172a' }}>
                          <div className="d-flex justify-content-between align-items-center border-bottom border-secondary border-opacity-30 pb-2 mb-2">
                            <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25 fw-bold">VÉ #${index + 1}</span>
                            <span className="badge bg-info bg-opacity-25 text-info border border-info border-opacity-25 fw-bold">{ticket.seat?.seatType?.name || 'STANDARD'}</span>
                          </div>

                          <div className="d-flex align-items-center gap-3">
                            <div className="flex-grow-1 min-w-0" style={{ wordBreak: 'break-word' }}>
                              <h6 className="fw-bold text-light mb-1 text-wrap" style={{ fontSize: '0.88rem', lineHeight: '1.4' }}>{movie?.title}</h6>
                              <p className="mb-0 text-white-50 small">Phòng: <strong className="text-light">{showtime?.auditorium?.name}</strong></p>
                              <p className="mb-0 text-white-50 small">Suất: <strong className="text-danger">{formatTimeOnly(showtime?.startTime)}</strong></p>
                              <p className="mb-0 text-success fw-bold fs-5 mt-1">Ghế: {ticket.seat?.name}</p>
                            </div>
                            <div className="text-center bg-white p-1.5 border border-secondary rounded shadow-sm flex-shrink-0" style={{ width: '96px' }}>
                              <img src={qrUrl} alt="Ticket QR" style={{ width: '84px', height: '84px', display: 'block', margin: '0 auto' }} />
                              <small className="text-dark d-block mt-1 fw-bold" style={{ fontSize: '0.52rem' }}>MÃ VÀO CỔNG</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex gap-2 justify-content-center mt-5 no-print">
                {(isAdmin || isStaff) && (
                  <button
                    type="button"
                    className="btn btn-outline-success px-4 py-2.5 rounded-3 fw-bold d-flex align-items-center gap-2"
                    onClick={handlePrintTicket}
                  >
                    🖨 In Vé Cứng
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-danger px-5 py-2.5 rounded-3 fw-bold"
                  onClick={() => onNavigate((isAdmin || isStaff) ? '/staff/check-ticket' : '/movies')}
                >
                  {(isAdmin || isStaff) ? 'Quay lại Bảng điều khiển Staff' : 'Quay lại trang chủ'}
                </button>
              </div>

              {/* Loyalty Points Reminder (chỉ hiện với user thường) */}
              {!isAdmin && !isStaff && (
                <div
                  className="mt-4 rounded-4 p-3 d-flex align-items-center gap-3 no-print"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(99,102,241,0.1))',
                    border: '1px solid rgba(139,92,246,0.3)'
                  }}
                >
                  <span style={{ fontSize: 28 }}>⭐</span>
                  <div className="text-start flex-grow-1">
                    <div className="fw-bold text-light" style={{ fontSize: '0.9rem' }}>
                      Đánh giá phim để nhận 10 điểm tích lũy!
                    </div>
                    <div className="text-white-50 small">
                      Sau khi xem xong, hãy đánh giá phim trong mục <em>Vé của tôi</em>.
                      Mỗi đánh giá đầu tiên = <strong className="text-warning">10 điểm</strong> (1 điểm = 1.000đ giảm giá cho lần sau).
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm rounded-pill fw-bold flex-shrink-0"
                    style={{ background: 'rgba(139,92,246,0.3)', color: '#c4b5fd', border: 'none' }}
                    onClick={() => onNavigate('/user/points')}
                  >
                    Xem điểm
                  </button>
                </div>
              )}
            </div>
          )}

          {/* FAILED / CANCELLED / EXPIRED STATUS */}
          {finalStatus !== 'PAID' && (
            <div className="card border-0 text-center p-5 rounded-4 shadow-lg mb-4 text-light bg-dark animate-fade-in" style={{ backgroundColor: '#0f172a' }}>
              {finalStatus === 'CANCELLED' ? (
                <div className="mb-3 text-danger">
                  <span className="fs-1 d-block mb-1">❌</span>
                  <h3 className="fw-bold tracking-tight text-danger">ĐÃ HỦY ĐƠN HÀNG</h3>
                  <p className="text-white-50">Đơn đặt vé này đã bị hủy thành công và toàn bộ ghế đã được giải phóng.</p>
                </div>
              ) : finalStatus === 'EXPIRED' ? (
                <div className="mb-3 text-warning">
                  <span className="fs-1 d-block mb-1">⏰</span>
                  <h3 className="fw-bold tracking-tight text-warning">HẾT HẠN GIỮ GHẾ</h3>
                  <p className="text-white-50">Thời gian giữ ghế 10 phút của bạn đã kết thúc. Hệ thống đã tự động giải phóng toàn bộ ghế ngồi.</p>
                </div>
              ) : (
                <div className="mb-3 text-danger">
                  <span className="fs-1 d-block mb-1">⚠️</span>
                  <h3 className="fw-bold tracking-tight text-danger">THANH TOÁN THẤT BẠI</h3>
                  <p className="text-white-50">Có lỗi xảy ra trong quá trình xử lý giao dịch của bạn.</p>
                </div>
              )}

              <div className="d-flex gap-2 justify-content-center mt-4">
                <button
                  type="button"
                  className="btn btn-danger px-5 py-2.5 rounded-3 fw-bold"
                  onClick={() => onNavigate('/movies')}
                >
                  Quay lại chọn phim & ghế khác
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  )
}
