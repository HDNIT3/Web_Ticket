import { useState, useEffect, useCallback } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  LineElement, PointElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { getUsers } from '../../services/statistics.api.js'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, Filler)

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

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'top', labels: { color: '#64748b', font: { size: 12 } } },
    tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', borderColor: 'rgba(14,165,233,0.3)', borderWidth: 1, padding: 12, cornerRadius: 10 },
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

function SectionCard({ title, icon, children }) {
  return (
    <div className="stat-section-card">
      <div className="stat-section-header">
        <span className="stat-section-icon">{icon}</span>
        <h3>{title}</h3>
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

export default function AdminUserStats() {
  const [period, setPeriod] = useState('month')
  const [from, setFrom] = useState(() => defaultRange('month').from)
  const [to, setTo] = useState(() => defaultRange('month').to)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(() => {
    setLoading(true)
    getUsers({ period, from, to })
      .then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  }, [period, from, to])

  useEffect(() => { fetchData() }, [fetchData])

  const handlePeriod = (p) => {
    const r = defaultRange(p)
    setPeriod(p)
    setFrom(r.from)
    setTo(r.to)
  }

  const regItems = data?.registerItems || []
  const logItems = data?.loginItems || []

  const allLabels = Array.from(new Set([...regItems.map((r) => r.label), ...logItems.map((r) => r.label)])).sort()
  const regMap = Object.fromEntries(regItems.map((r) => [r.label, r.newUsers]))
  const logMap = Object.fromEntries(logItems.map((r) => [r.label, r.loginCount]))

  const chartData = {
    labels: allLabels,
    datasets: [
      {
        label: 'Đăng ký mới',
        data: allLabels.map((l) => regMap[l] || 0),
        backgroundColor: 'rgba(14,165,233,0.15)',
        borderColor: 'rgba(14,165,233,1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(14,165,233,1)',
        pointRadius: 4,
      },
      {
        label: 'Đăng nhập',
        data: allLabels.map((l) => logMap[l] || 0),
        backgroundColor: 'rgba(139,92,246,0.15)',
        borderColor: 'rgba(139,92,246,1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(139,92,246,1)',
        pointRadius: 4,
      },
    ],
  }

  const merged = allLabels.map((label) => ({
    label,
    newUsers: regMap[label] || 0,
    loginCount: logMap[label] || 0,
  }))

  return (
    <div className="admin-statistics">
      <style>{`
        .admin-statistics { font-family: 'Inter','Segoe UI',sans-serif; }
        .stat-page-header { margin-bottom: 24px; }
        .stat-page-header h2 { margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; }
        .stat-page-header p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
        .stat-kpi-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(220px,1fr)); gap: 16px; margin-bottom: 20px; }
        .stat-kpi-card { background: #fff; border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; border-left: 4px solid var(--kpi-color,#0ea5e9); transition: transform 0.2s,box-shadow 0.2s; }
        .stat-kpi-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
        .stat-kpi-icon { font-size: 26px; width: 50px; height: 50px; border-radius: 12px; background: color-mix(in srgb,var(--kpi-color,#0ea5e9) 12%,transparent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .stat-kpi-body { flex: 1; min-width: 0; }
        .stat-kpi-label { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px; }
        .stat-kpi-value { font-size: 19px; font-weight: 800; color: #0f172a; margin: 0 0 2px; }
        .stat-kpi-sub { font-size: 11px; color: #94a3b8; margin: 0; }
        .stat-section-card { background: #fff; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; margin-bottom: 20px; overflow: hidden; }
        .stat-section-header { display: flex; align-items: center; gap: 10px; padding: 14px 20px; border-bottom: 1px solid #f1f5f9; }
        .stat-section-icon { font-size: 17px; }
        .stat-section-header h3 { margin: 0; font-size: 15px; font-weight: 700; color: #1e293b; }
        .stat-section-body { padding: 20px; }
        .stat-filter-bar { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; background: #fff; padding: 12px 16px; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 1px 6px rgba(0,0,0,0.04); }
        .stat-filter-pills { display: flex; gap: 6px; }
        .stat-pill { padding: 6px 14px; border: 1.5px solid #e2e8f0; border-radius: 8px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .stat-pill:hover { border-color: #0ea5e9; color: #0ea5e9; }
        .stat-pill.active { background: #0ea5e9; border-color: #0ea5e9; color: #fff; box-shadow: 0 2px 8px rgba(14,165,233,0.3); }
        .stat-filter-dates { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .stat-filter-dates label { font-size: 12px; font-weight: 600; color: #64748b; }
        .stat-date-input { padding: 6px 10px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 12px; color: #374151; background: #f8fafc; outline: none; }
        .stat-date-input:focus { border-color: #0ea5e9; }
        .stat-table-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid #f1f5f9; }
        .stat-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .stat-table th { background: #f8fafc; padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
        .stat-table td { padding: 10px 14px; border-bottom: 1px solid #f8fafc; color: #374151; vertical-align: middle; }
        .stat-table tbody tr:hover { background: #f8fafc; }
        .stat-table tfoot td { background: #f1f5f9; border-top: 2px solid #e2e8f0; font-weight: 700; }
        .stat-badge { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .stat-badge--sky { background: rgba(14,165,233,0.1); color: #0284c7; }
        .stat-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 20px; color: #64748b; }
        .stat-spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #0ea5e9; border-radius: 50%; animation: stat-spin 0.8s linear infinite; }
        @keyframes stat-spin { to { transform: rotate(360deg); } }
        .stat-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px 20px; color: #94a3b8; }
        .stat-empty span { font-size: 32px; }
        .stat-empty p { margin: 0; font-size: 14px; }
      `}</style>

      <div className="stat-page-header">
        <h2>👥 Thống kê Người dùng</h2>
        <p>Theo dõi lượt đăng ký mới và đăng nhập theo thời gian</p>
      </div>

      <PeriodFilter period={period} from={from} to={to} onPeriod={handlePeriod} onFrom={setFrom} onTo={setTo} />

      <div className="stat-kpi-grid">
        <KpiCard icon="🆕" label="Người dùng đăng ký mới" value={fmt(data?.totalNewUsers)} color="#0ea5e9" />
        <KpiCard icon="🔐" label="Lượt đăng nhập" value={fmt(data?.totalLogins)} color="#8b5cf6" />
      </div>

      <SectionCard title="Biểu đồ người dùng" icon="📈">
        {loading ? <Spinner /> : allLabels.length === 0 ? <Empty /> : (
          <div style={{ height: 300 }}><Line data={chartData} options={CHART_OPTS} /></div>
        )}
      </SectionCard>

      <SectionCard title="Bảng chi tiết người dùng" icon="📋">
        {loading ? <Spinner /> : merged.length === 0 ? <Empty /> : (
          <div className="stat-table-wrap">
            <table className="stat-table">
              <thead>
                <tr><th>#</th><th>Kỳ</th><th>Đăng ký mới</th><th>Đăng nhập</th></tr>
              </thead>
              <tbody>
                {merged.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td><span className="stat-badge stat-badge--sky">{r.label}</span></td>
                    <td>{fmt(r.newUsers)}</td>
                    <td>{fmt(r.loginCount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}><strong>Tổng</strong></td>
                  <td><strong>{fmt(data?.totalNewUsers)}</strong></td>
                  <td><strong>{fmt(data?.totalLogins)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
