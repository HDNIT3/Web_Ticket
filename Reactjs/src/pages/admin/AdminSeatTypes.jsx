import React, { useState, useEffect, useMemo, useRef } from 'react'
import { requestJson } from '../../services/api.client'
import { notifyError, notifySuccess } from '../../util/notify'



function buildPagination(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i)
  const pages = [0]
  const start = Math.max(1, currentPage - 1)
  const end   = Math.min(totalPages - 2, currentPage + 1)
  if (start > 1) pages.push('...')
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < totalPages - 2) pages.push('...')
  pages.push(totalPages - 1)
  return pages
}

export default function AdminSeatTypes() {
  const [list,      setList]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem,  setEditItem]  = useState(null)
  const [form,      setForm]      = useState({ name: '', surchargeAmount: 0 })
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')


  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(0)
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

  const load = () => {
    setLoading(true)
    setLoadError('')
    requestJson('/seat-types')
      .then(res => setList(Array.isArray(res) ? res.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)) : []))
      .catch(err => {
        setList([])
        const msg = err?.message || 'Không tải được danh sách loại ghế.'
        setLoadError(msg)
        notifyError(msg)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(item => item.name?.toLowerCase().includes(q))
  }, [list, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated  = filtered.slice(page * pageSize, (page + 1) * pageSize)
  const pagination = buildPagination(page, totalPages)

  const openCreate = () => {
    setEditItem(null)
    setForm({ name: '', surchargeAmount: 0 })
    setError('')
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({ name: item.name, surchargeAmount: item.surchargeAmount ?? item.surcharge ?? item.surchargeFee ?? 0 })
    setError('')
    setShowModal(true)
  }

  const handleDelete = async (item) => {
    const id = item._id || item.id
    if (!window.confirm('Xóa loại ghế này? Nếu loại ghế đang được sử dụng sẽ gây lỗi hiển thị.')) return
    try {
      await requestJson(`/seat-types/${id}`, { method: 'DELETE' })
      notifySuccess('Xóa loại ghế thành công.')
      load()
    } catch (err) { notifyError(err?.message || 'Xóa loại ghế thất bại.') }
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        surchargeAmount: form.surchargeAmount,
        description: form.name
      }
      if (editItem) {
        const id = editItem._id || editItem.id
        await requestJson(`/seat-types/${id}`, { 
          method: 'PUT',
          body: JSON.stringify(payload)
        })
        notifySuccess('Cập nhật loại ghế thành công.')
      } else {
        await requestJson('/seat-types', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        notifySuccess('Tạo loại ghế thành công.')
      }
      setShowModal(false)
      load()
    } catch (err) {
      const msg = err?.message || 'Có lỗi xảy ra.'
      setError(msg)
      notifyError(msg)
    } finally { setSaving(false) }
  }

  return (
    <section className="container-fluid px-2 px-md-3 px-xl-4 d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
      <div className="card border-0 shadow-sm d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
        <div className="card-body p-3 p-md-4 d-flex flex-column" style={{ minHeight: 0 }}>


          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
            <div>
              <h2 className="h4 mb-1">Quản lý loại ghế</h2>
              <p className="text-secondary mb-0">Cấu hình giá phụ thu cho từng loại ghế.</p>
            </div>
            <button className="btn btn-primary" onClick={openCreate}>💺 Thêm Loại Ghế</button>
          </div>


          <div className="card border-light-subtle mb-3">
            <div className="card-body">
              <div className="row g-2">
                <div className="col-12 col-md-6 col-xl-4">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tìm theo tên loại ghế..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(0) }}
                  />
                </div>
                <div className="col-12 col-md-2">
                  <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setPage(0) }}>
                    Làm mới
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loadError && <div className="alert alert-danger py-2 px-3">{loadError}</div>}


          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          ) : (
            <div className="table-responsive border rounded-3 bg-white flex-grow-1 overflow-auto" ref={containerRef}>
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 60 }}>STT</th>
                    <th>Tên Loại Ghế</th>
                    <th>Phụ Thu (đ)</th>
                    <th className="text-end">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 && <tr><td colSpan={4} className="text-center py-4 text-secondary">Không tìm thấy loại ghế nào.</td></tr>}
                  {paginated.map((item, idx) => (
                    <tr key={item._id}>
                      <td className="text-center">{page * pageSize + idx + 1}</td>
                      <td>
                        <span className={`badge ${item.name === 'STANDARD' ? 'bg-secondary' : item.name === 'VIP' ? 'bg-warning text-dark' : 'bg-primary'}`}>
                          {item.name === 'STANDARD' ? 'Thường' : item.name === 'VIP' ? 'VIP' : item.name === 'SWEETBOX' ? 'Ghế đôi' : item.name}
                        </span>
                      </td>
                      <td className="text-success fw-medium">+{Number(item.surchargeAmount ?? item.surcharge ?? 0).toLocaleString()}đ</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(item)}>Sửa</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item)}>
                          Xóa
                        </button>
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
                <h5 className="modal-title">{editItem ? 'Sửa Loại Ghế' : 'Thêm Loại Ghế'}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger py-2">{error}</div>}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Tên Loại Ghế <span className="text-danger">*</span></label>
                  <input className="form-control"
                    placeholder="Ví dụ: STANDARD, VIP, SWEETBOX"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Giá Phụ Thu (đ)</label>
                  <input type="number" min={0} className="form-control"
                    placeholder="Ví dụ: 30000"
                    value={form.surchargeAmount}
                    onChange={e => setForm(p => ({ ...p, surchargeAmount: Number(e.target.value) }))} />
                  <div className="form-text">Số tiền cộng thêm vào giá vé cơ bản cho loại ghế này.</div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || !form.name}>
                  {saving ? 'Đang Lưu...' : editItem ? 'Cập Nhật' : 'Thêm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
