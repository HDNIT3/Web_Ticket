import { useEffect, useMemo, useState } from 'react'
import { getServices } from '../services/service.api.js'

function getServiceId(service) {
  return service?._id || service?.id
}

function formatCurrency(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 'Đang cập nhật'

  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number)
}

function buildPaginationItems(currentPage, totalPage) {
  const maxButtons = 5

  if (totalPage <= maxButtons) {
    return Array.from({ length: totalPage }, (_, index) => index + 1)
  }

  const halfWindow = Math.floor(maxButtons / 2)
  let startPage = currentPage - halfWindow
  let endPage = currentPage + halfWindow

  if (startPage < 1) {
    startPage = 1
    endPage = maxButtons
  }

  if (endPage > totalPage) {
    endPage = totalPage
    startPage = totalPage - maxButtons + 1
  }

  return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index)
}

function ServiceCard({ service }) {
  const imageUrl = service.imageUrl || 'https://images.unsplash.com/photo-1514302238422-f93a8d0b8f74?auto=format&fit=crop&w=1200&q=80'

  return (
    <article className="catalog-card service-card">
      <div className="catalog-card__media">
        <img src={imageUrl} alt={service.name} />
        <span className={`catalog-badge ${service.isActive ? 'catalog-badge--success' : 'catalog-badge--muted'}`}>
          {service.isActive ? 'Đang mở' : 'Tạm ngưng'}
        </span>
      </div>

      <div className="catalog-card__body">
        <div className="catalog-card__header">
          <div>
            <p className="catalog-card__eyebrow">{service.category || 'SERVICE'}</p>
            <h3>{service.name}</h3>
          </div>
          <strong className="catalog-card__price">{formatCurrency(service.unitPrice)}</strong>
        </div>

        <p className="catalog-card__description">{service.description || 'Chưa có mô tả cho dịch vụ này.'}</p>

        <div className="catalog-card__meta">
          <span>Danh mục: {service.category || 'Đang cập nhật'}</span>
        </div>
      </div>
    </article>
  )
}

export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [pagination, setPagination] = useState({ currentPage: 1, totalPage: 1 })
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const queryParams = useMemo(() => ({
    page,
    limit: 9,
    q: searchTerm.trim() || undefined,
  }), [page, searchTerm])

  useEffect(() => {
    let alive = true

    const loadServices = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const result = await getServices(queryParams)
        if (!alive) return

        const items = Array.isArray(result?.items) ? result.items : []
        setServices(items)
        setPagination({
          currentPage: result?.pagination?.page || 1,
          totalPage: result?.pagination?.totalPages || 1,
        })
      } catch (error) {
        if (!alive) return

        console.error('Lỗi tải dịch vụ:', error)
        setServices([])
        setPagination({ currentPage: 1, totalPage: 1 })
        setErrorMessage(error.message || 'Không thể tải danh sách dịch vụ.')
      } finally {
        if (alive) {
          setIsLoading(false)
        }
      }
    }

    loadServices()

    return () => {
      alive = false
    }
  }, [queryParams])

  const pageItems = buildPaginationItems(pagination.currentPage, pagination.totalPage)

  return (
    <section className="simple-page container-fluid px-3 px-lg-4">
      <div className="simple-page__hero">
        <div>
          <p className="eyebrow">Services</p>
          <h1>Dịch vụ rạp chiếu</h1>
          <p>Xem các dịch vụ đang có trên hệ thống như đồ ăn, combo, phòng chờ và tiện ích khác.</p>
        </div>

        <div className="catalog-toolbar">
          <label className="catalog-search">
            <span>Tìm dịch vụ</span>
            <input
              type="search"
              className="catalog-search__input"
              placeholder="Tìm theo tên, danh mục, mô tả..."
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value)
                setPage(1)
              }}
            />
          </label>
        </div>
      </div>

      {errorMessage ? <div className="alert alert-warning alert-modern mt-3 mb-0">{errorMessage}</div> : null}

      <div className="catalog-grid mt-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <article key={index} className="catalog-card catalog-card--placeholder">
                <div className="catalog-card__media catalog-card__media--placeholder" />
                <div className="catalog-card__body">
                  <div className="placeholder-line placeholder-line--title" />
                  <div className="placeholder-line" />
                  <div className="placeholder-line placeholder-line--short" />
                </div>
              </article>
            ))
          : services.map((service) => <ServiceCard key={getServiceId(service)} service={service} />)}
      </div>

      {!isLoading && services.length === 0 ? (
        <div className="catalog-empty mt-3">
          <strong>Chưa có dịch vụ nào</strong>
          <p>Hãy thêm dữ liệu bên backend hoặc thử bỏ từ khóa tìm kiếm.</p>
        </div>
      ) : null}

      {!isLoading && services.length > 0 ? (
        <div className="movie-pagination mt-4">
          <button
            type="button"
            className="btn btn-outline-light btn-hero-secondary"
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            disabled={pagination.currentPage <= 1}
          >
            ‹
          </button>

          <div className="movie-pagination__pages">
            {pageItems.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`movie-pagination__page ${pageNumber === pagination.currentPage ? 'movie-pagination__page--active' : ''}`}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-outline-light btn-hero-secondary"
            onClick={() => setPage((current) => Math.min(current + 1, pagination.totalPage))}
            disabled={pagination.currentPage >= pagination.totalPage}
          >
            ›
          </button>
        </div>
      ) : null}
    </section>
  )
}