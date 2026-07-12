import { useState, useEffect, useCallback } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { getRevenue, getTickets } from '../../services/statistics.api.js'
import { exportToExcel } from '../../util/export.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler)

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

function fmt(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('vi-VN')
}

function defaultRange(period) {
  const today = new Date()
  const to = today.toISOString().slice(0, 10)
  if (period === 'year') return { from: new Date(today.getFullYear() - 4, 0, 1).toISOString().slice(0, 10), to }
  if (period === 'month') return { from: new Date(today.getFullYear(), today.getMonth() - 11, 1).toISOString().slice(0, 10), to }
  return { from: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29).toISOString().slice(0, 10), to }
}

const CHART_OPTS_BASE = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15,23,42,0.95)',
      borderColor: 'rgba(99,102,241,0.3)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 10,
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } },
    y: { grid: { color: 'rgba(100,116,139,0.1)' }, ticks: { color: '#64748b', font: { size: 11 } }, beginAtZero: true },
  },
}

function KpiCard({ icon, label, value, sub, color }) {
  return (
    <div className="stat-kpi-card" style={{ '--kpi-color': color }}>
      <div className="stat-kpi-icon">{icon}</div>
      <div className="stat-kpi-body">
        <p className="stat-kpi-label">{label}</p>
        <p className="stat-kpi-value">{value}</p>
        {sub && <p className="stat-kpi-sub">{sub}</p>}
      </div>
    </div>
  )
}

function PeriodFilter({ period, from, to, onPeriod, onFrom, onTo }) {
  return (
    <div className="stat-filter-bar">
      <div className="stat-filter-pills">
        {[['day', 'Ngày'], ['month', 'Tháng'], ['year', 'Năm']].map(([p, label]) => (
          <button key={p} type="button" className={`stat-pill ${period === p ? 'active' : ''}`} onClick={() => onPeriod(p)}>
            {label}
          </button>
        ))}
      </div>
      <div className="stat-filter-dates">
        <label>Từ</label>
        <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} className="stat-date-input" />
        <label>Đến</label>
        <input type="date" value={to} onChange={(e) => onTo(e.target.value)} className="stat-date-input" />
      </div>
    </div>
  )
}

function SectionCard({ title, icon, action, children }) {
  return (
    <div className="stat-section-card">
      <div className="stat-section-header" style={{ display: 'flex', alignItems: 'center' }}>
        <span className="stat-section-icon">{icon}</span>
        <h3 style={{ flex: 1, margin: 0 }}>{title}</h3>
        {action && <div className="stat-section-action">{action}</div>}
      </div>
      <div className="stat-section-body">{children}</div>
    </div>
  )
}

function Spinner() {
  return <div className="stat-loading"><div className="stat-spinner" /><p>Đang tải...</p></div>
}

function Empty() {
  return <div className="stat-empty"><span>📭</span><p>Không có dữ liệu trong khoảng thời gian này.</p></div>
}

const TABS = [
  { id: 'revenue', label: 'Doanh thu', icon: '💰' },
  { id: 'tickets', label: 'Vé đã bán', icon: '🎟️' },
]

export default function AdminRevenueStats() {
  const [tab, setTab] = useState('revenue')

  const [revPeriod, setRevPeriod] = useState('month')
  const [revFrom, setRevFrom] = useState(() => defaultRange('month').from)
  const [revTo, setRevTo] = useState(() => defaultRange('month').to)
  const [revData, setRevData] = useState(null)
  const [revLoading, setRevLoading] = useState(false)

  const [tikPeriod, setTikPeriod] = useState('month')
  const [tikFrom, setTikFrom] = useState(() => defaultRange('month').from)
  const [tikTo, setTikTo] = useState(() => defaultRange('month').to)
  const [tikData, setTikData] = useState(null)
  const [tikLoading, setTikLoading] = useState(false)

  const fetchRevenue = useCallback(() => {
    setRevLoading(true)
    getRevenue({ period: revPeriod, from: revFrom, to: revTo })
      .then(setRevData).catch(() => setRevData(null)).finally(() => setRevLoading(false))
  }, [revPeriod, revFrom, revTo])

  const fetchTickets = useCallback(() => {
    setTikLoading(true)
    getTickets({ period: tikPeriod, from: tikFrom, to: tikTo })
      .then(setTikData).catch(() => setTikData(null)).finally(() => setTikLoading(false))
  }, [tikPeriod, tikFrom, tikTo])

  useEffect(() => { if (tab === 'revenue') fetchRevenue() }, [tab, fetchRevenue])
  useEffect(() => { if (tab === 'tickets') fetchTickets() }, [tab, fetchTickets])

  const handleRevPeriod = (p) => { const r = defaultRange(p); setRevPeriod(p); setRevFrom(r.from); setRevTo(r.to) }
  const handleTikPeriod = (p) => { const r = defaultRange(p); setTikPeriod(p); setTikFrom(r.from); setTikTo(r.to) }

  const renderRevenue = () => {
    const items = revData?.items || []
    const chartData = {
      labels: items.map((r) => r.label),
      datasets: [{
        label: 'Doanh thu',
        data: items.map((r) => r.totalRevenue),
        backgroundColor: 'rgba(99,102,241,0.15)',
        borderColor: 'rgba(99,102,241,1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(99,102,241,1)',
        pointRadius: 4,
      }],
    }
    const opts = {
      ...CHART_OPTS_BASE,
      plugins: {
        ...CHART_OPTS_BASE.plugins,
        tooltip: { ...CHART_OPTS_BASE.plugins.tooltip, callbacks: { label: (ctx) => `  ${fmtMoney(ctx.raw)}` } },
      },
      scales: {
        ...CHART_OPTS_BASE.scales,
        y: { ...CHART_OPTS_BASE.scales.y, ticks: { ...CHART_OPTS_BASE.scales.y.ticks, callback: (v) => fmtMoneyShort(v) } },
      },
    }

    const handleExportRevenueExcel = () => {
      const headers = ['STT', 'Kỳ', 'Số đơn', 'Doanh thu']
      const rows = items.map((r, i) => [
        i + 1,
        r.label,
        r.bookingCount,
        r.totalRevenue
      ])
      rows.push(['Tổng', '', revData?.totalBookings || 0, revData?.totalRevenue || 0])
      exportToExcel(`Bao_cao_doanh_thu_${revPeriod}_${revFrom}_to_${revTo}`, headers, rows)
    }

    return (
      <>
        <PeriodFilter period={revPeriod} from={revFrom} to={revTo} onPeriod={handleRevPeriod} onFrom={setRevFrom} onTo={setRevTo} />
        <div className="stat-kpi-grid">
          <KpiCard icon="💰" label="Tổng doanh thu" value={fmtMoney(revData?.totalRevenue)} color="#6366f1" />
          <KpiCard icon="🛒" label="Số đơn PAID" value={fmt(revData?.totalBookings)} color="#10b981" />
        </div>
        <SectionCard title="Biểu đồ doanh thu" icon="📈">
          {revLoading ? <Spinner /> : items.length === 0 ? <Empty /> : <div style={{ height: 300 }}><Line data={chartData} options={opts} /></div>}
        </SectionCard>
        <SectionCard 
          title="Bảng chi tiết doanh thu" 
          icon="📋"
          action={
            items.length > 0 && !revLoading && (
              <button 
                type="button" 
                className="btn btn-sm btn-success d-flex align-items-center gap-1"
                onClick={handleExportRevenueExcel}
              >
                📊 Xuất Excel
              </button>
            )
          }
        >
          {revLoading ? <Spinner /> : items.length === 0 ? <Empty /> : (
            <div className="stat-table-wrap">
              <table className="stat-table">
                <thead><tr><th>#</th><th>Kỳ</th><th>Số đơn</th><th>Doanh thu</th></tr></thead>
                <tbody>
                  {items.map((r, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td><span className="stat-badge stat-badge--indigo">{r.label}</span></td>
                      <td>{fmt(r.bookingCount)}</td>
                      <td className="stat-money">{fmtMoney(r.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}><strong>Tổng</strong></td>
                    <td><strong>{fmt(revData?.totalBookings)}</strong></td>
                    <td className="stat-money"><strong>{fmtMoney(revData?.totalRevenue)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </SectionCard>
      </>
    )
  }

  const renderTickets = () => {
    const items = tikData?.items || []
    const totalRevTik = items.reduce((s, r) => s + (r.totalRevenue || 0), 0)
    const chartData = {
      labels: items.map((r) => r.label),
      datasets: [{
        label: 'Số vé',
        data: items.map((r) => r.ticketCount),
        backgroundColor: 'rgba(16,185,129,0.18)',
        borderColor: 'rgba(16,185,129,1)',
        borderWidth: 2,
        borderRadius: 6,
      }],
    }

    const handleExportTicketsExcel = () => {
      const headers = ['STT', 'Kỳ', 'Số vé', 'Doanh thu']
      const rows = items.map((r, i) => [
        i + 1,
        r.label,
        r.ticketCount,
        r.totalRevenue
      ])
      rows.push(['Tổng', '', tikData?.totalTickets || 0, totalRevTik])
      exportToExcel(`Bao_cao_ve_ban_${tikPeriod}_${tikFrom}_to_${tikTo}`, headers, rows)
    }

    return (
      <>
        <PeriodFilter period={tikPeriod} from={tikFrom} to={tikTo} onPeriod={handleTikPeriod} onFrom={setTikFrom} onTo={setTikTo} />
        <div className="stat-kpi-grid">
          <KpiCard icon="🎟️" label="Tổng vé đã bán" value={fmt(tikData?.totalTickets)} sub="PAID + CHECKED_IN" color="#10b981" />
          <KpiCard icon="💵" label="Doanh thu từ vé" value={fmtMoney(totalRevTik)} color="#6366f1" />
        </div>
        <SectionCard title="Biểu đồ vé đã bán" icon="📊">
          {tikLoading ? <Spinner /> : items.length === 0 ? <Empty /> : <div style={{ height: 300 }}><Bar data={chartData} options={CHART_OPTS_BASE} /></div>}
        </SectionCard>
        <SectionCard 
          title="Bảng chi tiết vé bán" 
          icon="📋"
          action={
            items.length > 0 && !tikLoading && (
              <button 
                type="button" 
                className="btn btn-sm btn-success d-flex align-items-center gap-1"
                onClick={handleExportTicketsExcel}
              >
                📊 Xuất Excel
              </button>
            )
          }
        >
          {tikLoading ? <Spinner /> : items.length === 0 ? <Empty /> : (
            <div className="stat-table-wrap">
              <table className="stat-table">
                <thead><tr><th>#</th><th>Kỳ</th><th>Số vé</th><th>Doanh thu</th></tr></thead>
                <tbody>
                  {items.map((r, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td><span className="stat-badge stat-badge--emerald">{r.label}</span></td>
                      <td>{fmt(r.ticketCount)}</td>
                      <td className="stat-money">{fmtMoney(r.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}><strong>Tổng</strong></td>
                    <td><strong>{fmt(tikData?.totalTickets)}</strong></td>
                    <td className="stat-money"><strong>{fmtMoney(totalRevTik)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </SectionCard>
      </>
    )
  }

  return (
    <div className="admin-statistics">
      <style>{`
        .admin-statistics { font-family: 'Inter','Segoe UI',sans-serif; }
        .stat-page-header { margin-bottom: 24px; }
        .stat-page-header h2 { margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; }
        .stat-page-header p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
        .stat-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px; background: #fff; padding: 8px; border-radius: 14px; box-shadow: 0 1px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .stat-tab { display: flex; align-items: center; gap: 7px; padding: 9px 16px; border: none; border-radius: 10px; background: transparent; color: #64748b; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .stat-tab:hover { background: #f1f5f9; color: #374151; }
        .stat-tab.active { background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; box-shadow: 0 4px 12px rgba(99,102,241,0.35); }
        .stat-kpi-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(220px,1fr)); gap: 16px; margin-bottom: 20px; }
        .stat-kpi-card { background: #fff; border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; border-left: 4px solid var(--kpi-color,#6366f1); transition: transform 0.2s,box-shadow 0.2s; }
        .stat-kpi-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
        .stat-kpi-icon { font-size: 26px; width: 50px; height: 50px; border-radius: 12px; background: color-mix(in srgb,var(--kpi-color,#6366f1) 12%,transparent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .stat-kpi-body { flex: 1; min-width: 0; }
        .stat-kpi-label { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px; }
        .stat-kpi-value { font-size: 19px; font-weight: 800; color: #0f172a; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .stat-kpi-sub { font-size: 11px; color: #94a3b8; margin: 0; }
        .stat-section-card { background: #fff; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; margin-bottom: 20px; overflow: hidden; }
        .stat-section-header { display: flex; align-items: center; gap: 10px; padding: 14px 20px; border-bottom: 1px solid #f1f5f9; }
        .stat-section-icon { font-size: 17px; }
        .stat-section-header h3 { margin: 0; font-size: 15px; font-weight: 700; color: #1e293b; }
        .stat-section-body { padding: 20px; }
        .stat-filter-bar { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; background: #fff; padding: 12px 16px; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 1px 6px rgba(0,0,0,0.04); }
        .stat-filter-pills { display: flex; gap: 6px; }
        .stat-pill { padding: 6px 14px; border: 1.5px solid #e2e8f0; border-radius: 8px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .stat-pill:hover { border-color: #6366f1; color: #6366f1; }
        .stat-pill.active { background: #6366f1; border-color: #6366f1; color: #fff; box-shadow: 0 2px 8px rgba(99,102,241,0.3); }
        .stat-filter-dates { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .stat-filter-dates label { font-size: 12px; font-weight: 600; color: #64748b; }
        .stat-date-input { padding: 6px 10px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 12px; color: #374151; background: #f8fafc; outline: none; transition: border-color 0.2s; }
        .stat-date-input:focus { border-color: #6366f1; }
        .stat-table-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid #f1f5f9; }
        .stat-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .stat-table th { background: #f8fafc; padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
        .stat-table td { padding: 10px 14px; border-bottom: 1px solid #f8fafc; color: #374151; vertical-align: middle; }
        .stat-table tbody tr:hover { background: #f8fafc; }
        .stat-table tfoot td { background: #f1f5f9; border-top: 2px solid #e2e8f0; font-weight: 700; }
        .stat-badge { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .stat-badge--indigo { background: rgba(99,102,241,0.1); color: #4f46e5; }
        .stat-badge--emerald { background: rgba(16,185,129,0.1); color: #059669; }
        .stat-money { font-weight: 700; color: #059669; white-space: nowrap; }
        .stat-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 20px; color: #64748b; }
        .stat-spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: stat-spin 0.8s linear infinite; }
        @keyframes stat-spin { to { transform: rotate(360deg); } }
        .stat-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px 20px; color: #94a3b8; }
        .stat-empty span { font-size: 32px; }
        .stat-empty p { margin: 0; font-size: 14px; }
      `}</style>

      <div className="stat-page-header">
        <h2>💰 Thống kê Doanh thu</h2>
        <p>Phân tích doanh thu booking và số lượng vé đã bán theo thời gian</p>
      </div>

      <div className="stat-tabs">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={`stat-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {tab === 'revenue' && renderRevenue()}
      {tab === 'tickets' && renderTickets()}
    </div>
  )
}
