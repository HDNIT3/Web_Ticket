import React, { useState, useEffect, useMemo, useRef } from 'react'
import { auditoriumApi } from '../../services/auditorium.api'
import { seatApi } from '../../services/seat.api'
import { requestJson } from '../../services/api.client'
import { notifyError, notifySuccess } from '../../util/notify'



function buildPagination(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i)
  const pages = [0]
  const start = Math.max(1, currentPage - 1)
  const end = Math.min(totalPages - 2, currentPage + 1)
  if (start > 1) pages.push('...')
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < totalPages - 2) pages.push('...')
  pages.push(totalPages - 1)
  return pages
}

export default function AdminAuditoriums() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ name: '', status: 'ACTIVE', totalRows: 8, totalColumns: 12 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(8)
  const containerRef = useRef(null)

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const height = entry.contentRect.height
        const rows = Math.floor((height - 45) / 55)
        setPageSize(Math.max(3, rows))
      }
    })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])


  const [showSeatModal, setShowSeatModal] = useState(false)
  const [selectedAuditorium, setSelectedAuditorium] = useState(null)
  const [seats, setSeats] = useState([])
  const [loadingSeats, setLoadingSeats] = useState(false)
  const [seatTypes, setSeatTypes] = useState([])
  const [editingSeat, setEditingSeat] = useState(null)

  const load = () => {
    setLoading(true)
    auditoriumApi.getAll()
      .then(res => setList(Array.isArray(res) ? res.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)) : []))
      .catch(() => notifyError('Không thể tải danh sách phòng chiếu'))
      .finally(() => setLoading(false))


    requestJson('/seat-types')
      .then(data => setSeatTypes(data || []))
      .catch(() => {})
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let result = list
    const q = search.trim().toLowerCase()
    if (q) result = result.filter(i => i.name?.toLowerCase().includes(q))
    if (filterStatus) result = result.filter(i => i.status === filterStatus)
    return result
  }, [list, search, filterStatus])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize)
  const pagination = buildPagination(page, totalPages)

  const openCreate = () => {
    setEditItem(null)
    setForm({ name: '', status: 'ACTIVE', totalRows: 8, totalColumns: 12 })
    setError('')
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setError('')
    setForm({
      name: item.name,
      status: item.status,
      totalRows: item.totalRows || 8,
      totalColumns: item.totalColumns || 12
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa phòng chiếu này và toàn bộ ghế liên quan?')) return
    try {
      await auditoriumApi.delete(id)
      notifySuccess('Xóa phòng chiếu thành công')
      load()
    } catch (err) { notifyError(err?.message || 'Không thể xóa phòng chiếu') }
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError('')
    try {
      if (editItem) {
        await auditoriumApi.update(editItem._id, form)
        notifySuccess('Cập nhật phòng chiếu thành công')
      } else {
        const res = await auditoriumApi.create(form)
        notifySuccess('Tạo phòng chiếu thành công')

        if (res && res._id) {
          try {
            await seatApi.generateSeatsForAuditorium(res._id)
            notifySuccess('Đã tự động tạo ghế cho phòng chiếu')
          } catch(e) {
            notifyError('Lỗi khi tự động tạo ghế: ' + e.message)
          }
        }
      }
      setShowModal(false)
      load()
    } catch (err) {
      setError(err?.message || 'Lỗi không xác định')
    } finally { setSaving(false) }
  }

  const openManageSeats = async (auditorium) => {
    setSelectedAuditorium(auditorium)
    setLoadingSeats(true)
    setShowSeatModal(true)
    setEditingSeat(null)
    try {
      const data = await seatApi.getSeatsByAuditorium(auditorium._id)
      setSeats(data || [])
    } catch (err) {
      notifyError('Không thể tải danh sách ghế')
    } finally {
      setLoadingSeats(false)
    }
  }

  const handleGenerateSeats = async () => {
    if (!window.confirm('Tạo ghế mặc định cho phòng này?')) return;
    try {
      setLoadingSeats(true)
      await seatApi.generateSeatsForAuditorium(selectedAuditorium._id)
      notifySuccess('Tạo ghế thành công')
      const data = await seatApi.getSeatsByAuditorium(selectedAuditorium._id)
      setSeats(data || [])
    } catch (err) {
      notifyError(err?.message || 'Lỗi khi tạo ghế')
      setLoadingSeats(false)
    }
  }

  const handleUpdateSeat = async () => {
    if (!editingSeat) return;
    try {
      await seatApi.updateSeat(editingSeat._id, {
        status: editingSeat.status,
        seatType: editingSeat.seatType?._id || editingSeat.seatType
      })
      notifySuccess('Cập nhật ghế thành công')
      setEditingSeat(null)

      const data = await seatApi.getSeatsByAuditorium(selectedAuditorium._id)
      setSeats(data || [])
    } catch (err) {
      notifyError(err?.message || 'Lỗi cập nhật ghế')
    }
  }

  const getSeatColor = (seat) => {
    if (seat.status === 'MAINTENANCE') return '#6c757d'
    if (seat.seatType?.name?.toUpperCase() === 'VIP') return '#d97706'
    if (seat.seatType?.name?.toUpperCase() === 'SWEETBOX') return '#e11d48'
    return '#3b82f6'
  }

  return (
    <section className="container-fluid px-2 px-md-3 px-xl-4 d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
      <div className="card border-0 shadow-sm d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
        <div className="card-body p-3 p-md-4 d-flex flex-column" style={{ minHeight: 0 }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="h4 mb-0">Quản lý phòng chiếu</h2>
            <button className="btn btn-primary" onClick={openCreate}>🚪 Thêm Phòng</button>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-12 col-md-4">
              <input type="text" className="form-control" placeholder="Tìm tên phòng..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
            </div>
            <div className="col-12 col-md-3">
              <select className="form-select" value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setPage(0) }}>
                <option value="">Tất cả</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="UNDER_MAINTENANCE">Bảo trì</option>
                <option value="INACTIVE">Vô hiệu hóa</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          ) : (
            <div className="table-responsive border rounded-3 bg-white flex-grow-1 overflow-auto" ref={containerRef}>
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 60 }}>STT</th>
                    <th>Tên Phòng</th>
                    <th>Trạng Thái</th>
                    <th>Số Ghế / Layout</th>
                    <th className="text-end">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 && <tr><td colSpan={5} className="text-center py-4">Không có dữ liệu.</td></tr>}
                  {paginated.map((item, idx) => (
                    <tr key={item._id}>
                      <td className="text-center">{page * pageSize + idx + 1}</td>
                      <td className="fw-semibold">{item.name}</td>
                      <td>
                        <span className={`badge ${item.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                          {item.status === 'ACTIVE' ? 'Hoạt động' : item.status === 'UNDER_MAINTENANCE' ? 'Bảo trì' : item.status === 'INACTIVE' ? 'Vô hiệu hóa' : item.status}
                        </span>
                      </td>
                      <td>{item.seatCount} ghế ({item.totalRows}x{item.totalColumns})</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-info me-2" onClick={() => openManageSeats(item)}>Quản lý Ghế</button>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(item)}>Sửa</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item._id)}>Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mt-auto pt-3">
            <p className="text-secondary mb-0">Trang {page + 1} / {Math.max(totalPages, 1)}</p>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setPage(p => p - 1)} disabled={page <= 0}>Trước</button>
              {pagination.map((item, idx) =>
                typeof item !== 'number' ? (
                  <span key={`e${idx}`} className="text-secondary px-1">...</span>
                ) : (
                  <button key={item}
                    className={`btn btn-sm ${item === page ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setPage(item)}>
                    {item + 1}
                  </button>
                )
              )}
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Sau</button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editItem ? 'Sửa Phòng Chiếu' : 'Thêm Phòng Chiếu'}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="mb-3">
                  <label className="form-label">Tên Phòng</label>
                  <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Trạng Thái</label>
                  <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="UNDER_MAINTENANCE">Bảo trì</option>
                    <option value="INACTIVE">Vô hiệu hóa</option>
                  </select>
                </div>
                {!editItem && (
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label">Số Hàng</label>
                      <input type="number" className="form-control" value={form.totalRows} onChange={e => setForm({ ...form, totalRows: e.target.value })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Số Cột</label>
                      <input type="number" className="form-control" value={form.totalColumns} onChange={e => setForm({ ...form, totalColumns: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}


      {showSeatModal && selectedAuditorium && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Quản lý Ghế: {selectedAuditorium.name}</h5>
                <button className="btn-close" onClick={() => setShowSeatModal(false)} />
              </div>
              <div className="modal-body bg-light">
                {loadingSeats ? (
                  <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
                ) : seats.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-secondary mb-3">Phòng chiếu này chưa có ghế nào được tạo.</p>
                    <button className="btn btn-primary" onClick={handleGenerateSeats}>Phát sinh ghế tự động</button>
                  </div>
                ) : (
                  <div className="row">
                    <div className="col-lg-8">
                      <div className="card shadow-sm border-0 mb-3">
                        <div className="card-body text-center" style={{ overflowX: 'auto' }}>
                          <div className="mb-4 bg-secondary text-white py-1 rounded mx-auto" style={{ width: '80%' }}>MÀN HÌNH</div>
                          <div className="d-inline-block text-start">
                            {Array.from({ length: selectedAuditorium.totalRows }).map((_, rIdx) => {
                              const rowSeats = seats.filter(s => s.rowIndex === rIdx + 1).sort((a,b) => a.columnIndex - b.columnIndex)
                              return (
                                <div key={rIdx} className="d-flex align-items-center mb-1 justify-content-center">
                                  <span className="me-2 text-secondary fw-bold" style={{ width: '20px' }}>{String.fromCharCode(65 + rIdx)}</span>
                                  {rowSeats.map(seat => (
                                    <div key={seat._id}
                                      onClick={() => setEditingSeat(seat)}
                                      className="d-flex align-items-center justify-content-center m-1 text-white shadow-sm"
                                      style={{
                                        width: '32px', height: '32px', fontSize: '11px', cursor: 'pointer',
                                        borderRadius: '6px',
                                        background: getSeatColor(seat),
                                        border: editingSeat?._id === seat._id ? '3px solid #000' : 'none'
                                      }}
                                    >
                                      {seat.name}
                                    </div>
                                  ))}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4">
                      {editingSeat ? (
                        <div className="card shadow-sm border-0">
                          <div className="card-body">
                            <h6 className="fw-bold mb-3">Chỉnh sửa ghế {editingSeat.name}</h6>
                            <div className="mb-3">
                              <label className="form-label">Trạng Thái</label>
                              <select className="form-select" value={editingSeat.status}
                                onChange={e => setEditingSeat({...editingSeat, status: e.target.value})}>
                                <option value="AVAILABLE">Khả dụng (AVAILABLE)</option>
                                <option value="MAINTENANCE">Bảo trì (MAINTENANCE)</option>
                              </select>
                            </div>
                            <div className="mb-3">
                              <label className="form-label">Loại Ghế</label>
                              <select className="form-select" value={editingSeat.seatType?._id || editingSeat.seatType}
                                onChange={e => setEditingSeat({...editingSeat, seatType: e.target.value})}>
                                {seatTypes.map(st => (
                                  <option key={st._id} value={st._id}>{st.name} (Phụ thu: {st.surchargeAmount}đ)</option>
                                ))}
                              </select>
                            </div>
                            <div className="d-flex gap-2">
                              <button className="btn btn-primary flex-grow-1" onClick={handleUpdateSeat}>Lưu Thay Đổi</button>
                              <button className="btn btn-outline-secondary" onClick={() => setEditingSeat(null)}>Hủy</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="alert alert-info border-0 shadow-sm">
                          <i className="bi bi-info-circle me-2"></i>
                          Nhấn vào một ghế trên sơ đồ để thay đổi loại ghế hoặc trạng thái (bảo trì).
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
