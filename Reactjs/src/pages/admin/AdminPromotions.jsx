import { useCallback, useEffect, useState, useMemo } from 'react'
import { getPromotions, createPromotion, updatePromotion, deletePromotion } from '../../services/promotion.api'
import { notifyError, notifySuccess } from '../../util/notify'
import ImageUploadField from '../../components/layout/ImageUploadField'

const DISCOUNT_TYPE_OPTIONS = [
  { value: 'PERCENT', label: 'Phần trăm (%)' },
  { value: 'AMOUNT', label: 'Số tiền cố định (đ)' },
]

const EMPTY_FORM = {
  name: '',
  description: '',
  code: '',
  discountType: 'PERCENT',
  discountValue: '',
  maxDiscountAmount: '',
  minOrderValue: '',
  minTicketRequired: '',
  quantity: '',
  startDate: '',
  endDate: '',
  imageUrl: '',
  isActive: true,
}

const PAGE_SIZE = 8

function formatDate(val) {
  if (!val) return '-'
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return d.toLocaleDateString('vi-VN')
}

function formatPrice(val) {
  if (val == null || val === '') return '-'
  return Number(val).toLocaleString('vi-VN') + 'đ'
}

function toInputDate(val) {
  if (!val) return ''
  const d = new Date(val)
  if (isNaN(d.getTime())) return ''
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function normalizeForSearch(v) {
  return String(v || '').trim().toLowerCase()
}

function getPromoStatus(item) {
  const now = new Date()
  const start = new Date(item.startDate)
  const end = new Date(item.endDate)
  if (!item.isActive) return { label: 'Đã tắt', color: 'text-bg-secondary' }
  if (now < start) return { label: 'Sắp diễn ra', color: 'text-bg-warning' }
  if (now > end) return { label: 'Hết hạn', color: 'text-bg-danger' }
  return { label: 'Đang diễn ra', color: 'text-bg-success' }
}

function AdminPromotions() {
  const [allPromotions, setAllPromotions] = useState([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [inputKeyword, setInputKeyword] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchPromotions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getPromotions()
      const items = Array.isArray(data)
        ? data
        : data?.currentItems ?? data?.items ?? []
      setAllPromotions(items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)))
    } catch (err) {
      setError(err?.message ?? 'Không thể tải danh sách khuyến mãi.')
      setAllPromotions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPromotions() }, [fetchPromotions])

  const normalizedKw = normalizeForSearch(keyword)

  const filteredPromotions = useMemo(() => {
    return allPromotions.filter((p) => {
      const matchKw = !normalizedKw
        || normalizeForSearch(p.name).includes(normalizedKw)
        || normalizeForSearch(p.code).includes(normalizedKw)
        || normalizeForSearch(p.description).includes(normalizedKw)
      const matchType = !filterType || p.discountType === filterType
      const status = getPromoStatus(p).label
      const matchStatus = !filterStatus || status === filterStatus
      return matchKw && matchType && matchStatus
    })
  }, [allPromotions, normalizedKw, filterType, filterStatus])

  const totalPages = Math.max(Math.ceil(filteredPromotions.length / PAGE_SIZE), 1)

  const paginatedPromotions = useMemo(() => {
    const start = page * PAGE_SIZE
    return filteredPromotions.slice(start, start + PAGE_SIZE)
  }, [filteredPromotions, page])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setViewItem(null)
    setShowModal(true)
  }

  const openEdit = (item) => {
    const id = item?._id ?? item?.id
    setEditingId(id)
    setForm({
      name: item.name ?? '',
      description: item.description ?? '',
      code: item.code ?? '',
      discountType: item.discountType ?? 'PERCENT',
      discountValue: item.discountValue ?? '',
      maxDiscountAmount: item.maxDiscountAmount ?? '',
      minOrderValue: item.minOrderValue ?? '',
      minTicketRequired: item.minTicketRequired ?? '',
      quantity: item.quantity ?? '',
      startDate: toInputDate(item.startDate),
      endDate: toInputDate(item.endDate),
      imageUrl: item.imageUrl ?? '',
      isActive: item.isActive ?? true,
    })
    setFormError('')
    setViewItem(null)
    setShowModal(true)
  }

  const openView = (item) => {
    setViewItem(item)
    setShowModal(false)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError('')
  }

  const closeView = () => setViewItem(null)

  const handleInput = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setFormError('')

    const name = form.name.trim()
    const code = form.code.trim().toUpperCase()
    if (!name) { setFormError('Tên khuyến mãi không được để trống.'); return }
    if (!code) { setFormError('Mã khuyến mãi không được để trống.'); return }
    if (!form.discountValue || Number(form.discountValue) <= 0) { setFormError('Giá trị giảm phải lớn hơn 0.'); return }
    if (!form.startDate) { setFormError('Ngày bắt đầu không được để trống.'); return }
    if (!form.endDate) { setFormError('Ngày kết thúc không được để trống.'); return }
    if (new Date(form.startDate) >= new Date(form.endDate)) { setFormError('Ngày kết thúc phải sau ngày bắt đầu.'); return }
    if (!form.quantity || Number(form.quantity) < 0) { setFormError('Số lượng phải >= 0.'); return }

    setSaving(true)
    try {
      const payload = {
        name,
        description: form.description.trim(),
        code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxDiscountAmount: form.maxDiscountAmount !== '' ? Number(form.maxDiscountAmount) : undefined,
        minOrderValue: form.minOrderValue !== '' ? Number(form.minOrderValue) : 0,
        minTicketRequired: form.minTicketRequired !== '' ? Number(form.minTicketRequired) : 0,
        quantity: Number(form.quantity),
        startDate: form.startDate,
        endDate: form.endDate,
        imageUrl: form.imageUrl.trim(),
        isActive: form.isActive,
      }

      if (editingId) {
        const res = await updatePromotion(editingId, payload)
        notifySuccess(res?.message ?? 'Cập nhật khuyến mãi thành công.')
      } else {
        const res = await createPromotion(payload)
        notifySuccess(res?.message ?? 'Thêm khuyến mãi thành công.')
      }
      closeModal()
      fetchPromotions()
    } catch (err) {
      const msg = err?.message ?? 'Lưu khuyến mãi thất bại.'
      setFormError(msg)
      notifyError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    const id = item?._id ?? item?.id
    if (!id) return
    if (!window.confirm(`Xoá khuyến mãi "${item.name}" (${item.code})?`)) return
    setDeletingId(id)
    try {
      const res = await deletePromotion(id)
      notifySuccess(res?.message ?? 'Xoá khuyến mãi thành công.')
      fetchPromotions()
    } catch (err) {
      notifyError(err?.message ?? 'Xoá khuyến mãi thất bại.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setKeyword(inputKeyword.trim())
    setPage(0)
  }

  const handleReset = () => {
    setInputKeyword(''); setKeyword('')
    setFilterType(''); setFilterStatus('')
    setPage(0)
  }

  const STATUS_OPTIONS = ['Đang diễn ra', 'Sắp diễn ra', 'Hết hạn', 'Đã tắt']

  return (
    <section className="container-fluid px-2 px-md-3 px-xl-4 d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
      <div className="card border-0 shadow-sm d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
        <div className="card-body p-3 p-md-4 d-flex flex-column" style={{ minHeight: 0 }}>

          {/* Header */}
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
            <div>
              <h2 className="h4 mb-1">🎁 Quản lý Khuyến mãi</h2>
              <p className="text-secondary mb-0">Tổng: {allPromotions.length} khuyến mãi · Đang hiển thị: {filteredPromotions.length}</p>
            </div>
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              + Thêm khuyến mãi
            </button>
          </div>

          {/* Filter */}
          <form className="row g-2 mb-3" onSubmit={handleSearch}>
            <div className="col-12 col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Tìm theo tên, mã khuyến mãi..."
                value={inputKeyword}
                onChange={(e) => setInputKeyword(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-3">
              <select
                className="form-select"
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setPage(0) }}
              >
                <option value="">Tất cả loại giảm</option>
                {DISCOUNT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-2">
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(0) }}
              >
                <option value="">Tất cả trạng thái</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-auto d-flex gap-2">
              <button type="submit" className="btn btn-outline-primary" disabled={loading}>
                {loading ? 'Đang tìm...' : 'Tìm kiếm'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleReset}
                disabled={loading || (!keyword && !inputKeyword && !filterType && !filterStatus)}
              >
                Làm mới
              </button>
            </div>
          </form>

          {error && <div className="alert alert-danger py-2 px-3">{error}</div>}

          {/* Table */}
          <div className="table-responsive border rounded-3 bg-white flex-grow-1 overflow-auto">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light sticky-top">
                <tr>
                  <th style={{ width: 48 }}>STT</th>
                  <th>Tên / Mã</th>
                  <th>Loại giảm</th>
                  <th>Giá trị</th>
                  <th>SL còn</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th className="text-end" style={{ minWidth: 160 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="text-center text-secondary py-5">
                      <div className="spinner-border spinner-border-sm me-2" />Đang tải...
                    </td>
                  </tr>
                )}
                {!loading && paginatedPromotions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-secondary py-5">
                      {keyword || filterType || filterStatus ? 'Không tìm thấy khuyến mãi phù hợp.' : 'Chưa có khuyến mãi nào.'}
                    </td>
                  </tr>
                )}
                {paginatedPromotions.map((item, idx) => {
                  const id = item?._id ?? item?.id
                  const status = getPromoStatus(item)
                  const discountLabel = item.discountType === 'PERCENT'
                    ? `${item.discountValue}%`
                    : formatPrice(item.discountValue)
                  return (
                    <tr key={id}>
                      <td className="text-center text-secondary">{page * PAGE_SIZE + idx + 1}</td>
                      <td>
                        <div className="fw-semibold">{item.name}</div>
                        <code className="small text-primary bg-primary-subtle px-1 rounded">{item.code}</code>
                      </td>
                      <td>
                        <span className={`badge ${item.discountType === 'PERCENT' ? 'text-bg-info' : 'text-bg-warning'}`}>
                          {item.discountType === 'PERCENT' ? '%' : 'đ'}
                        </span>
                      </td>
                      <td className="fw-semibold text-danger">{discountLabel}</td>
                      <td>{item.quantity}</td>
                      <td>
                        <div className="small text-secondary">
                          <div>Từ: {formatDate(item.startDate)}</div>
                          <div>Đến: {formatDate(item.endDate)}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${status.color}`}>{status.label}</span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-info me-1"
                          onClick={() => openView(item)}
                          title="Xem chi tiết"
                        >👁️</button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => openEdit(item)}
                          title="Sửa"
                        >✏️</button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === id}
                          title="Xoá"
                        >{deletingId === id ? '...' : '🗑️'}</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages >= 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-secondary small">
                Trang {page + 1} / {totalPages} · {filteredPromotions.length} khuyến mãi
              </span>
              <div className="d-flex gap-1">
                <button className="btn btn-outline-secondary btn-sm" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>‹ Trước</button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const pageNum = totalPages <= 7 ? i : (page <= 3 ? i : (page >= totalPages - 4 ? totalPages - 7 + i : page - 3 + i))
                  return (
                    <button
                      key={pageNum}
                      className={`btn btn-sm ${page === pageNum ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setPage(pageNum)}
                    >{pageNum + 1}</button>
                  )
                })}
                <button className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Sau ›</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div
          className="modal d-block"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  {editingId ? '✏️ Sửa khuyến mãi' : '+ Thêm khuyến mãi mới'}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal} />
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body pt-3" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Tên khuyến mãi <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        maxLength={255}
                        value={form.name}
                        onChange={handleInput('name')}
                        placeholder="Vd: Khuyến mãi hè 2025"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Mã khuyến mãi <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        maxLength={100}
                        value={form.code}
                        onChange={handleInput('code')}
                        placeholder="Vd: SUMMER25"
                        style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Số lượng mã <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        min={0}
                        className="form-control"
                        value={form.quantity}
                        onChange={handleInput('quantity')}
                        placeholder="Vd: 100"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Loại giảm giá <span className="text-danger">*</span></label>
                      <select className="form-select" value={form.discountType} onChange={handleInput('discountType')}>
                        {DISCOUNT_TYPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Giá trị giảm {form.discountType === 'PERCENT' ? '(%)' : '(VNĐ)'}
                        <span className="text-danger"> *</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={form.discountType === 'PERCENT' ? 100 : undefined}
                        className="form-control"
                        value={form.discountValue}
                        onChange={handleInput('discountValue')}
                        placeholder={form.discountType === 'PERCENT' ? 'Vd: 20' : 'Vd: 50000'}
                        required
                      />
                    </div>
                    {form.discountType === 'PERCENT' && (
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Giảm tối đa (VNĐ)</label>
                        <input
                          type="number"
                          min={0}
                          className="form-control"
                          value={form.maxDiscountAmount}
                          onChange={handleInput('maxDiscountAmount')}
                          placeholder="Vd: 100000 (để trống = không giới hạn)"
                        />
                      </div>
                    )}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Giá trị đơn tối thiểu (VNĐ)</label>
                      <input
                        type="number"
                        min={0}
                        className="form-control"
                        value={form.minOrderValue}
                        onChange={handleInput('minOrderValue')}
                        placeholder="Vd: 100000 (0 = không giới hạn)"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Số vé tối thiểu</label>
                      <input
                        type="number"
                        min={0}
                        className="form-control"
                        value={form.minTicketRequired}
                        onChange={handleInput('minTicketRequired')}
                        placeholder="Vd: 2 (0 = không giới hạn)"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Ngày bắt đầu <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.startDate}
                        onChange={handleInput('startDate')}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Ngày kết thúc <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.endDate}
                        onChange={handleInput('endDate')}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Mô tả</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        maxLength={1000}
                        value={form.description}
                        onChange={handleInput('description')}
                        placeholder="Mô tả ngắn về chương trình..."
                      />
                    </div>
                    <div className="col-12">
                      <ImageUploadField
                        label="Hình ảnh khuyến mãi"
                        value={form.imageUrl}
                        onChange={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
                        placeholder="https://..."
                        previewHeight={100}
                      />
                    </div>
                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="promo-isActive"
                          checked={form.isActive}
                          onChange={handleInput('isActive')}
                        />
                        <label className="form-check-label" htmlFor="promo-isActive">
                          Kích hoạt khuyến mãi
                        </label>
                      </div>
                    </div>
                  </div>
                  {formError && (
                    <div className="alert alert-danger py-2 px-3 small mt-3 mb-0">{formError}</div>
                  )}
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Huỷ</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <><span className="spinner-border spinner-border-sm me-1" />Đang lưu...</> : (editingId ? 'Cập nhật' : 'Thêm khuyến mãi')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal View */}
      {viewItem && (
        <div
          className="modal d-block"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
          onClick={(e) => e.target === e.currentTarget && closeView()}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">👁️ Chi tiết khuyến mãi</h5>
                <button type="button" className="btn-close" onClick={closeView} />
              </div>
              <div className="modal-body">
                {viewItem.imageUrl && (
                  <img
                    src={viewItem.imageUrl}
                    alt={viewItem.name}
                    className="w-100 rounded mb-3"
                    style={{ maxHeight: 200, objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                )}
                <div className="row g-2">
                  <div className="col-md-6">
                    <table className="table table-bordered table-sm">
                      <tbody>
                        <tr><th>Tên</th><td className="fw-semibold">{viewItem.name}</td></tr>
                        <tr><th>Mã</th><td><code className="text-primary">{viewItem.code}</code></td></tr>
                        <tr><th>Loại giảm</th><td>{viewItem.discountType === 'PERCENT' ? 'Phần trăm' : 'Số tiền cố định'}</td></tr>
                        <tr><th>Giá trị</th><td className="text-danger fw-bold">{viewItem.discountType === 'PERCENT' ? `${viewItem.discountValue}%` : formatPrice(viewItem.discountValue)}</td></tr>
                        {viewItem.maxDiscountAmount > 0 && <tr><th>Giảm tối đa</th><td>{formatPrice(viewItem.maxDiscountAmount)}</td></tr>}
                        <tr><th>Trạng thái</th><td><span className={`badge ${getPromoStatus(viewItem).color}`}>{getPromoStatus(viewItem).label}</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <table className="table table-bordered table-sm">
                      <tbody>
                        <tr><th>Số lượng</th><td>{viewItem.quantity}</td></tr>
                        <tr><th>ĐH tối thiểu</th><td>{viewItem.minOrderValue > 0 ? formatPrice(viewItem.minOrderValue) : 'Không giới hạn'}</td></tr>
                        <tr><th>Vé tối thiểu</th><td>{viewItem.minTicketRequired > 0 ? `${viewItem.minTicketRequired} vé` : 'Không giới hạn'}</td></tr>
                        <tr><th>Bắt đầu</th><td>{formatDate(viewItem.startDate)}</td></tr>
                        <tr><th>Kết thúc</th><td>{formatDate(viewItem.endDate)}</td></tr>
                        <tr><th>Ngày tạo</th><td>{viewItem.createdAt ? new Date(viewItem.createdAt).toLocaleString('vi-VN') : '-'}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  {viewItem.description && (
                    <div className="col-12">
                      <div className="p-3 bg-light rounded small">{viewItem.description}</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-outline-primary" onClick={() => { closeView(); openEdit(viewItem) }}>✏️ Sửa</button>
                <button type="button" className="btn btn-secondary" onClick={closeView}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminPromotions
