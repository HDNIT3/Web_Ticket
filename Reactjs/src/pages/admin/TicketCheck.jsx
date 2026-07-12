import { useState, useEffect, useRef, useMemo } from 'react'
import { bookingApi } from '../../services/booking.api.js'
import { showtimeApi as showtimeService } from '../../services/showtime.api.js'
import { getMovies } from '../../services/movie.api.js'
import BookingPage from '../booking-flow.jsx'
import { notifySuccess, notifyError } from '../../util/notify.js'
import { Html5Qrcode } from 'html5-qrcode'

function formatPrice(amount) {
  if (!amount && amount !== 0) return '0đ'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatDateTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTimeOnly(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

export default function TicketCheck() {
  const [activeTab, setActiveTab] = useState('SCAN') // SCAN, SELL

  // SCAN TAB & CAMERA SCAN STATES
  const [qrInput, setQrInput] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [scanResult, setScanResult] = useState(null) // { success: boolean, data: any, message: string }

  // Web Camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const scannerRef = useRef(null)

  // REAL DATABASE STAFF ACTIVITIES (BÁN VÉ TẠI QUẦY & SOÁT VÉ CỔNG)
  const [staffActivity, setStaffActivity] = useState({ bookings: [], tickets: [] })
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [logSubTab, setLogSubTab] = useState('SCANS') // SCANS, SALES

  // HISTORY FILTER STATES
  const [historySearch, setHistorySearch] = useState('')
  const [historyDateFilter, setHistoryDateFilter] = useState('ALL') // TODAY, YESTERDAY, ALL
  const [historyMovieFilter, setHistoryMovieFilter] = useState('')
  const [imageScanning, setImageScanning] = useState(false)

  const qrInputRef = useRef(null)

  // SELL TAB STATES
  const [movies, setMovies] = useState([])
  const [showtimes, setShowtimes] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAuditorium, setFilterAuditorium] = useState('')
  const [filterTodayOnly, setFilterTodayOnly] = useState(true)
  const [loadingShowtimes, setLoadingShowtimes] = useState(false)
  const [selectedShowtimeId, setSelectedShowtimeId] = useState(null)

  // Auto-focus manual scanner text input
  useEffect(() => {
    if (activeTab === 'SCAN' && qrInputRef.current && !isCameraOpen) {
      qrInputRef.current.focus()
    }
  }, [activeTab, scanResult, isCameraOpen])

  // Fetch real staff activity logs (bookings and checked-in tickets) from Database
  const fetchStaffActivity = async () => {
    try {
      setLoadingActivity(true)
      // requestJson trả về payload.data trực tiếp → res = { bookings: [], tickets: [] }
      const res = await bookingApi.getStaffActivity()
      setStaffActivity({
        bookings: res?.bookings || [],
        tickets: res?.tickets || [],
      })
    } catch (err) {
      console.error('Không thể tải lịch sử hoạt động nhân viên:', err)
    } finally {
      setLoadingActivity(false)
    }
  }

  // Load activities on mount
  useEffect(() => {
    fetchStaffActivity()
  }, [])

  // Start browser web camera for QR scanning
  const startCamera = () => {
    setIsCameraOpen(true)
    setScanResult(null)
  }

  // Stop camera and reset
  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop()
        }
      } catch (err) {
        console.error('Error stopping QR scanner camera:', err)
      }
      scannerRef.current = null
    }
    setIsCameraOpen(false)
  }

  // Camera initialization and cleanup
  useEffect(() => {
    if (isCameraOpen) {
      const html5QrCode = new Html5Qrcode('reader')
      scannerRef.current = html5QrCode

      html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.7
            return { width: size, height: size }
          }
        },
        async (decodedText) => {
          // Success: Stop camera and verify
          await stopCamera()
          await handleVerifyQRData(decodedText)
        },
        (errorMessage) => {
          // Silent scan frames errors
        }
      ).catch(err => {
        console.error('Không thể truy cập camera:', err)
        notifyError('Không thể truy cập camera! Vui lòng cấp quyền camera trong trình duyệt của bạn.')
        setIsCameraOpen(false)
      })
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(err => console.error(err))
        scannerRef.current = null
      }
    }
  }, [isCameraOpen])

  // Centralized verification handler
  const handleVerifyQRData = async (data) => {
    const cleanData = data.trim()
    if (!cleanData) return

    setVerifyLoading(true)
    setScanResult(null)
    try {
      const res = await bookingApi.verifyTicket(cleanData)
      // requestJson trả về trực tiếp payload.data (chứa { ticket, booking })
      if (res && res.ticket) {
        setScanResult({
          success: true,
          message: 'Xác thực vé thành công! Vé hợp lệ.',
          data: res
        })
        notifySuccess(`Soát vé thành công: Ghế ${res.ticket.seatName}`)
        // Refresh the database activities
        await fetchStaffActivity()
      } else {
        throw new Error('Mã vé không hợp lệ hoặc thiếu thông tin.')
      }
    } catch (err) {
      setScanResult({
        success: false,
        message: err.message || 'Xác thực vé thất bại.'
      })
      notifyError(err.message || 'Soát vé thất bại!')
      await fetchStaffActivity()
    } finally {
      setQrInput('')
      setVerifyLoading(false)
    }
  }

  // Submit form for manual scanner input
  const handleVerifySubmit = async (e) => {
    if (e) e.preventDefault()
    await handleVerifyQRData(qrInput)
  }

  // Handle QR code scanning from local image file
  const handleScanImageFile = async (file) => {
    setImageScanning(true)
    setVerifyLoading(true)
    setScanResult(null)

    let html5QrCode;
    try {
      html5QrCode = new Html5Qrcode('reader-file')
      const decodedText = await html5QrCode.scanFile(file, false)
      await handleVerifyQRData(decodedText)
    } catch (err) {
      console.error('Lỗi quét file ảnh QR:', err)
      notifyError('Không thể giải mã QR từ ảnh này. Vui lòng chọn ảnh rõ nét hơn!')
      setScanResult({
        success: false,
        message: 'Không thể giải mã mã QR từ ảnh được tải lên hoặc dán từ clipboard.'
      })
    } finally {
      setImageScanning(false)
      setVerifyLoading(false)
      if (html5QrCode) {
        try {
          html5QrCode.clear()
        } catch (e) { }
      }
    }
  }

  // Intercept paste event on text input to capture image files
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault()
        const file = items[i].getAsFile()
        if (file) {
          await handleScanImageFile(file)
        }
        break
      }
    }
  }

  // Extract unique movies from history logs
  const uniqueHistoryMovies = useMemo(() => {
    const map = {}
    if (logSubTab === 'SCANS') {
      ; (staffActivity.tickets || []).forEach(ticket => {
        const title = ticket.booking?.showtime?.movie?.title
        const id = ticket.booking?.showtime?.movie?._id || ticket.booking?.showtime?.movie?.id
        if (title && id) map[id] = title
      })
    } else {
      ; (staffActivity.bookings || []).forEach(booking => {
        const title = booking.showtime?.movie?.title
        const id = booking.showtime?.movie?._id || booking.showtime?.movie?.id
        if (title && id) map[id] = title
      })
    }
    return Object.entries(map).map(([id, title]) => ({ id, title }))
  }, [staffActivity, logSubTab])

  // Filter scanned tickets history
  const filteredTickets = useMemo(() => {
    let list = staffActivity.tickets || []

    if (historySearch.trim()) {
      const q = historySearch.toLowerCase().trim()
      list = list.filter(ticket => {
        const movieTitle = (ticket.booking?.showtime?.movie?.title || '').toLowerCase()
        const buyerName = (ticket.booking?.user?.name || ticket.booking?.customerName || '').toLowerCase()
        const buyerPhone = (ticket.booking?.user?.phone || ticket.booking?.customerPhone || '').toLowerCase()
        const ticketId = (ticket._id || '').toLowerCase()
        return movieTitle.includes(q) || buyerName.includes(q) || buyerPhone.includes(q) || ticketId.includes(q)
      })
    }

    const now = new Date()
    const todayStr = now.toDateString()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toDateString()

    if (historyDateFilter === 'TODAY') {
      list = list.filter(t => new Date(t.checkedInAt).toDateString() === todayStr)
    } else if (historyDateFilter === 'YESTERDAY') {
      list = list.filter(t => new Date(t.checkedInAt).toDateString() === yesterdayStr)
    }

    if (historyMovieFilter) {
      list = list.filter(t => {
        const mvId = t.booking?.showtime?.movie?._id || t.booking?.showtime?.movie?.id
        return mvId === historyMovieFilter
      })
    }

    return list
  }, [staffActivity.tickets, historySearch, historyDateFilter, historyMovieFilter])

  // Filter offline sales bookings history
  const filteredBookings = useMemo(() => {
    let list = staffActivity.bookings || []

    if (historySearch.trim()) {
      const q = historySearch.toLowerCase().trim()
      list = list.filter(booking => {
        const movieTitle = (booking.showtime?.movie?.title || '').toLowerCase()
        const buyerName = (booking.user?.name || booking.customerName || '').toLowerCase()
        const buyerPhone = (booking.user?.phone || booking.customerPhone || '').toLowerCase()
        const bookingId = (booking._id || '').toLowerCase()
        return movieTitle.includes(q) || buyerName.includes(q) || buyerPhone.includes(q) || bookingId.includes(q)
      })
    }

    const now = new Date()
    const todayStr = now.toDateString()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toDateString()

    if (historyDateFilter === 'TODAY') {
      list = list.filter(b => new Date(b.createdAt).toDateString() === todayStr)
    } else if (historyDateFilter === 'YESTERDAY') {
      list = list.filter(b => new Date(b.createdAt).toDateString() === yesterdayStr)
    }

    if (historyMovieFilter) {
      list = list.filter(b => {
        const mvId = b.showtime?.movie?._id || b.showtime?.movie?.id
        return mvId === historyMovieFilter
      })
    }

    return list
  }, [staffActivity.bookings, historySearch, historyDateFilter, historyMovieFilter])

  // Fetch showtimes for Counter Sales Tab
  const fetchShowtimeData = async () => {
    try {
      setLoadingShowtimes(true)
      const [stRes, mvRes] = await Promise.all([
        showtimeService.getAll({ limit: 1000 }),
        getMovies({ limit: 1000 })
      ])

      const stItems = stRes?.items || stRes?.data || (Array.isArray(stRes) ? stRes : [])
      const mvItems = mvRes?.currentItem || mvRes?.currentItems || mvRes?.movies || mvRes?.data || (Array.isArray(mvRes) ? mvRes : [])

      // Chỉ lấy suất chiếu từ bây giờ trở đi (loại bỏ suất chiếu đã kết thúc)
      const now = Date.now()
      const validShowtimes = stItems.filter(st => new Date(st.startTime).getTime() >= now)

      setShowtimes(validShowtimes)
      setMovies(mvItems)
    } catch (err) {
      notifyError('Không thể tải lịch chiếu cho quầy bán vé: ' + err.message)
    } finally {
      setLoadingShowtimes(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'SELL') {
      fetchShowtimeData()
    }
    // Refresh staff activity when activeTab is changed
    fetchStaffActivity()
  }, [activeTab])

  // Lấy danh sách phòng chiếu duy nhất cho filter dropdown
  const uniqueAuditoriums = useMemo(() => {
    const map = {}
    showtimes.forEach(st => {
      const aud = st.auditorium
      if (aud && (aud._id || aud.id)) {
        const id = aud._id || aud.id
        if (!map[id]) map[id] = aud.name || id
      }
    })
    return Object.entries(map).map(([id, name]) => ({ id, name }))
  }, [showtimes])

  // Ngày hôm nay bắt đầu và kết thúc
  const todayStart = useMemo(() => new Date().setHours(0, 0, 0, 0), [])
  const todayEnd = useMemo(() => new Date().setHours(23, 59, 59, 999), [])

  // Filter showtimes grouped by movie
  const filteredShowtimesGrouped = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const grouped = {}
    showtimes.forEach(st => {
      const movie = st.movie || {}
      const mvId = movie._id || movie.id
      if (!mvId) return

      // Filter: Chỉ hôm nay
      if (filterTodayOnly) {
        const t = new Date(st.startTime).getTime()
        if (t < todayStart || t > todayEnd) return
      }

      // Filter: Phòng chiếu
      if (filterAuditorium) {
        const audId = st.auditorium?._id || st.auditorium?.id
        if (audId !== filterAuditorium) return
      }

      // Filter: Tìm kiếm
      if (query) {
        const titleMatch = movie.title?.toLowerCase().includes(query)
        const audMatch = st.auditorium?.name?.toLowerCase().includes(query)
        if (!titleMatch && !audMatch) return
      }

      if (!grouped[mvId]) {
        grouped[mvId] = { movie, items: [] }
      }
      grouped[mvId].items.push(st)
    })

    return Object.values(grouped).sort((a, b) => a.movie.title.localeCompare(b.movie.title))
  }, [showtimes, searchQuery, filterAuditorium, filterTodayOnly, todayStart, todayEnd])

  return (
    <section className="container-fluid px-2 px-md-3 px-xl-4 h-100 flex-grow-1 d-flex flex-column">

      {/* Tab Navigation header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4 border-bottom pb-3">
        <div>
          <h2 className="h4 mb-1 text-dark fw-black">🎟️ HỆ THỐNG SOÁT VÉ & QUẦY VÉ</h2>
          <p className="text-secondary mb-0 small">Bảng điều khiển nghiệp vụ cổng vào rạp và đặt vé CASH trực tiếp cho Nhân viên</p>
        </div>

        {/* Toggle tabs */}
        <div className="btn-group shadow-sm" role="group">
          <button
            type="button"
            className={`btn px-4 fw-bold ${activeTab === 'SCAN' ? 'btn-primary' : 'btn-outline-primary bg-white text-primary'}`}
            onClick={() => {
              setActiveTab('SCAN')
              setScanResult(null)
            }}
          >
            🎟️ Soát Vé Cổng Vào
          </button>
          <button
            type="button"
            className={`btn px-4 fw-bold ${activeTab === 'SELL' ? 'btn-primary' : 'btn-outline-primary bg-white text-primary'}`}
            onClick={() => {
              setActiveTab('SELL')
              setSelectedShowtimeId(null)
            }}
          >
            🏢 Bán Vé Tại Quầy
          </button>
        </div>
      </div>

      {/* TAB 1: SOÁT VÉ CỔNG VÀO (SCAN GATE CONTROLLER) */}
      {activeTab === 'SCAN' && (
        <div className="row g-4 flex-grow-1 align-items-stretch">
          <style>{`
            @keyframes scanLine {
              0% { top: 5%; }
              50% { top: 95%; }
              100% { top: 5%; }
            }
          `}</style>

          {/* LEFT PANEL: GATE CONTROLS */}
          <div className="col-12 col-lg-6 d-flex flex-column">
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 flex-grow-1 bg-white">
              <h5 className="fw-bold mb-3 border-bottom pb-2">📡 ĐỌC MÃ QR CODE VÉ</h5>
              <div id="reader-file" style={{ position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden' }} />

              {/* Web Camera Scanning overlay box */}
              {isCameraOpen ? (
                <div className="mb-4 bg-black rounded-4 overflow-hidden position-relative border border-secondary border-opacity-30 shadow-lg" style={{ minHeight: '300px' }}>
                  <div id="reader" className="w-100 h-100" style={{ backgroundColor: '#000' }} />

                  {/* Laser effect line */}
                  <div
                    className="position-absolute start-0 end-0 bg-danger opacity-75"
                    style={{
                      height: '3px',
                      boxShadow: '0 0 10px #dc3545',
                      animation: 'scanLine 3s infinite linear',
                      zIndex: 2,
                      top: '10%'
                    }}
                  />

                  <div className="position-absolute bottom-0 start-0 end-0 bg-black bg-opacity-75 p-3 text-center text-white small d-flex justify-content-between align-items-center" style={{ zIndex: 3 }}>
                    <span className="fw-semibold">🎥 Camera đang hoạt động...</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger rounded-pill px-3 fw-bold"
                      onClick={stopCamera}
                    >
                      Đóng Camera
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center mb-4">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-lg w-100 py-3 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm bg-white"
                    onClick={startCamera}
                  >
                    📷 MỞ CAMERA WEB QUÉT MÃ QR
                  </button>
                </div>
              )}

              <form onSubmit={handleVerifySubmit} className="mb-4">
                <div className="input-group input-group-lg shadow-sm rounded-3 overflow-hidden border">
                  <span className="input-group-text bg-light text-primary border-0 fs-4">⚡</span>
                  <input
                    ref={qrInputRef}
                    type="text"
                    className="form-control border-0 bg-light fs-6 text-dark"
                    placeholder="Quét QR, dán mã, hoặc dán trực tiếp file ảnh..."
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    onPaste={handlePaste}
                    disabled={verifyLoading || isCameraOpen}
                    autoComplete="off"
                  />
                  <input
                    type="file"
                    id="qr-file-input"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        await handleScanImageFile(file)
                      }
                      e.target.value = '' // reset
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-light px-3 border-0 bg-light text-secondary d-flex align-items-center justify-content-center"
                    onClick={() => document.getElementById('qr-file-input').click()}
                    title="Tải ảnh QR lên"
                    disabled={verifyLoading || isCameraOpen}
                  >
                    🖼️ Tải ảnh
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-bold d-flex align-items-center gap-2"
                    disabled={verifyLoading || !qrInput.trim() || isCameraOpen}
                  >
                    {verifyLoading ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    ) : (
                      'SOÁT VÉ'
                    )}
                  </button>
                </div>
                <div className="form-text text-muted mt-2 small">
                  💡 <strong>Mẹo:</strong> Nếu máy quét hỏng, bạn có thể <strong>chụp ảnh QR</strong> rồi nhấn <strong>Ctrl+V</strong> vào ô nhập liệu để quét tự động.
                </div>
              </form>

              {/* LIVE RESULTS RENDER CARD */}
              <div className="flex-grow-1 d-flex align-items-center justify-content-center" style={{ minHeight: '260px' }}>
                {!scanResult && !verifyLoading && (
                  <div className="text-center py-5 text-muted border border-dashed rounded-4 w-100 bg-light bg-opacity-50">
                    <span className="fs-1 d-block mb-3">📲</span>
                    <h6 className="fw-semibold mb-1">Đang chờ quét vé vào cổng...</h6>
                    <small className="text-secondary small">Vui lòng quét QR vé xem phim</small>
                  </div>
                )}

                {verifyLoading && (
                  <div className="text-center py-5 text-primary">
                    <div className="spinner-border text-primary mb-3" style={{ width: '3.5rem', height: '3.5rem' }} role="status" />
                    <h6 className="fw-bold mb-0">Đang giải mã và kiểm tra vé...</h6>
                  </div>
                )}

                {/* A. SUCCESS RESULTS */}
                {scanResult && scanResult.success && (
                  <div className="card border-0 bg-success bg-opacity-10 text-success-emphasis border border-success border-opacity-30 rounded-4 w-100 p-4 shadow-lg animate__animated animate__fadeIn">
                    <div className="d-flex align-items-center gap-3 mb-3 border-bottom border-success border-opacity-10 pb-3">
                      <span className="fs-1">✅</span>
                      <div>
                        <h4 className="fw-black mb-0 text-success">VÉ HỢP LỆ - QUA CỔNG</h4>
                        <small className="text-success-emphasis font-monospace">Mã vé soát: #{scanResult.data.ticket.id}</small>
                      </div>
                    </div>

                    <div className="row g-3 fs-6">
                      <div className="col-12 border-bottom border-success border-opacity-10 pb-2">
                        <small className="d-block text-secondary text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Phim điện ảnh:</small>
                        <strong className="text-dark fs-5">{scanResult.data.booking.movieTitle}</strong>
                      </div>
                      <div className="col-6">
                        <small className="d-block text-secondary text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Suất chiếu:</small>
                        <strong className="text-danger fw-bold fs-5">{formatTimeOnly(scanResult.data.booking.startTime)}</strong>
                      </div>
                      <div className="col-6">
                        <small className="d-block text-secondary text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Ghế ngồi:</small>
                        <span className="badge bg-success px-3 py-2 fs-6 fw-bold">GHẾ: {scanResult.data.ticket.seatName}</span>
                      </div>
                      <div className="col-6">
                        <small className="d-block text-secondary text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Khách hàng:</small>
                        <strong className="text-dark">{scanResult.data.booking.buyerName}</strong>
                      </div>
                      <div className="col-6">
                        <small className="d-block text-secondary text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Thời điểm quét:</small>
                        <strong className="text-dark small">{formatDateTime(scanResult.data.ticket.checkedInAt)}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* B. ERROR RESULTS */}
                {scanResult && !scanResult.success && (
                  <div className="card border-0 bg-danger bg-opacity-10 text-danger-emphasis border border-danger border-opacity-30 rounded-4 w-100 p-4 shadow-lg animate__animated animate__fadeIn">
                    <div className="text-center py-4">
                      <span className="fs-1 d-block mb-3">⚠️</span>
                      <h4 className="fw-black text-danger text-uppercase mb-2">VÉ KHÔNG HỢP LỆ</h4>
                      <p className="fs-5 text-dark mb-4 px-3">{scanResult.message}</p>

                      <button
                        type="button"
                        className="btn btn-outline-danger fw-bold rounded-pill px-4 btn-sm"
                        onClick={() => setScanResult(null)}
                      >
                        Tiếp tục soát vé khác
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* RIGHT PANEL: REAL STAFF ACTIVITY LOGS FROM DATABASE */}
          <div className="col-12 col-lg-6 d-flex flex-column">
            <div className="card border-0 shadow-sm rounded-4 p-4 flex-grow-1 bg-white d-flex flex-column" style={{ maxHeight: '680px' }}>
              <div className="d-flex flex-column mb-3 border-bottom pb-2">
                <h5 className="fw-bold mb-2">📜 HOẠT ĐỘNG CỦA TÔI </h5>
                <p className="text-secondary small mb-3">Trang hiển thị lịch sử đặt vé và soát vé do chính bạn thực hiện thực tế trên hệ thống</p>

                {/* Log type sub-tabs toggle */}
                <ul className="nav nav-pills nav-fill bg-light p-1 rounded-3 mb-3">
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link py-2 fw-bold text-uppercase ${logSubTab === 'SCANS' ? 'active bg-primary text-white' : 'text-secondary'}`}
                      style={{ fontSize: '0.78rem' }}
                      onClick={() => setLogSubTab('SCANS')}
                    >
                      🎟️ Đã Soát Cổng ({filteredTickets.length})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link py-2 fw-bold text-uppercase ${logSubTab === 'SALES' ? 'active bg-primary text-white' : 'text-secondary'}`}
                      style={{ fontSize: '0.78rem' }}
                      onClick={() => setLogSubTab('SALES')}
                    >
                      🏢 Đã Bán Tại Quầy ({filteredBookings.length})
                    </button>
                  </li>
                </ul>

                {/* History Filter inputs */}
                <div className="row g-2 mb-3 bg-light p-2 rounded-3 border align-items-center">
                  {/* Search filter */}
                  <div className="col-12 col-md-6">
                    <input
                      type="text"
                      className="form-control form-control-sm text-dark bg-white border"
                      placeholder="Tìm kiếm: Tên, SDT, Mã vé/đơn..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                    />
                  </div>
                  {/* Date filter */}
                  <div className="col-6 col-md-3">
                    <select
                      className="form-select form-select-sm text-dark bg-white border"
                      value={historyDateFilter}
                      onChange={(e) => setHistoryDateFilter(e.target.value)}
                    >
                      <option value="ALL">Tất cả ngày</option>
                      <option value="TODAY">Hôm nay</option>
                      <option value="YESTERDAY">Hôm qua</option>
                    </select>
                  </div>
                  {/* Movie filter */}
                  <div className="col-6 col-md-3">
                    <select
                      className="form-select form-select-sm text-dark bg-white border"
                      value={historyMovieFilter}
                      onChange={(e) => setHistoryMovieFilter(e.target.value)}
                    >
                      <option value="">Tất cả phim</option>
                      {uniqueHistoryMovies.map(m => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {loadingActivity ? (
                <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-primary py-5">
                  <div className="spinner-border spinner-border-sm text-primary mb-2" role="status" />
                  <span className="small text-secondary">Đang truy vấn lịch sử từ database...</span>
                </div>
              ) : logSubTab === 'SCANS' ? (
                /* Sub tab 1: SCANNED TICKETS LOGS */
                (filteredTickets.length === 0) ? (
                  <div className="flex-grow-1 d-flex align-items-center justify-content-center text-muted">
                    <p className="mb-0 italic small">Không tìm thấy bản ghi soát vé nào khớp bộ lọc.</p>
                  </div>
                ) : (
                  <div className="table-responsive flex-grow-1 overflow-auto pe-1">
                    <table className="table table-hover align-middle small text-dark">
                      <thead>
                        <tr className="table-light">
                          <th>Ghế</th>
                          <th>Phim</th>
                          <th>Khách hàng</th>
                          <th className="text-end">Thời gian quét</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTickets.map((ticket) => {
                          const movieTitle = ticket.booking?.showtime?.movie?.title || 'N/A';
                          const buyerName = ticket.booking?.user
                            ? `${ticket.booking.user.firstName || ''} ${ticket.booking.user.lastName || ''}`.trim() || ticket.booking.user.email
                            : ticket.booking?.customerName || 'Khách vãng lai';
                          return (
                            <tr key={ticket._id}>
                              <td>
                                <strong className="text-success badge bg-success bg-opacity-10 border border-success border-opacity-25 px-2">
                                  {ticket.seat?.name || 'N/A'}
                                </strong>
                              </td>
                              <td style={{ maxWidth: '140px' }} className="text-truncate" title={movieTitle}>
                                {movieTitle}
                              </td>
                              <td className="text-truncate" style={{ maxWidth: '110px' }} title={buyerName}>
                                {buyerName}
                              </td>
                              <td className="text-end text-muted font-monospace" style={{ fontSize: '0.74rem' }}>
                                {formatDateTime(ticket.checkedInAt)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                /* Sub tab 2: CREATED COUNTER BOOKINGS LOGS */
                (filteredBookings.length === 0) ? (
                  <div className="flex-grow-1 d-flex align-items-center justify-content-center text-muted">
                    <p className="mb-0 italic small">Không tìm thấy đơn bán vé tại quầy nào khớp bộ lọc.</p>
                  </div>
                ) : (
                  <div className="table-responsive flex-grow-1 overflow-auto pe-1">
                    <table className="table table-hover align-middle small text-dark">
                      <thead>
                        <tr className="table-light">
                          <th>Đơn vé</th>
                          <th>Phim & Ghế</th>
                          <th>Khách tại Quầy</th>
                          <th>Tổng tiền</th>
                          <th className="text-end">Thời gian lập</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map((booking) => {
                          const movieTitle = booking.showtime?.movie?.title || 'N/A';
                          const seatList = booking.tickets?.map(t => t.seat?.name).filter(Boolean).join(', ') || 'N/A';
                          const custName = booking.user
                            ? `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() || booking.user.email
                            : booking.customerName || 'Khách vãng lai';
                          return (
                            <tr key={booking._id}>
                              <td>
                                <strong className="text-secondary" style={{ fontSize: '0.72rem' }}>
                                  #{booking._id.slice(-6).toUpperCase()}
                                </strong>
                              </td>
                              <td style={{ maxWidth: '160px' }}>
                                <div className="text-truncate fw-bold" title={movieTitle}>{movieTitle}</div>
                                <div className="text-muted small text-truncate" style={{ fontSize: '0.7rem' }}>Ghế: {seatList}</div>
                              </td>
                              <td style={{ maxWidth: '120px' }}>
                                <div className="text-truncate" title={custName}>{custName}</div>
                                {booking.customerPhone && <div className="text-muted font-monospace" style={{ fontSize: '0.68rem' }}>{booking.customerPhone}</div>}
                              </td>
                              <td>
                                <strong className="text-danger fw-semibold">{formatPrice(booking.totalAmount)}</strong>
                              </td>
                              <td className="text-end text-muted font-monospace" style={{ fontSize: '0.74rem' }}>
                                {formatDateTime(booking.createdAt)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: BÁN VÉ TẠI QUẦY */}
      {activeTab === 'SELL' && (
        <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: 0 }}>

          {/* ---- FILTER BAR ---- */}
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
            <div className="row g-3 align-items-end">

              {/* Search box */}
              <div className="col-12 col-md-5">
                <label className="form-label small fw-semibold text-secondary mb-1">🔍 Tìm theo tên phim</label>
                <div className="input-group rounded-3 overflow-hidden border">
                  <span className="input-group-text bg-light border-0 text-secondary">🎬</span>
                  <input
                    type="text"
                    className="form-control border-0 bg-light"
                    placeholder="Nhập tên phim..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="btn btn-light border-0 text-secondary" onClick={() => setSearchQuery('')}>✕</button>
                  )}
                </div>
              </div>

              {/* Auditorium filter */}
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-secondary mb-1">🏛️ Phòng chiếu</label>
                <select
                  className="form-select border rounded-3 bg-light"
                  value={filterAuditorium}
                  onChange={(e) => setFilterAuditorium(e.target.value)}
                >
                  <option value="">Tất cả phòng</option>
                  {uniqueAuditoriums.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* Today-only toggle + refresh */}
              <div className="col-12 col-md-3 d-flex gap-2">
                <button
                  type="button"
                  className={`btn flex-grow-1 rounded-3 fw-semibold ${filterTodayOnly ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setFilterTodayOnly(v => !v)}
                >
                  {filterTodayOnly ? '📅 Hôm nay' : '📆 Tất cả ngày'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-3"
                  onClick={fetchShowtimeData}
                  title="Làm mới danh sách suất chiếu"
                >
                  🔄
                </button>
              </div>

            </div>

            {/* Active filter summary */}
            <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
              <small className="text-secondary">Đang xem:</small>
              {filterTodayOnly && <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3">📅 Hôm nay</span>}
              {filterAuditorium && <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill px-3">🏛️ {uniqueAuditoriums.find(a => a.id === filterAuditorium)?.name}</span>}
              {searchQuery && <span className="badge bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25 rounded-pill px-3">🔍 "{searchQuery}"</span>}
              <small className="text-muted ms-auto">{filteredShowtimesGrouped.length} phim • {filteredShowtimesGrouped.reduce((s, g) => s + g.items.length, 0)} suất chiếu</small>
            </div>
          </div>

          {/* ---- SHOWTIME CARDS GRID ---- */}
          {loadingShowtimes ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" style={{ width: '2.8rem', height: '2.8rem' }} role="status" />
              <p className="text-secondary small fw-semibold">Đang tải lịch chiếu...</p>
            </div>
          ) : filteredShowtimesGrouped.length === 0 ? (
            <div className="card border-0 shadow-sm rounded-4 bg-white text-center py-5 mx-auto" style={{ maxWidth: '500px', width: '100%' }}>
              <span className="fs-1 d-block mb-3">📅</span>
              <h5 className="fw-bold text-dark mb-1">Không tìm thấy suất chiếu</h5>
              <p className="text-secondary small px-4 mb-3">Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác.</p>
              <button
                className="btn btn-outline-primary rounded-pill px-4 mx-auto"
                style={{ width: 'fit-content' }}
                onClick={() => { setSearchQuery(''); setFilterAuditorium(''); setFilterTodayOnly(true) }}
              >Xóa bộ lọc</button>
            </div>
          ) : (
            <div className="overflow-auto flex-grow-1 pb-3">
              <div className="row g-3">
                {filteredShowtimesGrouped.map((group) => {
                  const mv = group.movie
                  const sortedItems = [...group.items].sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                  return (
                    <div key={mv._id || mv.id} className="col-12 col-xl-6">
                      <div
                        className="card border-0 rounded-4 h-100 overflow-hidden"
                        style={{
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                          boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
                          border: '1px solid rgba(0,0,0,0.06)'
                        }}
                      >
                        {/* Card header with poster + movie info */}
                        <div className="d-flex gap-0">

                          {/* Poster */}
                          <div className="flex-shrink-0" style={{ width: '100px' }}>
                            {mv.posterUrl ? (
                              <img
                                src={mv.posterUrl}
                                alt={mv.title}
                                style={{ width: '100px', height: '148px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                className="d-flex align-items-center justify-content-center text-muted bg-light"
                                style={{ width: '100px', height: '148px', fontSize: '2.5rem' }}
                              >🎬</div>
                            )}
                          </div>

                          {/* Movie info */}
                          <div className="flex-grow-1 p-3 d-flex flex-column justify-content-between min-w-0">
                            <div>
                              <h6
                                className="fw-black text-dark mb-2 lh-sm"
                                style={{ fontSize: '0.92rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                title={mv.title}
                              >
                                {mv.title}
                              </h6>
                              <div className="d-flex flex-wrap gap-1 mb-2">
                                {mv.ageRating && (
                                  <span className="badge rounded-pill bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25" style={{ fontSize: '0.68rem' }}>
                                    🔞 {mv.ageRating}
                                  </span>
                                )}
                                {mv.durationMinutes && (
                                  <span className="badge rounded-pill bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25" style={{ fontSize: '0.68rem' }}>
                                    ⌛ {mv.durationMinutes} phút
                                  </span>
                                )}
                                {mv.genres?.slice(0, 2).map((g, i) => (
                                  <span key={i} className="badge rounded-pill bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25" style={{ fontSize: '0.68rem' }}>
                                    {g?.name || g}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-secondary mb-2" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                🎟 Chọn suất chiếu ({sortedItems.length} suất)
                              </p>
                              <div className="d-flex flex-wrap gap-2">
                                {sortedItems.map(st => {
                                  const isPast = new Date(st.startTime) < new Date()
                                  const isNear = !isPast && (new Date(st.startTime) - new Date()) < 30 * 60 * 1000
                                  return (
                                    <button
                                      key={st._id || st.id}
                                      type="button"
                                      disabled={isPast}
                                      className="btn p-0 border-0"
                                      style={{ cursor: isPast ? 'not-allowed' : 'pointer' }}
                                      onClick={() => !isPast && setSelectedShowtimeId(st._id || st.id)}
                                      title={`${st.auditorium?.name} • ${formatPrice(st.baseTicketPrice)}`}
                                    >
                                      <div
                                        className="rounded-3 px-3 py-2 text-start"
                                        style={{
                                          minWidth: '90px',
                                          background: isPast
                                            ? 'rgba(0,0,0,0.04)'
                                            : isNear
                                              ? 'linear-gradient(135deg, #fff7ed, #ffedd5)'
                                              : 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                                          border: isPast
                                            ? '1px solid rgba(0,0,0,0.08)'
                                            : isNear
                                              ? '1.5px solid #f97316'
                                              : '1.5px solid #3b82f6',
                                          transition: 'transform 0.15s, box-shadow 0.15s',
                                        }}
                                        onMouseEnter={e => { if (!isPast) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)' } }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                                      >
                                        <strong
                                          className="d-block"
                                          style={{
                                            fontSize: '1rem',
                                            color: isPast ? '#9ca3af' : isNear ? '#ea580c' : '#1d4ed8',
                                            fontFamily: 'monospace',
                                          }}
                                        >
                                          {formatTimeOnly(st.startTime)}
                                        </strong>
                                        <span className="d-block" style={{ fontSize: '0.65rem', color: isPast ? '#9ca3af' : '#64748b' }}>
                                          {st.auditorium?.name || 'Phòng'}
                                        </span>
                                        <span className="d-block" style={{ fontSize: '0.65rem', fontWeight: 700, color: isPast ? '#9ca3af' : '#16a34a' }}>
                                          {formatPrice(st.baseTicketPrice)}
                                        </span>
                                        {isNear && !isPast && (
                                          <span className="badge bg-warning text-dark mt-1" style={{ fontSize: '0.58rem' }}>Sắp chiếu</span>
                                        )}
                                        {isPast && (
                                          <span className="badge bg-secondary mt-1" style={{ fontSize: '0.58rem' }}>Đã qua</span>
                                        )}
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* OVERLAY MODAL CONTAINING THE FULL INLINE COUNTER BOOKING FLOW (Reuses BookingPage!) */}
      {selectedShowtimeId && (
        <div
          className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(8px)',
            zIndex: 1055
          }}
        >
          <div className="bg-dark rounded-4 shadow-2xl w-100 mx-3" style={{ maxWidth: '1200px', height: '90vh', overflow: 'hidden' }}>

            {/* Modal Header bar */}
            <div className="bg-black text-light p-3 d-flex justify-content-between align-items-center border-bottom border-secondary border-opacity-30">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-success text-white py-1.5 px-3 rounded-pill fw-bold">QUẦY BÁN VÉ TRỰC TIẾP (CASH)</span>
                <span className="small text-white-50">Lựa chọn ghế và bắp nước tại chỗ cho khách</span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-light rounded-pill px-3 fw-bold"
                onClick={() => setSelectedShowtimeId(null)}
              >
                ✕ ĐÓNG QUẦY VÉ
              </button>
            </div>

            {/* Modal Body containing BookingPage */}
            <div className="w-100 overflow-auto" style={{ height: 'calc(90vh - 66px)' }}>
              <BookingPage
                showtimeId={selectedShowtimeId}
                onNavigate={(url) => {
                  setSelectedShowtimeId(null)
                  // Handle navigation inside counter flow: If it points to payment simulator, open it
                  if (url.startsWith('/booking/payment/')) {
                    window.location.hash = `#${url}`
                  } else {
                    window.location.hash = '#/staff/check-ticket'
                  }
                }}
              />
            </div>

          </div>
        </div>
      )}

    </section>
  )
}
