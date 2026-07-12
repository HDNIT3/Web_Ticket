import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import {
  getOverview,
  getRevenue,
  getTickets,
  getUsers,
  getTopMoviesFavorite,
  getTopMoviesTickets,
} from '../../services/statistics.api.js'
import { useAuth } from '../../components/context/auth.context.jsx'
import { bookingApi } from '../../services/booking.api.js'
import { exportToExcel } from '../../util/export.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler)

function fmt(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('vi-VN')
}
function fmtMoney(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
}
function fmtMoneyShort(n) {
  if (!n) return '0'
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function formatDateTime(val) {
  if (!val) return '—'
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return d.toLocaleString('vi-VN')
}

function defaultRange(period) {
  const today = new Date()
  const to = today.toISOString().slice(0, 10)
  if (period === 'year') return { from: new Date(today.getFullYear() - 4, 0, 1).toISOString().slice(0, 10), to }
  if (period === 'month') return { from: new Date(today.getFullYear(), today.getMonth() - 11, 1).toISOString().slice(0, 10), to }
  return { from: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29).toISOString().slice(0, 10), to }
}

const TOOLTIP_BASE = { backgroundColor: 'rgba(15,23,42,0.95)', cornerRadius: 10, padding: 10 }
const SCALE_X = { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } }
const SCALE_Y = { grid: { color: 'rgba(100,116,139,0.08)' }, ticks: { color: '#64748b', font: { size: 10 } }, beginAtZero: true }

function miniOpts(yCallback) {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { ...TOOLTIP_BASE, callbacks: yCallback ? { label: yCallback } : undefined } },
    scales: { x: SCALE_X, y: { ...SCALE_Y, ticks: { ...SCALE_Y.ticks, callback: yCallback ? (v) => fmtMoneyShort(v) : undefined } } },
  }
}

function miniOptsLegend() {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'top', labels: { color: '#64748b', font: { size: 11 } } }, tooltip: TOOLTIP_BASE },
    scales: { x: SCALE_X, y: SCALE_Y },
  }
}

function miniOptsHoriz() {
  return {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    plugins: { legend: { display: false }, tooltip: TOOLTIP_BASE },
    scales: {
      x: { grid: { color: 'rgba(100,116,139,0.08)' }, ticks: { color: '#64748b', font: { size: 10 } }, beginAtZero: true },
      y: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
    },
  }
}

function KpiCard({ icon, label, value, sub, color }) {
  return (
    <div className="st-kpi-card" style={{ '--c': color }}>
      <div className="st-kpi-icon">{icon}</div>
      <div className="st-kpi-body">
        <p className="st-kpi-label">{label}</p>
        <p className="st-kpi-value">{value}</p>
        {sub && <p className="st-kpi-sub">{sub}</p>}
      </div>
    </div>
  )
}

function PeriodFilter({ period, from, to, onPeriod, onFrom, onTo }) {
  return (
    <div className="st-filter-bar">
      <div className="st-pills">
        {[['day', 'Ngày'], ['month', 'Tháng'], ['year', 'Năm']].map(([p, label]) => (
          <button key={p} type="button" className={`st-pill ${period === p ? 'active' : ''}`} onClick={() => onPeriod(p)}>{label}</button>
        ))}
      </div>
      <div className="st-dates">
        <label>Từ</label>
        <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} className="st-date-input" />
        <label>Đến</label>
        <input type="date" value={to} onChange={(e) => onTo(e.target.value)} className="st-date-input" />
      </div>
    </div>
  )
}

function LimitPills({ value, onChange }) {
  return (
    <div className="st-pills">
      {[5, 10, 20].map((n) => (
        <button key={n} type="button" className={`st-pill ${value === n ? 'active' : ''}`} onClick={() => onChange(n)}>Top {n}</button>
      ))}
    </div>
  )
}

function Card({ title, icon, action, children }) {
  return (
    <div className="st-card">
      <div className="st-card-header">
        <span>{icon}</span><h3>{title}</h3>
        {action && <div className="st-card-action">{action}</div>}
      </div>
      <div className="st-card-body">{children}</div>
    </div>
  )
}

function Spinner() {
  return <div className="st-loading"><div className="st-spinner" /><p>Đang tải...</p></div>
}

function Empty({ msg = 'Không có dữ liệu.' }) {
  return <div className="st-empty"><span>📭</span><p>{msg}</p></div>
}

function MovieTable({ items, valueKey, valueLabel, valueFmt }) {
  return (
    <div className="st-table-wrap">
      <table className="st-table">
        <thead>
          <tr><th>#</th><th>Phim</th><th>Trạng thái</th><th>{valueLabel}</th><th>Đánh giá TB</th></tr>
        </thead>
        <tbody>
          {items.map((m, i) => (
            <tr key={i} className={i < 3 ? 'top-row' : ''}>
              <td className="rank-cell">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
              <td>
                <div className="movie-cell">
                  {m.posterUrl && <img src={m.posterUrl} alt={m.title} className="movie-thumb" />}
                  <span className="movie-title">{m.title}</span>
                </div>
              </td>
              <td><span className={`st-badge ${m.status === 'NOW_SHOWING' ? 'badge-green' : 'badge-amber'}`}>{m.status}</span></td>
              <td><strong className={valueKey === 'favoriteCount' ? 'val-rose' : 'val-amber'}>{valueFmt(m[valueKey])}</strong></td>
              <td>
                <div className="rating-cell">
                  <span className="stars">{'★'.repeat(Math.round(m.avgRating || 0))}{'☆'.repeat(5 - Math.round(m.avgRating || 0))}</span>
                  <span className="rating-num">{(m.avgRating || 0).toFixed(1)}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const TABS = [
  { id: 'overview', label: 'Tổng quan', icon: '🏠' },
  { id: 'users', label: 'Người dùng', icon: '👥' },
  { id: 'favorite', label: 'Top Yêu thích', icon: '❤️' },
  { id: 'top-tickets', label: 'Top Bán vé', icon: '🏆' },
]

export default function AdminStatistics() {
  const { user, isStaff } = useAuth()
  const [tab, setTab] = useState('overview')

  // --- Staff activities state ---
  const [staffData, setStaffData] = useState({ bookings: [], tickets: [] })
  const [staffLoading, setStaffLoading] = useState(false)

  // --- Staff filters state ---
  const [staffPeriod, setStaffPeriod] = useState('day')
  const [staffFrom, setStaffFrom] = useState(() => defaultRange('day').from)
  const [staffTo, setStaffTo] = useState(() => defaultRange('day').to)

  const handleStaffPeriod = (p) => {
    const r = defaultRange(p)
    setStaffPeriod(p)
    setStaffFrom(r.from)
    setStaffTo(r.to)
  }

  const filteredTickets = useMemo(() => {
    if (!staffData.tickets) return []
    return staffData.tickets.filter(t => {
      if (!t.checkedInAt) return false
      const d = t.checkedInAt.slice(0, 10)
      return d >= staffFrom && d <= staffTo
    })
  }, [staffData.tickets, staffFrom, staffTo])

  const filteredBookings = useMemo(() => {
    if (!staffData.bookings) return []
    return staffData.bookings.filter(b => {
      if (!b.createdAt) return false
      const d = b.createdAt.slice(0, 10)
      return d >= staffFrom && d <= staffTo
    })
  }, [staffData.bookings, staffFrom, staffTo])

  const staffChartData = useMemo(() => {
    const labels = []
    const ticketCounts = {}
    const bookingCounts = {}

    if (!staffFrom || !staffTo) {
      return { labels: [], datasets: [] }
    }

    const current = new Date(staffFrom)
    const end = new Date(staffTo)

    if (isNaN(current.getTime()) || isNaN(end.getTime())) {
      return { labels: [], datasets: [] }
    }

    let loops = 0
    const maxLoops = 1000

    if (staffPeriod === 'day') {
      while (current <= end && loops < maxLoops) {
        const label = current.toISOString().slice(0, 10)
        labels.push(label)
        ticketCounts[label] = 0
        bookingCounts[label] = 0
        current.setDate(current.getDate() + 1)
        loops++
      }
      filteredTickets.forEach(t => {
        if (!t.checkedInAt) return
        const day = t.checkedInAt.slice(0, 10)
        if (ticketCounts[day] !== undefined) {
          ticketCounts[day]++
        }
      })
      filteredBookings.forEach(b => {
        if (!b.createdAt) return
        const day = b.createdAt.slice(0, 10)
        if (bookingCounts[day] !== undefined) {
          bookingCounts[day]++
        }
      })
    } else if (staffPeriod === 'month') {
      while ((current.getFullYear() < end.getFullYear() || (current.getFullYear() === end.getFullYear() && current.getMonth() <= end.getMonth())) && loops < maxLoops) {
        const label = current.toISOString().slice(0, 7)
        labels.push(label)
        ticketCounts[label] = 0
        bookingCounts[label] = 0
        current.setMonth(current.getMonth() + 1)
        loops++
      }
      filteredTickets.forEach(t => {
        if (!t.checkedInAt) return
        const mon = t.checkedInAt.slice(0, 7)
        if (ticketCounts[mon] !== undefined) {
          ticketCounts[mon]++
        }
      })
      filteredBookings.forEach(b => {
        if (!b.createdAt) return
        const mon = b.createdAt.slice(0, 7)
        if (bookingCounts[mon] !== undefined) {
          bookingCounts[mon]++
        }
      })
    } else if (staffPeriod === 'year') {
      let startYear = current.getFullYear()
      const endYear = end.getFullYear()
      while (startYear <= endYear && loops < maxLoops) {
        const label = String(startYear)
        labels.push(label)
        ticketCounts[label] = 0
        bookingCounts[label] = 0
        startYear++
        loops++
      }
      filteredTickets.forEach(t => {
        if (!t.checkedInAt) return
        const yr = t.checkedInAt.slice(0, 4)
        if (ticketCounts[yr] !== undefined) {
          ticketCounts[yr]++
        }
      })
      filteredBookings.forEach(b => {
        if (!b.createdAt) return
        const yr = b.createdAt.slice(0, 4)
        if (bookingCounts[yr] !== undefined) {
          bookingCounts[yr]++
        }
      })
    }

    const displayLabels = labels.map(l => {
      if (staffPeriod === 'day') {
        const parts = l.split('-')
        return parts.length === 3 ? `${parts[2]}/${parts[1]}` : l
      }
      if (staffPeriod === 'month') {
        const parts = l.split('-')
        return parts.length === 2 ? `Thg ${parts[1]}/${parts[0].slice(-2)}` : l
      }
      return l
    })

    return {
      labels: displayLabels,
      datasets: [
        {
          label: 'Vé đã soát',
          data: labels.map(l => ticketCounts[l] || 0),
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1.5,
          borderRadius: 4,
        },
        {
          label: 'Đơn bán tại quầy',
          data: labels.map(l => bookingCounts[l] || 0),
          backgroundColor: 'rgba(59, 130, 246, 0.75)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1.5,
          borderRadius: 4,
        }
      ]
    }
  }, [filteredTickets, filteredBookings, staffPeriod, staffFrom, staffTo])

  // --- Overview state ---
  const [overview, setOverview] = useState(null)
  const [ovLoading, setOvLoading] = useState(true)
  // Mini charts on overview tab
  const [ovRevenue, setOvRevenue] = useState(null)
  const [ovTickets, setOvTickets] = useState(null)
  const [ovUsers, setOvUsers] = useState(null)
  const [ovFav, setOvFav] = useState(null)
  const [ovTopTik, setOvTopTik] = useState(null)
  const [ovChartsLoading, setOvChartsLoading] = useState(true)

  // --- Users tab state ---
  const [usrPeriod, setUsrPeriod] = useState('month')
  const [usrFrom, setUsrFrom] = useState(() => defaultRange('month').from)
  const [usrTo, setUsrTo] = useState(() => defaultRange('month').to)
  const [usrData, setUsrData] = useState(null)
  const [usrLoading, setUsrLoading] = useState(false)

  // --- Top Favorite state ---
  const [favLimit, setFavLimit] = useState(10)
  const [favData, setFavData] = useState(null)
  const [favLoading, setFavLoading] = useState(false)

  // --- Top Tickets state ---
  const [tikLimit, setTikLimit] = useState(10)
  const [tikData, setTikData] = useState(null)
  const [tikLoading, setTikLoading] = useState(false)

  // Load overview + all mini-chart data in parallel (Only for Admin)
  useEffect(() => {
    if (isStaff) return

    setOvLoading(true)
    setOvChartsLoading(true)
    const range6m = defaultRange('month')

    const settled = (r) => (r.status === 'fulfilled' ? r.value : null)

    Promise.allSettled([
      getOverview(),
      getRevenue({ period: 'month', ...range6m }),
      getTickets({ period: 'month', ...range6m }),
      getUsers({ period: 'month', ...range6m }),
      getTopMoviesFavorite({ limit: 5 }),
      getTopMoviesTickets({ limit: 5 }),
    ]).then(([ov, rev, tik, usr, fav, topTik]) => {
      setOverview(settled(ov))
      setOvRevenue(settled(rev))
      setOvTickets(settled(tik))
      setOvUsers(settled(usr))
      setOvFav(settled(fav))
      setOvTopTik(settled(topTik))
    }).finally(() => {
      setOvLoading(false)
      setOvChartsLoading(false)
    })
  }, [isStaff])

  // Load staff activity details on mount (Only for Staff)
  useEffect(() => {
    if (!isStaff) return

    setStaffLoading(true)
    bookingApi.getStaffActivity()
      .then(res => {
        setStaffData({
          bookings: res?.bookings || [],
          tickets: res?.tickets || [],
        })
      })
      .catch(err => console.error(err))
      .finally(() => setStaffLoading(false))
  }, [isStaff])

  const fetchUsers = useCallback(() => {
    setUsrLoading(true)
    getUsers({ period: usrPeriod, from: usrFrom, to: usrTo })
      .then(setUsrData).catch(() => setUsrData(null)).finally(() => setUsrLoading(false))
  }, [usrPeriod, usrFrom, usrTo])

  useEffect(() => { if (tab === 'users') fetchUsers() }, [tab, fetchUsers])

  const handleUsrPeriod = (p) => { const r = defaultRange(p); setUsrPeriod(p); setUsrFrom(r.from); setUsrTo(r.to) }

  useEffect(() => {
    if (tab !== 'favorite') return
    setFavLoading(true)
    getTopMoviesFavorite({ limit: favLimit }).then(setFavData).catch(() => setFavData(null)).finally(() => setFavLoading(false))
  }, [tab, favLimit])

  useEffect(() => {
    if (tab !== 'top-tickets') return
    setTikLoading(true)
    getTopMoviesTickets({ limit: tikLimit }).then(setTikData).catch(() => setTikData(null)).finally(() => setTikLoading(false))
  }, [tab, tikLimit])

  // ── Render: Overview Tab ─────────────────────────────────────────────────
  const renderOverview = () => {
    const revItems = ovRevenue?.items || []
    const tikItems = ovTickets?.items || []

    const regItems = ovUsers?.registerItems || []
    const logItems = ovUsers?.loginItems || []
    const allUsrLabels = Array.from(new Set([...regItems.map((r) => r.label), ...logItems.map((r) => r.label)])).sort()
    const regMap = Object.fromEntries(regItems.map((r) => [r.label, r.newUsers]))
    const logMap = Object.fromEntries(logItems.map((r) => [r.label, r.loginCount]))

    const favItems = Array.isArray(ovFav) ? ovFav : []
    const topTikItems = Array.isArray(ovTopTik) ? ovTopTik : []

    const getRankColor = (i, alpha) => {
      const palettes = [['rgba(245,158,11,0.2)', 'rgba(245,158,11,1)'], ['rgba(100,116,139,0.2)', 'rgba(100,116,139,1)'], ['rgba(180,83,9,0.15)', 'rgba(180,83,9,1)']]
      if (i < 3) return alpha ? palettes[i][0] : palettes[i][1]
      return alpha ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,1)'
    }

    return (
      <>
        {/* KPI Cards */}
        {ovLoading ? <Spinner /> : (
          <div className="st-kpi-grid">
            <KpiCard icon="💰" label="Tổng doanh thu" value={fmtMoney(overview?.totalRevenue)} sub={`${fmt(overview?.totalBookings)} đơn PAID`} color="#6366f1" />
            <KpiCard icon="🎟️" label="Vé đã bán" value={fmt(overview?.totalTicketsSold)} sub="PAID & CHECKED_IN" color="#10b981" />
            <KpiCard icon="👥" label="Người dùng hoạt động" value={fmt(overview?.totalActiveUsers)} sub="Tài khoản ACTIVE" color="#f59e0b" />
            <KpiCard icon="🛒" label="Đơn đặt vé" value={fmt(overview?.totalBookings)} sub="Tổng đơn PAID" color="#f43f5e" />
          </div>
        )}

        {ovChartsLoading ? <Spinner /> : (
          <>
            {/* Row 1: Revenue + Tickets */}
            <div className="st-chart-row">
              <Card title="Doanh thu 12 tháng gần nhất" icon="💰">
                {revItems.length === 0 ? <Empty /> : (
                  <div style={{ height: 220 }}>
                    <Line
                      data={{
                        labels: revItems.map((r) => r.label),
                        datasets: [{
                          label: 'Doanh thu',
                          data: revItems.map((r) => r.totalRevenue),
                          backgroundColor: 'rgba(99,102,241,0.12)',
                          borderColor: 'rgba(99,102,241,1)',
                          borderWidth: 2, fill: true, tension: 0.4,
                          pointBackgroundColor: 'rgba(99,102,241,1)', pointRadius: 3,
                        }],
                      }}
                      options={miniOpts((ctx) => `  ${fmtMoney(ctx.raw)}`)}
                    />
                  </div>
                )}
              </Card>

              <Card title="Vé đã bán 12 tháng gần nhất" icon="🎟️">
                {tikItems.length === 0 ? <Empty /> : (
                  <div style={{ height: 220 }}>
                    <Bar
                      data={{
                        labels: tikItems.map((r) => r.label),
                        datasets: [{
                          label: 'Số vé',
                          data: tikItems.map((r) => r.ticketCount),
                          backgroundColor: 'rgba(16,185,129,0.18)',
                          borderColor: 'rgba(16,185,129,1)',
                          borderWidth: 2, borderRadius: 5,
                        }],
                      }}
                      options={miniOpts()}
                    />
                  </div>
                )}
              </Card>
            </div>

            {/* Row 2: Users */}
            <Card title="Người dùng đăng ký & đăng nhập 12 tháng" icon="👥">
              {allUsrLabels.length === 0 ? <Empty /> : (
                <div style={{ height: 220 }}>
                  <Line
                    data={{
                      labels: allUsrLabels,
                      datasets: [
                        {
                          label: 'Đăng ký mới',
                          data: allUsrLabels.map((l) => regMap[l] || 0),
                          backgroundColor: 'rgba(14,165,233,0.12)',
                          borderColor: 'rgba(14,165,233,1)',
                          borderWidth: 2, fill: true, tension: 0.4,
                          pointBackgroundColor: 'rgba(14,165,233,1)', pointRadius: 3,
                        },
                        {
                          label: 'Đăng nhập',
                          data: allUsrLabels.map((l) => logMap[l] || 0),
                          backgroundColor: 'rgba(139,92,246,0.12)',
                          borderColor: 'rgba(139,92,246,1)',
                          borderWidth: 2, fill: true, tension: 0.4,
                          pointBackgroundColor: 'rgba(139,92,246,1)', pointRadius: 3,
                        },
                      ],
                    }}
                    options={miniOptsLegend()}
                  />
                </div>
              )}
            </Card>

            {/* Row 3: Top Favorite + Top Tickets */}
            <div className="st-chart-row">
              <Card title="Top 5 phim yêu thích" icon="❤️">
                {favItems.length === 0 ? <Empty msg="Chưa có dữ liệu." /> : (
                  <div style={{ height: 220 }}>
                    <Bar
                      data={{
                        labels: favItems.map((m) => m.title?.length > 18 ? m.title.slice(0, 18) + '…' : m.title),
                        datasets: [{
                          label: 'Lượt yêu thích',
                          data: favItems.map((m) => m.favoriteCount),
                          backgroundColor: favItems.map((_, i) => getRankColor(i, true)),
                          borderColor: favItems.map((_, i) => getRankColor(i, false)),
                          borderWidth: 2, borderRadius: 5,
                        }],
                      }}
                      options={miniOpts()}
                    />
                  </div>
                )}
              </Card>

              <Card title="Top 5 phim bán vé cao nhất" icon="🏆">
                {topTikItems.length === 0 ? <Empty msg="Chưa có dữ liệu." /> : (
                  <div style={{ height: 220 }}>
                    <Bar
                      data={{
                        labels: topTikItems.map((m) => m.title?.length > 18 ? m.title.slice(0, 18) + '…' : m.title),
                        datasets: [{
                          label: 'Số vé bán',
                          data: topTikItems.map((m) => m.ticketCount),
                          backgroundColor: topTikItems.map((_, i) => getRankColor(i, true)),
                          borderColor: topTikItems.map((_, i) => getRankColor(i, false)),
                          borderWidth: 2, borderRadius: 5,
                        }],
                      }}
                      options={miniOptsHoriz()}
                    />
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </>
    )
  }

  // ── Render: Users Tab ────────────────────────────────────────────────────
  const renderUsers = () => {
    const regItems = usrData?.registerItems || []
    const logItems = usrData?.loginItems || []
    const allLabels = Array.from(new Set([...regItems.map((r) => r.label), ...logItems.map((r) => r.label)])).sort()
    const regMap = Object.fromEntries(regItems.map((r) => [r.label, r.newUsers]))
    const logMap = Object.fromEntries(logItems.map((r) => [r.label, r.loginCount]))
    const merged = allLabels.map((label) => ({ label, newUsers: regMap[label] || 0, loginCount: logMap[label] || 0 }))

    const chartData = {
      labels: allLabels,
      datasets: [
        {
          label: 'Đăng ký mới',
          data: allLabels.map((l) => regMap[l] || 0),
          backgroundColor: 'rgba(14,165,233,0.15)',
          borderColor: 'rgba(14,165,233,1)',
          borderWidth: 2, fill: true, tension: 0.4,
          pointBackgroundColor: 'rgba(14,165,233,1)', pointRadius: 4,
        },
        {
          label: 'Đăng nhập',
          data: allLabels.map((l) => logMap[l] || 0),
          backgroundColor: 'rgba(139,92,246,0.15)',
          borderColor: 'rgba(139,92,246,1)',
          borderWidth: 2, fill: true, tension: 0.4,
          pointBackgroundColor: 'rgba(139,92,246,1)', pointRadius: 4,
        },
      ],
    }

    const handleExportUsersExcel = () => {
      const headers = ['STT', 'Kỳ', 'Đăng ký mới', 'Đăng nhập']
      const rows = merged.map((r, i) => [
        i + 1,
        r.label,
        r.newUsers,
        r.loginCount
      ])
      rows.push(['Tổng', '', usrData?.totalNewUsers || 0, usrData?.totalLogins || 0])
      exportToExcel(`Bao_cao_nguoi_dung_${usrPeriod}_${usrFrom}_to_${usrTo}`, headers, rows)
    }

    return (
      <>
        <div className="st-kpi-grid">
          <KpiCard icon="🆕" label="Đăng ký mới" value={fmt(usrData?.totalNewUsers)} color="#0ea5e9" />
          <KpiCard icon="🔐" label="Lượt đăng nhập" value={fmt(usrData?.totalLogins)} color="#8b5cf6" />
        </div>
        <PeriodFilter period={usrPeriod} from={usrFrom} to={usrTo} onPeriod={handleUsrPeriod} onFrom={setUsrFrom} onTo={setUsrTo} />
        <Card title="Biểu đồ người dùng" icon="📈">
          {usrLoading ? <Spinner /> : allLabels.length === 0 ? <Empty /> : (
            <div style={{ height: 300 }}>
              <Line data={chartData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'top', labels: { color: '#64748b', font: { size: 12 } } }, tooltip: TOOLTIP_BASE },
                scales: { x: SCALE_X, y: SCALE_Y },
              }} />
            </div>
          )}
        </Card>
        <Card 
          title="Bảng chi tiết" 
          icon="📋"
          action={
            merged.length > 0 && !usrLoading && (
              <button 
                type="button" 
                className="btn btn-sm btn-success d-flex align-items-center gap-1"
                onClick={handleExportUsersExcel}
              >
                📊 Xuất Excel
              </button>
            )
          }
        >
          {usrLoading ? <Spinner /> : merged.length === 0 ? <Empty /> : (
            <div className="st-table-wrap">
              <table className="st-table">
                <thead><tr><th>#</th><th>Kỳ</th><th>Đăng ký mới</th><th>Đăng nhập</th></tr></thead>
                <tbody>
                  {merged.map((r, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td><span className="st-badge badge-sky">{r.label}</span></td>
                      <td>{fmt(r.newUsers)}</td>
                      <td>{fmt(r.loginCount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}><strong>Tổng</strong></td>
                    <td><strong>{fmt(usrData?.totalNewUsers)}</strong></td>
                    <td><strong>{fmt(usrData?.totalLogins)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      </>
    )
  }

  // ── Render: Top Favorite Tab ─────────────────────────────────────────────
  const renderFavorite = () => {
    const items = Array.isArray(favData) ? favData : []
    const getRankColor = (i, alpha) => {
      const p = [['rgba(245,158,11,0.2)', 'rgba(245,158,11,1)'], ['rgba(100,116,139,0.2)', 'rgba(100,116,139,1)'], ['rgba(180,83,9,0.15)', 'rgba(180,83,9,1)']]
      return (i < 3 ? p[i] : ['rgba(99,102,241,0.15)', 'rgba(99,102,241,1)'])[alpha ? 0 : 1]
    }
    const handleExportFavoriteExcel = () => {
      const headers = ['Hạng', 'Tên phim', 'Trạng thái', 'Lượt yêu thích', 'Điểm đánh giá TB', 'Số lượt đánh giá']
      const rows = items.map((m, i) => [
        i + 1,
        m.title,
        m.status === 'NOW_SHOWING' ? 'Đang chiếu' : m.status === 'COMING_SOON' ? 'Sắp chiếu' : 'Ngừng chiếu',
        m.favoriteCount,
        m.avgRating || 0,
        m.reviewCount || 0
      ])
      exportToExcel(`Top_${favLimit}_phim_yeu_thich`, headers, rows)
    }
    return (
      <>
        <Card title={`Top ${favLimit} phim được yêu thích nhất`} icon="❤️" action={<LimitPills value={favLimit} onChange={setFavLimit} />}>
          {favLoading ? <Spinner /> : items.length === 0 ? <Empty msg="Chưa có dữ liệu." /> : (
            <div style={{ height: 320 }}>
              <Bar
                data={{
                  labels: items.map((m) => m.title?.length > 22 ? m.title.slice(0, 22) + '…' : m.title),
                  datasets: [{ label: 'Yêu thích', data: items.map((m) => m.favoriteCount), backgroundColor: items.map((_, i) => getRankColor(i, true)), borderColor: items.map((_, i) => getRankColor(i, false)), borderWidth: 2, borderRadius: 6 }],
                }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: TOOLTIP_BASE }, scales: { x: SCALE_X, y: SCALE_Y } }}
              />
            </div>
          )}
        </Card>
        <Card 
          title="Bảng xếp hạng" 
          icon="📋"
          action={
            items.length > 0 && !favLoading && (
              <button 
                type="button" 
                className="btn btn-sm btn-success d-flex align-items-center gap-1"
                onClick={handleExportFavoriteExcel}
              >
                📊 Xuất Excel
              </button>
            )
          }
        >
          {favLoading ? <Spinner /> : items.length === 0 ? <Empty msg="Chưa có dữ liệu." /> : (
            <MovieTable items={items} valueKey="favoriteCount" valueLabel="Yêu thích" valueFmt={(v) => `♥ ${fmt(v)}`} />
          )}
        </Card>
      </>
    )
  }

  // ── Render: Top Tickets Tab ──────────────────────────────────────────────
  const renderTopTickets = () => {
    const items = Array.isArray(tikData) ? tikData : []
    const getRankColor = (i, alpha) => {
      const p = [['rgba(245,158,11,0.2)', 'rgba(245,158,11,1)'], ['rgba(100,116,139,0.2)', 'rgba(100,116,139,1)'], ['rgba(180,83,9,0.15)', 'rgba(180,83,9,1)']]
      return (i < 3 ? p[i] : ['rgba(99,102,241,0.15)', 'rgba(99,102,241,1)'])[alpha ? 0 : 1]
    }
    const handleExportTopTicketsExcel = () => {
      const headers = ['Hạng', 'Tên phim', 'Trạng thái', 'Số vé bán', 'Doanh thu', 'Điểm đánh giá TB']
      const rows = items.map((m, i) => [
        i + 1,
        m.title,
        m.status === 'NOW_SHOWING' ? 'Đang chiếu' : m.status === 'COMING_SOON' ? 'Sắp chiếu' : 'Ngừng chiếu',
        m.ticketCount,
        m.totalRevenue || 0,
        m.avgRating || 0
      ])
      exportToExcel(`Top_${tikLimit}_phim_ban_ve`, headers, rows)
    }
    return (
      <>
        <Card title={`Top ${tikLimit} phim bán vé nhiều nhất`} icon="🏆" action={<LimitPills value={tikLimit} onChange={setTikLimit} />}>
          {tikLoading ? <Spinner /> : items.length === 0 ? <Empty msg="Chưa có dữ liệu." /> : (
            <div style={{ height: 320 }}>
              <Bar
                data={{
                  labels: items.map((m) => m.title?.length > 22 ? m.title.slice(0, 22) + '…' : m.title),
                  datasets: [{ label: 'Số vé', data: items.map((m) => m.ticketCount), backgroundColor: items.map((_, i) => getRankColor(i, true)), borderColor: items.map((_, i) => getRankColor(i, false)), borderWidth: 2, borderRadius: 6 }],
                }}
                options={miniOptsHoriz()}
              />
            </div>
          )}
        </Card>
        <Card 
          title="Bảng xếp hạng" 
          icon="📋"
          action={
            items.length > 0 && !tikLoading && (
              <button 
                type="button" 
                className="btn btn-sm btn-success d-flex align-items-center gap-1"
                onClick={handleExportTopTicketsExcel}
              >
                📊 Xuất Excel
              </button>
            )
          }
        >
          {tikLoading ? <Spinner /> : items.length === 0 ? <Empty msg="Chưa có dữ liệu." /> : (
            <div className="st-table-wrap">
              <table className="st-table">
                <thead><tr><th>#</th><th>Phim</th><th>Trạng thái</th><th>Vé bán</th><th>Doanh thu</th><th>Đánh giá TB</th></tr></thead>
                <tbody>
                  {items.map((m, i) => (
                    <tr key={i} className={i < 3 ? 'top-row' : ''}>
                      <td className="rank-cell">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                      <td><div className="movie-cell">{m.posterUrl && <img src={m.posterUrl} alt={m.title} className="movie-thumb" />}<span className="movie-title">{m.title}</span></div></td>
                      <td><span className={`st-badge ${m.status === 'NOW_SHOWING' ? 'badge-green' : 'badge-amber'}`}>{m.status}</span></td>
                      <td><strong className="val-amber">🎟️ {fmt(m.ticketCount)}</strong></td>
                      <td className="val-money">{fmtMoney(m.totalRevenue)}</td>
                      <td><div className="rating-cell"><span className="stars">{'★'.repeat(Math.round(m.avgRating || 0))}{'☆'.repeat(5 - Math.round(m.avgRating || 0))}</span><span className="rating-num">{(m.avgRating || 0).toFixed(1)}</span></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </>
    )
  }

  if (isStaff) {
    const [staffTab, setStaffTab] = useState('scans')
    const staffChartOpts = {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', align: 'end', labels: { color: '#64748b', font: { size: 11, weight: '600' }, padding: 16, usePointStyle: true, pointStyleWidth: 12 } },
        tooltip: { backgroundColor: '#0f172a', cornerRadius: 8, padding: 10, titleFont: { size: 12, weight: '700' }, bodyFont: { size: 11 }, boxPadding: 4 },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
        y: { grid: { color: '#f1f5f9', drawBorder: false }, ticks: { color: '#94a3b8', font: { size: 10 }, stepSize: 1 }, beginAtZero: true, border: { display: false } },
      },
    }
    const staffLineData = {
      labels: staffChartData.labels,
      datasets: [
        { ...staffChartData.datasets[0], type: 'line', backgroundColor: 'rgba(16,185,129,0.08)', borderColor: '#10b981', borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#10b981', pointBorderWidth: 0 },
        { ...staffChartData.datasets[1], backgroundColor: 'rgba(99,102,241,0.65)', borderColor: '#6366f1', borderWidth: 0, borderRadius: 6 },
      ]
    }
    const totalAllTickets = staffData.tickets?.length || 0
    const totalAllBookings = staffData.bookings?.length || 0
    const todayStr = new Date().toISOString().slice(0, 10)
    const todayTickets = staffData.tickets?.filter(t => t.checkedInAt?.slice(0, 10) === todayStr).length || 0
    const todayBookings = staffData.bookings?.filter(b => b.createdAt?.slice(0, 10) === todayStr).length || 0

    const handleExportStaffScansExcel = () => {
      const headers = ['STT', 'Ghế', 'Phim', 'Khách hàng', 'Thời gian soát']
      const rows = filteredTickets.map((t, idx) => {
        const movieTitle = t.booking?.showtime?.movie?.title || 'N/A';
        const buyerName = t.booking?.user 
          ? `${t.booking.user.firstName || ''} ${t.booking.user.lastName || ''}`.trim() || t.booking.user.email
          : t.booking?.customerName || 'Khách vãng lai';
        return [
          idx + 1,
          t.seat?.name || 'N/A',
          movieTitle,
          buyerName,
          formatDateTime(t.checkedInAt)
        ]
      })
      exportToExcel(`Hoat_dong_soat_ve_${staffPeriod}_${staffFrom}_to_${staffTo}`, headers, rows)
    }

    const handleExportStaffSalesExcel = () => {
      const headers = ['STT', 'Mã đơn', 'Phim & Ghế', 'Khách hàng', 'Thời gian bán']
      const rows = filteredBookings.map((b, idx) => {
        const movieTitle = b.showtime?.movie?.title || 'N/A';
        const seatList = b.tickets?.map(t => t.seat?.name).filter(Boolean).join(', ') || 'N/A';
        const custName = b.user
          ? `${b.user.firstName || ''} ${b.user.lastName || ''}`.trim() || b.user.email
          : b.customerName || 'Khách vãng lai';
        return [
          idx + 1,
          b._id ? `#${b._id.slice(-6).toUpperCase()}` : 'N/A',
          `${movieTitle} (Ghế: ${seatList})`,
          custName,
          formatDateTime(b.createdAt)
        ]
      })
      exportToExcel(`Hoat_dong_ban_ve_${staffPeriod}_${staffFrom}_to_${staffTo}`, headers, rows)
    }

    return (
      <div className="sd">
        <style>{`
          .sd { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; }
          .sd-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
          .sd-header-left p.sd-date { margin: 0 0 4px; font-size: 13px; color: #64748b; font-weight: 500; }
          .sd-header-left h2 { margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
          .sd-header-left h2 span { color: #6366f1; }
          
          .sd .st-filter-bar { background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); border-radius: 12px; display: inline-flex; align-items: center; gap: 14px; flex-wrap: wrap; padding: 10px 16px; margin-bottom: 16px; }
          .sd .st-pills { display: flex; gap: 6px; }
          .sd .st-pill { padding: 6px 14px; border: 1.5px solid #e2e8f0; border-radius: 8px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
          .sd .st-pill:hover { border-color: #6366f1; color: #6366f1; }
          .sd .st-pill.active { background: #6366f1; border-color: #6366f1; color: #fff; box-shadow: 0 2px 8px rgba(99,102,241,0.25); }
          .sd .st-dates { display: flex; align-items: center; gap: 8px; }
          .sd .st-dates label { font-size: 12px; font-weight: 600; color: #64748b; }
          .sd .st-date-input { padding: 5px 10px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 12px; color: #374151; background: #f8fafc; outline: none; transition: border-color 0.2s; }
          .sd .st-date-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
          
          .sd-kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
          @media (max-width: 900px) { .sd-kpi-row { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 500px) { .sd-kpi-row { grid-template-columns: 1fr; } }
          
          .sd-kpi { background: #fff; border-radius: 16px; padding: 18px 20px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); display: flex; align-items: center; gap: 16px; transition: box-shadow 0.2s, transform 0.2s; }
          .sd-kpi:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.05); transform: translateY(-2px); }
          .sd-kpi-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
          .sd-kpi-icon.green { background: #ecfdf5; color: #059669; }
          .sd-kpi-icon.blue { background: #eff6ff; color: #2563eb; }
          .sd-kpi-icon.amber { background: #fffbeb; color: #d97706; }
          .sd-kpi-icon.purple { background: #f5f3ff; color: #7c3aed; }
          
          .sd-kpi-info { flex: 1; min-width: 0; }
          .sd-kpi-label { margin: 0 0 4px; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .sd-kpi-val { margin: 0; font-size: 24px; font-weight: 800; line-height: 1.1; }
          .sd-kpi-val.green { color: #059669; }
          .sd-kpi-val.blue { color: #2563eb; }
          .sd-kpi-val.amber { color: #d97706; }
          .sd-kpi-val.purple { color: #7c3aed; }
          .sd-kpi-sub { margin: 4px 0 0; font-size: 11px; color: #94a3b8; font-weight: 500; }
          
          .sd-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); overflow: hidden; margin-bottom: 24px; }
          .sd-card-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; border-bottom: 1px solid #f1f5f9; }
          .sd-card-head h3 { margin: 0; font-size: 15px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px; }
          .sd-card-head h3 .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
          .sd-card-body { padding: 20px 24px; }
          
          .sd-tabs { display: flex; gap: 8px; border-bottom: 2px solid #f1f5f9; margin-bottom: 0; width: 100%; }
          .sd-tab-btn { padding: 12px 24px; font-size: 14px; font-weight: 700; color: #64748b; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
          .sd-tab-btn:hover { color: #0f172a; }
          .sd-tab-btn.active { color: #6366f1; border-bottom-color: #6366f1; }
          .sd-tab-btn .sd-tab-count { font-size: 11px; background: #f1f5f9; color: #64748b; padding: 2px 8px; border-radius: 10px; font-weight: 700; margin-left: 4px; }
          .sd-tab-btn.active .sd-tab-count { background: #ede9fe; color: #6366f1; }
          
          .sd-table-wrap { overflow-x: auto; border: 1px solid #f1f5f9; border-radius: 12px; }
          .sd-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
          .sd-table th { padding: 12px 18px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
          .sd-table td { padding: 14px 18px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
          .sd-table tbody tr { transition: background 0.15s; }
          .sd-table tbody tr:hover { background: #f8fafc; }
          .sd-table tbody tr:last-child td { border-bottom: none; }
          
          .sd-seat { display: inline-flex; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; background: #ecfdf5; color: #059669; border: 1px solid #d1fae5; }
          .sd-order { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 11.5px; color: #6366f1; background: #f5f3ff; padding: 3px 8px; border-radius: 6px; font-weight: 700; border: 1px solid #e0e7ff; }
          .sd-loading { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 20px; color: #64748b; }
          .sd-spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: sd-spin 0.8s linear infinite; }
          @keyframes sd-spin { to { transform: rotate(360deg); } }
          .sd-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px 20px; color: #94a3b8; }
          .sd-empty span { font-size: 36px; opacity: 0.7; }
          .sd-empty p { margin: 0; font-size: 13.5px; font-weight: 500; }
        `}</style>

        <div className="sd-header">
          <div className="sd-header-left">
            <p className="sd-date">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <h2>Xin chào, <span>{user?.firstName || ''} {user?.lastName || ''}</span></h2>
          </div>
        </div>

        {staffLoading ? (
          <div className="sd-loading">
            <div className="sd-spinner" />
            <p>Đang tải thông tin hoạt động...</p>
          </div>
        ) : (
          <>
            <div className="sd-kpi-row">
              <div className="sd-kpi">
                <div className="sd-kpi-icon green">🎟️</div>
                <div className="sd-kpi-info">
                  <p className="sd-kpi-label">Vé đã soát</p>
                  <p className="sd-kpi-val green">{filteredTickets.length}</p>
                  <p className="sd-kpi-sub">Tổng: {totalAllTickets}</p>
                </div>
              </div>
              <div className="sd-kpi">
                <div className="sd-kpi-icon blue">🏢</div>
                <div className="sd-kpi-info">
                  <p className="sd-kpi-label">Đơn tại quầy</p>
                  <p className="sd-kpi-val blue">{filteredBookings.length}</p>
                  <p className="sd-kpi-sub">Tổng: {totalAllBookings}</p>
                </div>
              </div>
              <div className="sd-kpi">
                <div className="sd-kpi-icon amber">📅</div>
                <div className="sd-kpi-info">
                  <p className="sd-kpi-label">Soát hôm nay</p>
                  <p className="sd-kpi-val amber">{todayTickets}</p>
                  <p className="sd-kpi-sub">vé</p>
                </div>
              </div>
              <div className="sd-kpi">
                <div className="sd-kpi-icon purple">🛒</div>
                <div className="sd-kpi-info">
                  <p className="sd-kpi-label">Bán hôm nay</p>
                  <p className="sd-kpi-val purple">{todayBookings}</p>
                  <p className="sd-kpi-sub">đơn</p>
                </div>
              </div>
            </div>

            <div className="sd-card">
              <div className="sd-card-head">
                <h3><span className="dot" style={{background:'#10b981'}}></span> Biểu đồ hoạt động</h3>
              </div>
              <div className="sd-card-body">
                <PeriodFilter
                  period={staffPeriod} from={staffFrom} to={staffTo}
                  onPeriod={handleStaffPeriod} onFrom={setStaffFrom} onTo={setStaffTo}
                />
                {filteredTickets.length === 0 && filteredBookings.length === 0 ? (
                  <div className="sd-empty" style={{padding:'30px 20px'}}>
                    <span>📊</span><p>Không có dữ liệu trong khoảng thời gian này.</p>
                  </div>
                ) : (
                  <div style={{ height: 320, marginTop: 16 }}>
                    <Bar data={staffLineData} options={staffChartOpts} />
                  </div>
                )}
              </div>
            </div>

            <div className="sd-card">
              <div className="sd-card-head" style={{paddingBottom: 0, borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px'}}>
                <div className="sd-tabs" style={{ borderBottom: 'none', marginBottom: 0 }}>
                  <button type="button" className={`sd-tab-btn ${staffTab === 'scans' ? 'active' : ''}`} onClick={() => setStaffTab('scans')}>
                    🎟️ Soát vé <span className="sd-tab-count">{filteredTickets.length}</span>
                  </button>
                  <button type="button" className={`sd-tab-btn ${staffTab === 'sales' ? 'active' : ''}`} onClick={() => setStaffTab('sales')}>
                    🏢 Bán vé <span className="sd-tab-count">{filteredBookings.length}</span>
                  </button>
                </div>
                {staffTab === 'scans' && filteredTickets.length > 0 && (
                  <button 
                    type="button" 
                    className="btn btn-sm btn-success d-flex align-items-center gap-1"
                    onClick={handleExportStaffScansExcel}
                  >
                    📊 Xuất Excel
                  </button>
                )}
                {staffTab === 'sales' && filteredBookings.length > 0 && (
                  <button 
                    type="button" 
                    className="btn btn-sm btn-success d-flex align-items-center gap-1"
                    onClick={handleExportStaffSalesExcel}
                  >
                    📊 Xuất Excel
                  </button>
                )}
              </div>
              <div className="sd-card-body" style={{paddingTop: 0}}>
                {staffTab === 'scans' && (
                  filteredTickets.length === 0 ? (
                    <div className="sd-empty"><span>📭</span><p>Không có vé nào được soát trong khoảng thời gian này.</p></div>
                  ) : (
                    <div className="sd-table-wrap">
                      <table className="sd-table">
                        <thead><tr><th>Ghế</th><th>Phim</th><th>Khách hàng</th><th>Thời gian</th></tr></thead>
                        <tbody>
                          {filteredTickets.slice(0, 10).map((t, idx) => {
                            const movieTitle = t.booking?.showtime?.movie?.title || 'N/A';
                            const buyerName = t.booking?.user 
                              ? `${t.booking.user.firstName || ''} ${t.booking.user.lastName || ''}`.trim() || t.booking.user.email
                              : t.booking?.customerName || 'Khách vãng lai';
                            return (
                              <tr key={t._id || idx}>
                                <td><span className="sd-seat">{t.seat?.name || 'N/A'}</span></td>
                                <td style={{fontWeight:500}}>{movieTitle}</td>
                                <td>{buyerName}</td>
                                <td style={{color:'#94a3b8', fontSize:12}}>{formatDateTime(t.checkedInAt)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
                {staffTab === 'sales' && (
                  filteredBookings.length === 0 ? (
                    <div className="sd-empty"><span>📭</span><p>Không có đơn bán vé nào trong khoảng thời gian này.</p></div>
                  ) : (
                    <div className="sd-table-wrap">
                      <table className="sd-table">
                        <thead><tr><th>Mã đơn</th><th>Phim & Ghế</th><th>Khách hàng</th><th>Thời gian</th></tr></thead>
                        <tbody>
                          {filteredBookings.slice(0, 10).map((b, idx) => {
                            const movieTitle = b.showtime?.movie?.title || 'N/A';
                            const seatList = b.tickets?.map(t => t.seat?.name).filter(Boolean).join(', ') || 'N/A';
                            const custName = b.user
                              ? `${b.user.firstName || ''} ${b.user.lastName || ''}`.trim() || b.user.email
                              : b.customerName || 'Khách vãng lai';
                            return (
                              <tr key={b._id || idx}>
                                <td><span className="sd-order">#{b._id?.slice(-6).toUpperCase()}</span></td>
                                <td>
                                  <strong style={{display:'block', color:'#1e293b'}}>{movieTitle}</strong>
                                  <small style={{color:'#94a3b8'}}>Ghế: {seatList}</small>
                                </td>
                                <td>
                                  <div style={{fontWeight:600}}>{custName}</div>
                                  {b.customerPhone && <small style={{color:'#94a3b8'}}>{b.customerPhone}</small>}
                                </td>
                                <td style={{color:'#94a3b8', fontSize:12}}>{formatDateTime(b.createdAt)}</td>
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
          </>
        )}
      </div>
    )
  }

  return (
    <div className="admin-stat-page">
      <style>{`
        .admin-stat-page { font-family: 'Inter','Segoe UI',sans-serif; }
        .st-page-header { margin-bottom: 22px; }
        .st-page-header h2 { margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; }
        .st-page-header p { margin: 4px 0 0; color: #64748b; font-size: 13px; }

        .st-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px; background: #fff; padding: 8px; border-radius: 14px; box-shadow: 0 1px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .st-tab { display: flex; align-items: center; gap: 7px; padding: 9px 16px; border: none; border-radius: 10px; background: transparent; color: #64748b; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .st-tab:hover { background: #f1f5f9; color: #374151; }
        .st-tab.active { background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; box-shadow: 0 4px 12px rgba(99,102,241,0.3); }

        .st-kpi-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(200px,1fr)); gap: 14px; margin-bottom: 20px; }
        .st-kpi-card { background: #fff; border-radius: 14px; padding: 18px; display: flex; align-items: center; gap: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; border-left: 4px solid var(--c,#6366f1); transition: transform 0.2s,box-shadow 0.2s; }
        .st-kpi-card:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.1); }
        .st-kpi-icon { font-size: 24px; width: 46px; height: 46px; border-radius: 11px; background: color-mix(in srgb,var(--c,#6366f1) 12%,transparent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .st-kpi-body { flex: 1; min-width: 0; }
        .st-kpi-label { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 3px; }
        .st-kpi-value { font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .st-kpi-sub { font-size: 11px; color: #94a3b8; margin: 0; }

        .st-chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 0; }
        @media (max-width: 900px) { .st-chart-row { grid-template-columns: 1fr; } }

        .st-card { background: #fff; border-radius: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; margin-bottom: 16px; overflow: hidden; }
        .st-card-header { display: flex; align-items: center; gap: 9px; padding: 13px 18px; border-bottom: 1px solid #f1f5f9; }
        .st-card-header span { font-size: 16px; }
        .st-card-header h3 { margin: 0; font-size: 14px; font-weight: 700; color: #1e293b; flex: 1; }
        .st-card-action { margin-left: auto; }
        .st-card-body { padding: 18px; }

        .st-filter-bar { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 16px; background: #fff; padding: 11px 15px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 5px rgba(0,0,0,0.04); }
        .st-pills { display: flex; gap: 5px; }
        .st-pill { padding: 5px 12px; border: 1.5px solid #e2e8f0; border-radius: 7px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.18s; }
        .st-pill:hover { border-color: #6366f1; color: #6366f1; }
        .st-pill.active { background: #6366f1; border-color: #6366f1; color: #fff; box-shadow: 0 2px 7px rgba(99,102,241,0.3); }
        .st-dates { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
        .st-dates label { font-size: 12px; font-weight: 600; color: #64748b; }
        .st-date-input { padding: 5px 9px; border: 1.5px solid #e2e8f0; border-radius: 7px; font-size: 12px; color: #374151; background: #f8fafc; outline: none; }
        .st-date-input:focus { border-color: #6366f1; }

        .st-table-wrap { overflow-x: auto; border-radius: 9px; border: 1px solid #f1f5f9; }
        .st-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .st-table th { background: #f8fafc; padding: 9px 13px; text-align: left; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
        .st-table td { padding: 9px 13px; border-bottom: 1px solid #f8fafc; color: #374151; vertical-align: middle; }
        .st-table tbody tr:hover { background: #f8fafc; }
        .st-table tfoot td { background: #f1f5f9; border-top: 2px solid #e2e8f0; font-weight: 700; }
        .top-row td { background: linear-gradient(90deg,rgba(245,158,11,0.05),transparent); }
        .rank-cell { font-size: 15px; text-align: center; width: 38px; }

        .st-badge { display: inline-flex; padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .badge-green { background: rgba(16,185,129,0.1); color: #059669; }
        .badge-amber { background: rgba(245,158,11,0.1); color: #d97706; }
        .badge-sky { background: rgba(14,165,233,0.1); color: #0284c7; }

        .val-money { font-weight: 700; color: #059669; white-space: nowrap; }
        .val-rose { color: #e11d48; }
        .val-amber { color: #d97706; }
        .movie-cell { display: flex; align-items: center; gap: 9px; }
        .movie-thumb { width: 32px; height: 44px; object-fit: cover; border-radius: 5px; flex-shrink: 0; box-shadow: 0 2px 5px rgba(0,0,0,0.12); }
        .movie-title { font-weight: 600; color: #1e293b; font-size: 13px; }
        .rating-cell { display: flex; align-items: center; gap: 4px; }
        .stars { color: #f59e0b; font-size: 12px; }
        .rating-num { color: #64748b; font-size: 11px; font-weight: 600; }

        .st-loading { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px 20px; color: #64748b; }
        .st-spinner { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .st-empty { display: flex; flex-direction: column; align-items: center; gap: 9px; padding: 36px 20px; color: #94a3b8; }
        .st-empty span { font-size: 28px; }
        .st-empty p { margin: 0; font-size: 13px; }
      `}</style>

      <div className="st-page-header">
        <h2>📊 Tổng quan & Thống kê</h2>
        <p>Người dùng, phim yêu thích và top bán vé — xem <strong>Doanh thu</strong> ở mục riêng</p>
      </div>

      <div className="st-tabs">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={`st-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && renderOverview()}
      {tab === 'users' && renderUsers()}
      {tab === 'favorite' && renderFavorite()}
      {tab === 'top-tickets' && renderTopTickets()}
    </div>
  )
}
