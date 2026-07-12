import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import { getServices, createService, updateService, deleteService } from '../../services/service.api'
import { notifyError, notifySuccess } from '../../util/notify'
import ImageUploadField from '../../components/layout/ImageUploadField'

const CATEGORY_OPTIONS = ['Bắp rang', 'Nước uống', 'Combo', 'Snack', 'Khác']

const EMPTY_FORM = {
  name: '',
  description: '',
  unitPrice: '',
  category: '',
  imageUrl: '',
  isActive: true,
}

const PAGE_SIZE = 8

function formatPrice(value) {
  if (value == null || value === '') return '-'
  return Number(value).toLocaleString('vi-VN') + 'đ'
}

function normalizeForSearch(value) {
  return String(value || '').trim().toLowerCase()
}

function AdminServices() {
  const [allServices, setAllServices] = useState([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [inputKeyword, setInputKeyword] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterActive, setFilterActive] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const containerRef = useRef(null)

  const fetchServices = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getServices()
      const items = Array.isArray(data)
        ? data
        : data?.currentItems ?? data?.items ?? []
      setAllServices(items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)))
    } catch (err) {
      setError(err?.message ?? 'Không thể tải danh sách dịch vụ.')
      setAllServices([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const normalizedKw = normalizeForSearch(keyword)

  const filteredServices = useMemo(() => {
    return allServices.filter((s) => {
      const matchKw = !normalizedKw
        || normalizeForSearch(s.name).includes(normalizedKw)
        || normalizeForSearch(s.category).includes(normalizedKw)
        || normalizeForSearch(s.description).includes(normalizedKw)
      const matchCat = !filterCategory || s.category === filterCategory
      const matchActive =
        filterActive === '' ? true :
        filterActive === 'true' ? s.isActive === true :
        s.isActive === false
      return matchKw && matchCat && matchActive
    })
  }, [allServices, normalizedKw, filterCategory, filterActive])

  const totalPages = Math.max(Math.ceil(filteredServices.length / PAGE_SIZE), 1)

  const paginatedServices = useMemo(() => {
    const start = page * PAGE_SIZE
    return filteredServices.slice(start, start + PAGE_SIZE)
  }, [filteredServices, page])

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
      unitPrice: item.unitPrice ?? '',
      category: item.category ?? '',
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
    if (!name) { setFormError('Tên dịch vụ không được để trống.'); return }
    if (!form.unitPrice || Number(form.unitPrice) < 0) { setFormError('Đơn giá phải lớn hơn hoặc bằng 0.'); return }
    if (!form.category.trim()) { setFormError('Danh mục không được để trống.'); return }

    setSaving(true)
    try {
      const payload = {
        name,
        description: form.description.trim(),
        unitPrice: Number(form.unitPrice),
        category: form.category.trim(),
        imageUrl: form.imageUrl.trim(),
        isActive: form.isActive,
      }

      if (editingId) {
        const res = await updateService(editingId, payload)
        notifySuccess(res?.message ?? 'Cập nhật dịch vụ thành công.')
      } else {
        const res = await createService(payload)
        notifySuccess(res?.message ?? 'Thêm dịch vụ thành công.')
      }
      closeModal()
      fetchServices()
    } catch (err) {
      const msg = err?.message ?? 'Lưu dịch vụ thất bại.'
      setFormError(msg)
      notifyError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    const id = item?._id ?? item?.id
    if (!id) return
    if (!window.confirm(`Xoá dịch vụ "${item.name}"?`)) return
    setDeletingId(id)
    try {
      const res = await deleteService(id)
      notifySuccess(res?.message ?? 'Xoá dịch vụ thành công.')
      fetchServices()
    } catch (err) {
      notifyError(err?.message ?? 'Xoá dịch vụ thất bại.')
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
    setFilterCategory(''); setFilterActive('')
    setPage(0)
  }

  return (
    <section className="container-fluid px-2 px-md-3 px-xl-4 d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
      <div className="card border-0 shadow-sm d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
        <div className="card-body p-3 p-md-4 d-flex flex-column" style={{ minHeight: 0 }}>

          {/* Header */}
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
            <div>
              <h2 className="h4 mb-1">🍿 Quản lý Dịch vụ</h2>
              <p className="text-secondary mb-0">Tổng: {allServices.length} dịch vụ · Đang hiển thị: {filteredServices.length}</p>
            </div>
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              + Thêm dịch vụ
            </button>
          </div>

          {/* Filter */}
          <form className="row g-2 mb-3" onSubmit={handleSearch}>
            <div className="col-12 col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Tìm theo tên, danh mục, mô tả..."
                value={inputKeyword}
                onChange={(e) => setInputKeyword(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-3">
              <select
                className="form-select"
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setPage(0) }}
              >
                <option value="">Tất cả danh mục</option>
                {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div className="col-12 col-md-2">
              <select
                className="form-select"
                value={filterActive}
                onChange={(e) => { setFilterActive(e.target.value); setPage(0) }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="true">Đang hoạt động</option>
                <option value="false">Ngừng hoạt động</option>
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
                disabled={loading || (!keyword && !inputKeyword && !filterCategory && filterActive === '')}
              >
                Làm mới
              </button>
            </div>
          </form>

          {error && <div className="alert alert-danger py-2 px-3">{error}</div>}

          {/* Table */}
          <div className="table-responsive border rounded-3 bg-white flex-grow-1 overflow-auto" ref={containerRef}>
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light sticky-top">
                <tr>
                  <th style={{ width: 48 }}>STT</th>
                  <th style={{ width: 72 }}>Ảnh</th>
                  <th>Tên dịch vụ</th>
                  <th>Danh mục</th>
                  <th>Đơn giá</th>
                  <th>Trạng thái</th>
                  <th className="text-end" style={{ minWidth: 160 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="text-center text-secondary py-5">
                      <div className="spinner-border spinner-border-sm me-2" />
                      Đang tải...
                    </td>
                  </tr>
                )}
                {!loading && paginatedServices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-secondary py-5">
                      {keyword || filterCategory || filterActive !== '' ? 'Không tìm thấy dịch vụ phù hợp.' : 'Chưa có dịch vụ nào.'}
                    </td>
                  </tr>
                )}
                {paginatedServices.map((item, idx) => {
                  const id = item?._id ?? item?.id
                  return (
                    <tr key={id}>
                      <td className="text-center text-secondary">{page * PAGE_SIZE + idx + 1}</td>
                      <td>
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="rounded"
                            style={{ width: 48, height: 48, objectFit: 'cover' }}
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        ) : (
                          <div
                            className="rounded bg-secondary-subtle d-flex align-items-center justify-content-center text-secondary"
                            style={{ width: 48, height: 48, fontSize: 20 }}
                          >🍿</div>
                        )}
                      </td>
                      <td>
                        <div className="fw-semibold">{item.name}</div>
                        {item.description && (
                          <small className="text-secondary text-truncate d-block" style={{ maxWidth: 220 }}>{item.description}</small>
                        )}
                      </td>
                      <td><span className="badge text-bg-secondary">{item.category || '-'}</span></td>
                      <td className="fw-semibold text-success">{formatPrice(item.unitPrice)}</td>
                      <td>
                        <span className={`badge ${item.isActive ? 'text-bg-success' : 'text-bg-danger'}`}>
                          {item.isActive ? 'Hoạt động' : 'Ngừng'}
                        </span>
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
                Trang {page + 1} / {totalPages} · {filteredServices.length} dịch vụ
              </span>
              <div className="d-flex gap-1">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => p - 1)}
                >‹ Trước</button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`btn btn-sm ${page === i ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setPage(i)}
                    disabled={totalPages > 7 && Math.abs(i - page) > 2 && i !== 0 && i !== totalPages - 1}
                  >
                    {totalPages <= 7 ? i + 1 : (Math.abs(i - page) <= 2 || i === 0 || i === totalPages - 1) ? i + 1 : (i === 1 && page > 3) || (i === totalPages - 2 && page < totalPages - 4) ? '…' : null}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >Sau ›</button>
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
                  {editingId ? '✏️ Sửa dịch vụ' : '+ Thêm dịch vụ mới'}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal} />
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body pt-3" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Tên dịch vụ <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        maxLength={255}
                        value={form.name}
                        onChange={handleInput('name')}
                        placeholder="Vd: Bắp rang bơ lớn"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Danh mục <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={form.category}
                        onChange={handleInput('category')}
                        required
                      >
                        <option value="">-- Chọn danh mục --</option>
                        {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Đơn giá (VNĐ) <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        min={0}
                        value={form.unitPrice}
                        onChange={handleInput('unitPrice')}
                        placeholder="Vd: 50000"
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Mô tả</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        maxLength={1000}
                        value={form.description}
                        onChange={handleInput('description')}
                        placeholder="Mô tả ngắn về dịch vụ..."
                      />
                    </div>
                    <div className="col-12">
                      <ImageUploadField
                        label="Hình ảnh"
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
                          id="service-isActive"
                          checked={form.isActive}
                          onChange={handleInput('isActive')}
                        />
                        <label className="form-check-label" htmlFor="service-isActive">
                          Đang hoạt động
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
                    {saving ? <><span className="spinner-border spinner-border-sm me-1" />Đang lưu...</> : (editingId ? 'Cập nhật' : 'Thêm dịch vụ')}
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
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">👁️ Chi tiết dịch vụ</h5>
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
                <table className="table table-bordered table-sm">
                  <tbody>
                    <tr><th>Tên dịch vụ</th><td className="fw-semibold">{viewItem.name}</td></tr>
                    <tr><th>Danh mục</th><td><span className="badge text-bg-secondary">{viewItem.category}</span></td></tr>
                    <tr><th>Đơn giá</th><td className="text-success fw-bold">{formatPrice(viewItem.unitPrice)}</td></tr>
                    <tr><th>Trạng thái</th><td><span className={`badge ${viewItem.isActive ? 'text-bg-success' : 'text-bg-danger'}`}>{viewItem.isActive ? 'Hoạt động' : 'Ngừng'}</span></td></tr>
                    <tr><th>Mô tả</th><td>{viewItem.description || <span className="text-secondary">Không có</span>}</td></tr>
                    <tr><th>Ngày tạo</th><td>{viewItem.createdAt ? new Date(viewItem.createdAt).toLocaleString('vi-VN') : '-'}</td></tr>
                    <tr><th>Cập nhật</th><td>{viewItem.updatedAt ? new Date(viewItem.updatedAt).toLocaleString('vi-VN') : '-'}</td></tr>
                  </tbody>
                </table>
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

export default AdminServices
