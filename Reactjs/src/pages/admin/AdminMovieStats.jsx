import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { getTopMoviesFavorite, getTopMoviesTickets } from '../../services/statistics.api.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function fmtMoney(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
}

function fmt(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('vi-VN')
}

const RANK_COLORS = [
  'rgba(245,158,11,0.2)', 'rgba(100,116,139,0.2)', 'rgba(180,83,9,0.15)',
]
const RANK_BORDERS = [
  'rgba(245,158,11,1)', 'rgba(100,116,139,1)', 'rgba(180,83,9,1)',
]

function getRankColor(i, alpha = false) {
  if (i < 3) return alpha ? RANK_COLORS[i] : RANK_BORDERS[i]
  return alpha ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,1)'
}

function SectionCard({ title, icon, children, action }) {
  return (
    <div className="stat-section-card">
      <div className="stat-section-header">
        <span className="stat-section-icon">{icon}</span>
        <h3>{title}</h3>
        {action && <div className="stat-section-action">{action}</div>}
      </div>
      <div className="stat-section-body">{children}</div>
    </div>
  )
}

function Spinner() {
  return <div className="stat-loading"><div className="stat-spinner" /><p>Đang tải...</p></div>
}

function Empty({ message = 'Chưa có dữ liệu.' }) {
  return <div className="stat-empty"><span>📭</span><p>{message}</p></div>
}

const TABS = [
  { id: 'favorite', label: 'Top Yêu thích', icon: '❤️' },
  { id: 'tickets', label: 'Top Bán vé', icon: '🏆' },
]

export default function AdminMovieStats() {
  const [tab, setTab] = useState('favorite')

  const [favLimit, setFavLimit] = useState(10)
  const [favData, setFavData] = useState(null)
  const [favLoading, setFavLoading] = useState(false)

  const [tikLimit, setTikLimit] = useState(10)
  const [tikData, setTikData] = useState(null)
  const [tikLoading, setTikLoading] = useState(false)

  useEffect(() => {
    if (tab !== 'favorite') return
    setFavLoading(true)
    getTopMoviesFavorite({ limit: favLimit })
      .then(setFavData).catch(() => setFavData(null)).finally(() => setFavLoading(false))
  }, [tab, favLimit])

  useEffect(() => {
    if (tab !== 'tickets') return
    setTikLoading(true)
    getTopMoviesTickets({ limit: tikLimit })
      .then(setTikData).catch(() => setTikData(null)).finally(() => setTikLoading(false))
  }, [tab, tikLimit])

  function LimitPills({ value, onChange }) {
    return (
      <div className="stat-filter-pills">
        {[5, 10, 20].map((n) => (
          <button key={n} type="button" className={`stat-pill ${value === n ? 'active' : ''}`} onClick={() => onChange(n)}>
            Top {n}
          </button>
        ))}
      </div>
    )
  }

  const renderFavorite = () => {
    const items = Array.isArray(favData) ? favData : []
    const chartData = {
      labels: items.map((m) => m.title?.length > 22 ? m.title.slice(0, 22) + '…' : m.title),
      datasets: [{
        label: 'Lượt yêu thích',
        data: items.map((m) => m.favoriteCount),
        backgroundColor: items.map((_, i) => getRankColor(i, true)),
        borderColor: items.map((_, i) => getRankColor(i, false)),
        borderWidth: 2,
        borderRadius: 6,
      }],
    }

    return (
      <>
        <SectionCard
          title={`Top ${favLimit} phim được yêu thích nhất`}
          icon="❤️"
          action={<LimitPills value={favLimit} onChange={setFavLimit} />}
        >
          {favLoading ? <Spinner /> : items.length === 0 ? <Empty message="Chưa có dữ liệu yêu thích." /> : (
            <div style={{ height: 320 }}>
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', cornerRadius: 10, padding: 10 },
                  },
                  scales: {
                    x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } },
                    y: { grid: { color: 'rgba(100,116,139,0.1)' }, ticks: { color: '#64748b', font: { size: 11 } }, beginAtZero: true },
                  },
                }}
              />
            </div>
          )}
        </SectionCard>

        <SectionCard title="Bảng top phim yêu thích" icon="📋">
          {favLoading ? <Spinner /> : items.length === 0 ? <Empty message="Chưa có dữ liệu yêu thích." /> : (
            <div className="stat-table-wrap">
              <table className="stat-table">
                <thead>
                  <tr><th>#</th><th>Phim</th><th>Trạng thái</th><th>Yêu thích</th><th>Đánh giá TB</th><th>Lượt review</th></tr>
                </thead>
                <tbody>
                  {items.map((m, i) => (
                    <tr key={i} className={i < 3 ? 'stat-row--top' : ''}>
                      <td className="stat-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                      <td>
                        <div className="stat-movie-cell">
                          {m.posterUrl && <img src={m.posterUrl} alt={m.title} className="stat-movie-thumb" />}
                          <span className="stat-movie-title">{m.title}</span>
                        </div>
                      </td>
                      <td><span className={`stat-badge stat-badge--${m.status === 'NOW_SHOWING' ? 'emerald' : 'amber'}`}>{m.status}</span></td>
                      <td><strong className="stat-highlight-rose">♥ {fmt(m.favoriteCount)}</strong></td>
                      <td>
                        <div className="stat-rating">
                          <span className="stat-stars">{'★'.repeat(Math.round(m.avgRating || 0))}{'☆'.repeat(5 - Math.round(m.avgRating || 0))}</span>
                          <span className="stat-rating-num">{(m.avgRating || 0).toFixed(1)}</span>
                        </div>
                      </td>
                      <td>{fmt(m.reviewCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </>
    )
  }

  const renderTickets = () => {
    const items = Array.isArray(tikData) ? tikData : []
    const chartData = {
      labels: items.map((m) => m.title?.length > 22 ? m.title.slice(0, 22) + '…' : m.title),
      datasets: [{
        label: 'Số vé bán',
        data: items.map((m) => m.ticketCount),
        backgroundColor: items.map((_, i) => getRankColor(i, true)),
        borderColor: items.map((_, i) => getRankColor(i, false)),
        borderWidth: 2,
        borderRadius: 6,
      }],
    }

    return (
      <>
        <SectionCard
          title={`Top ${tikLimit} phim bán vé nhiều nhất`}
          icon="🏆"
          action={<LimitPills value={tikLimit} onChange={setTikLimit} />}
        >
          {tikLoading ? <Spinner /> : items.length === 0 ? <Empty message="Chưa có dữ liệu vé." /> : (
            <div style={{ height: 320 }}>
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                  plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', cornerRadius: 10, padding: 10 },
                  },
                  scales: {
                    x: { grid: { color: 'rgba(100,116,139,0.1)' }, ticks: { color: '#64748b', font: { size: 11 } }, beginAtZero: true },
                    y: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } },
                  },
                }}
              />
            </div>
          )}
        </SectionCard>

        <SectionCard title="Bảng top phim bán vé" icon="📋">
          {tikLoading ? <Spinner /> : items.length === 0 ? <Empty message="Chưa có dữ liệu vé." /> : (
            <div className="stat-table-wrap">
              <table className="stat-table">
                <thead>
                  <tr><th>#</th><th>Phim</th><th>Trạng thái</th><th>Vé bán</th><th>Doanh thu</th><th>Đánh giá TB</th></tr>
                </thead>
                <tbody>
                  {items.map((m, i) => (
                    <tr key={i} className={i < 3 ? 'stat-row--top' : ''}>
                      <td className="stat-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                      <td>
                        <div className="stat-movie-cell">
                          {m.posterUrl && <img src={m.posterUrl} alt={m.title} className="stat-movie-thumb" />}
                          <span className="stat-movie-title">{m.title}</span>
                        </div>
                      </td>
                      <td><span className={`stat-badge stat-badge--${m.status === 'NOW_SHOWING' ? 'emerald' : 'amber'}`}>{m.status}</span></td>
                      <td><strong className="stat-highlight-amber">🎟️ {fmt(m.ticketCount)}</strong></td>
                      <td className="stat-money">{fmtMoney(m.totalRevenue)}</td>
                      <td>
                        <div className="stat-rating">
                          <span className="stat-stars">{'★'.repeat(Math.round(m.avgRating || 0))}{'☆'.repeat(5 - Math.round(m.avgRating || 0))}</span>
                          <span className="stat-rating-num">{(m.avgRating || 0).toFixed(1)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
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
        .stat-tab.active { background: linear-gradient(135deg,#f59e0b,#ef4444); color: #fff; box-shadow: 0 4px 12px rgba(245,158,11,0.35); }
        .stat-section-card { background: #fff; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; margin-bottom: 20px; overflow: hidden; }
        .stat-section-header { display: flex; align-items: center; gap: 10px; padding: 14px 20px; border-bottom: 1px solid #f1f5f9; }
        .stat-section-action { margin-left: auto; }
        .stat-section-icon { font-size: 17px; }
        .stat-section-header h3 { margin: 0; font-size: 15px; font-weight: 700; color: #1e293b; }
        .stat-section-body { padding: 20px; }
        .stat-filter-pills { display: flex; gap: 6px; }
        .stat-pill { padding: 6px 14px; border: 1.5px solid #e2e8f0; border-radius: 8px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .stat-pill:hover { border-color: #f59e0b; color: #d97706; }
        .stat-pill.active { background: #f59e0b; border-color: #f59e0b; color: #fff; box-shadow: 0 2px 8px rgba(245,158,11,0.3); }
        .stat-table-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid #f1f5f9; }
        .stat-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .stat-table th { background: #f8fafc; padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
        .stat-table td { padding: 10px 14px; border-bottom: 1px solid #f8fafc; color: #374151; vertical-align: middle; }
        .stat-table tbody tr:hover { background: #fffbeb; }
        .stat-row--top td { background: linear-gradient(90deg,rgba(245,158,11,0.04),transparent); }
        .stat-rank { font-size: 16px; text-align: center; }
        .stat-badge { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .stat-badge--emerald { background: rgba(16,185,129,0.1); color: #059669; }
        .stat-badge--amber { background: rgba(245,158,11,0.1); color: #d97706; }
        .stat-money { font-weight: 700; color: #059669; white-space: nowrap; }
        .stat-highlight-rose { color: #e11d48; }
        .stat-highlight-amber { color: #d97706; }
        .stat-rating { display: flex; align-items: center; gap: 4px; }
        .stat-stars { color: #f59e0b; font-size: 13px; }
        .stat-rating-num { color: #64748b; font-size: 12px; font-weight: 600; }
        .stat-movie-cell { display: flex; align-items: center; gap: 10px; }
        .stat-movie-thumb { width: 34px; height: 48px; object-fit: cover; border-radius: 5px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.12); }
        .stat-movie-title { font-weight: 600; color: #1e293b; font-size: 13px; }
        .stat-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 20px; color: #64748b; }
        .stat-spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #f59e0b; border-radius: 50%; animation: stat-spin 0.8s linear infinite; }
        @keyframes stat-spin { to { transform: rotate(360deg); } }
        .stat-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px 20px; color: #94a3b8; }
        .stat-empty span { font-size: 32px; }
        .stat-empty p { margin: 0; font-size: 14px; }
      `}</style>

      <div className="stat-page-header">
        <h2>🎬 Thống kê Phim</h2>
        <p>Xếp hạng phim theo lượt yêu thích và số vé bán được</p>
      </div>

      <div className="stat-tabs">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={`stat-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {tab === 'favorite' && renderFavorite()}
      {tab === 'tickets' && renderTickets()}
    </div>
  )
}
