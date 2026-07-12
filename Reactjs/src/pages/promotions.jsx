import { useEffect, useMemo, useState } from 'react'
import { getPromotions } from '../services/promotion.api.js'

function getPromotionId(promotion) {
  return promotion?._id || promotion?.id
}

function formatDate(value) {
  if (!value) return 'Đang cập nhật'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Đang cập nhật'

  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function formatCurrency(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 'Đang cập nhật'

  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number)
}

function formatDiscount(promotion) {
  if (promotion.discountType === 'PERCENT') {
    return `${promotion.discountValue || 0}%`
  }

  return formatCurrency(promotion.discountValue)
}

function getDiscountLabel(promotion) {
  return promotion.discountType === 'PERCENT' ? 'Giảm %' : 'Giảm tiền'
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

function PromotionCard({ promotion }) {
  const imageUrl = promotion.imageUrl || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80'

  return (
    <article className="catalog-card promotion-card">
      <div className="catalog-card__media">
        <img src={imageUrl} alt={promotion.name} />
        <span className={`catalog-badge ${promotion.isActive ? 'catalog-badge--success' : 'catalog-badge--muted'}`}>
          {promotion.isActive ? 'Đang áp dụng' : 'Tạm ngưng'}
        </span>
      </div>

      <div className="catalog-card__body">
        <div className="catalog-card__header">
          <div>
            <p className="catalog-card__eyebrow">{promotion.code || 'PROMO'}</p>
            <h3>{promotion.name}</h3>
          </div>
          <strong className="catalog-card__price">{formatDiscount(promotion)}</strong>
        </div>

        <p className="catalog-card__description">{promotion.description || 'Chưa có mô tả cho ưu đãi này.'}</p>

        <div className="catalog-card__meta">
          <span>{getDiscountLabel(promotion)}</span>
          <span>{formatDate(promotion.startDate)} → {formatDate(promotion.endDate)}</span>
          <span>Số lượng: {promotion.quantity ?? 0}</span>
          {promotion.minOrderValue ? <span>Đơn tối thiểu: {formatCurrency(promotion.minOrderValue)}</span> : null}
          {promotion.minTicketRequired ? <span>Tối thiểu: {promotion.minTicketRequired} vé</span> : null}
        </div>
      </div>
    </article>
  )
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([])
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

    const loadPromotions = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const result = await getPromotions(queryParams)
        if (!alive) return

        const items = Array.isArray(result?.items) ? result.items : []
        setPromotions(items)
        setPagination({
          currentPage: result?.pagination?.page || 1,
          totalPage: result?.pagination?.totalPages || 1,
        })
      } catch (error) {
        if (!alive) return

        console.error('Lỗi tải khuyến mãi:', error)
        setPromotions([])
        setPagination({ currentPage: 1, totalPage: 1 })
        setErrorMessage(error.message || 'Không thể tải danh sách khuyến mãi.')
      } finally {
        if (alive) {
          setIsLoading(false)
        }
      }
    }

    loadPromotions()

    return () => {
      alive = false
    }
  }, [queryParams])

  const pageItems = buildPaginationItems(pagination.currentPage, pagination.totalPage)

  return (
    <section className="simple-page container-fluid px-3 px-lg-4">
      <div className="simple-page__hero">
        <div>
          <p className="eyebrow">Promotions</p>
          <h1>Ưu đãi và khuyến mãi</h1>
          <p>Xem toàn bộ khuyến mãi đang có trên hệ thống, lấy trực tiếp từ backend.</p>
        </div>

        <div className="catalog-toolbar">
          <label className="catalog-search">
            <span>Tìm khuyến mãi</span>
            <input
              type="search"
              className="catalog-search__input"
              placeholder="Tìm theo tên, mã, mô tả..."
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
          : promotions.map((promotion) => (
              <PromotionCard key={getPromotionId(promotion)} promotion={promotion} />
            ))}
      </div>

      {!isLoading && promotions.length === 0 ? (
        <div className="catalog-empty mt-3">
          <strong>Chưa có khuyến mãi nào</strong>
          <p>Hãy thêm dữ liệu bên backend hoặc thử bỏ từ khóa tìm kiếm.</p>
        </div>
      ) : null}

      {!isLoading && promotions.length > 0 ? (
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