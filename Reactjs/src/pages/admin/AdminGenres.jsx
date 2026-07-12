import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import { getGenres, createGenre, updateGenre, deleteGenre } from '../../services/movie.api'
import { notifyError, notifySuccess } from '../../util/notify'



const EMPTY_FORM = {
  name: '',
}

function normalizeForSearch(value) {
  return String(value || '').trim().toLowerCase()
}

function AdminGenres() {
  const [allGenres, setAllGenres] = useState([])
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [inputKeyword, setInputKeyword] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchGenres = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getGenres()
      setAllGenres(Array.isArray(data) ? data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)) : [])
    } catch (err) {
      setError(err?.message ?? 'Không thể tải danh sách thể loại.')
      setAllGenres([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGenres()
  }, [fetchGenres])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (genre) => {
    const id = genre?._id ?? genre?.id
    if (!id) return

    setEditingId(id)
    setForm({
      name: genre.name ?? '',
    })
    setFormError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError('')
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setFormError('')

    const name = String(form.name || '').trim()

    if (!name) {
      setFormError('Tên thể loại không được để trống.')
      return
    }

    setSaving(true)

    try {
      const payload = { name }

      if (editingId) {
        const res = await updateGenre(editingId, payload)

        setAllGenres(prev => prev.map(g => (g._id === editingId || g.id === editingId) ? { ...g, name: name } : g))
        notifySuccess(res?.message ?? 'Cập nhật thể loại thành công.')
      } else {
        const res = await createGenre(payload)

        await fetchGenres()
        notifySuccess(res?.message ?? 'Thêm thể loại thành công.')
      }

      closeModal()
    } catch (err) {
      const message = err?.message ?? 'Lưu thể loại thất bại.'
      setFormError(message)
      notifyError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (genre) => {
    const id = genre?._id ?? genre?.id
    if (!id) return

    const confirmed = window.confirm(`Xoá thể loại "${genre.name}"?`)
    if (!confirmed) return

    setDeletingId(id)

    try {
      const res = await deleteGenre(id)
      setAllGenres(prev => prev.filter(g => g._id !== id && g.id !== id))
      notifySuccess(res?.message ?? 'Xoá thể loại thành công.')


      const filteredLeft = allGenres.filter(g => g._id !== id && g.id !== id).filter((g) => normalizeForSearch(g?.name).includes(normalizeForSearch(keyword)))
      const totalPagesLeft = Math.max(Math.ceil(filteredLeft.length / pageSize), 1)
      if (page >= totalPagesLeft) {
        setPage(Math.max(0, totalPagesLeft - 1))
      }
    } catch (err) {
      notifyError(err?.message ?? 'Xoá thể loại thất bại.')
    } finally {
      setDeletingId(null)
    }
  }

  const normalizedKeyword = normalizeForSearch(keyword)
  
  const filteredGenres = useMemo(() => {
    return normalizedKeyword
      ? allGenres.filter((genre) => normalizeForSearch(genre?.name).includes(normalizedKeyword))
      : allGenres
  }, [allGenres, normalizedKeyword])

  const totalPages = Math.max(Math.ceil(filteredGenres.length / pageSize), 1)
  const totalItems = filteredGenres.length

  const paginatedGenres = useMemo(() => {
    const start = page * pageSize
    return filteredGenres.slice(start, start + pageSize)
  }, [filteredGenres, page])


  const handleSearch = (event) => {
    event.preventDefault()
    const nextKeyword = inputKeyword.trim()
    setKeyword(nextKeyword)
    setPage(0)
  }

  const handleResetSearch = () => {
    setInputKeyword('')
    setKeyword('')
    setPage(0)
  }

  return (
    <section className="container-fluid px-2 px-md-3 px-xl-4 d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
      <div className="card border-0 shadow-sm d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
        <div className="card-body p-3 p-md-4 d-flex flex-column" style={{ minHeight: 0 }}>
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
            <div>
              <h2 className="h4 mb-1">Quản lý thể loại</h2>
              <p className="text-secondary mb-0">Tổng số thể loại trong hệ thống: {allGenres.length}</p>
            </div>
            <div className="d-flex gap-2">
              <a href={window.location.hash.startsWith('#/staff') ? '#/staff/movies' : '#/admin/movies'} className="btn btn-outline-secondary">
                🎬 Quản lý phim
              </a>
              <button type="button" className="btn btn-primary" onClick={openCreate}>
                📁 Thêm thể loại
              </button>
            </div>
          </div>

          <form className="row g-2 mb-3" onSubmit={handleSearch}>
            <div className="col-12 col-md-6 col-lg-5">
              <input
                type="text"
                className="form-control"
                placeholder="Tìm theo tên thể loại..."
                value={inputKeyword}
                onChange={(event) => setInputKeyword(event.target.value)}
              />
            </div>
            <div className="col-auto d-flex gap-2">
              <button type="submit" className="btn btn-outline-primary" disabled={loading}>
                {loading ? 'Đang tìm...' : 'Tìm kiếm'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleResetSearch}
                disabled={loading || (!keyword && !inputKeyword)}
              >
                Làm mới
              </button>
            </div>
          </form>

          {keyword && (
            <div className="small text-secondary mb-3">
              Kết quả cho "{keyword}": {totalItems} thể loại.
            </div>
          )}

          {error && <div className="alert alert-danger py-2 px-3">{error}</div>}

          <div className="table-responsive border rounded-3 bg-white flex-grow-1 overflow-auto" ref={containerRef}>
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 48 }}>STT</th>
                  <th>Tên thể loại</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={3} className="text-center text-secondary py-4">Đang tải...</td>
                  </tr>
                )}

                {!loading && paginatedGenres.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center text-secondary py-4">
                      {keyword ? 'Không tìm thấy thể loại phù hợp.' : 'Không có dữ liệu.'}
                    </td>
                  </tr>
                )}

                {paginatedGenres.map((genre, idx) => {
                  const id = genre?._id ?? genre?.id;
                  return (
                    <tr key={id}>
                      <td className="text-center">{page * pageSize + idx + 1}</td>
                      <td className="fw-semibold">{genre.name ?? '-'}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => openEdit(genre)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(genre)}
                          disabled={deletingId === id}
                        >
                          {deletingId === id ? '...' : 'Xoá'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {!loading && totalPages >= 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-secondary small">Trang {page + 1} / {totalPages}</span>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={loading || page <= 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  Trước
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={loading || page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div
          className="modal d-block"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={(event) => event.target === event.currentTarget && closeModal()}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingId ? 'Sửa thể loại' : 'Thêm thể loại'}</h5>
                <button type="button" className="btn-close" onClick={closeModal} />
              </div>

              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <label className="form-label">Tên thể loại *</label>
                  <input
                    type="text"
                    className="form-control"
                    maxLength={100}
                    value={form.name}
                    onChange={(event) => setForm({ name: event.target.value })}
                    required
                  />

                  {formError && (
                    <div className="alert alert-danger py-2 px-3 small mt-3 mb-0">
                      {formError}
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Huỷ
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm thể loại'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminGenres
