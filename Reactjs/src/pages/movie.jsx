import { useState } from 'react'
import { useMovieCatalog } from '../hooks/useMovieCatalog.js'
import { useAuth } from '../components/context/auth.context.jsx'

const STATUS_FILTERS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'NOW_SHOWING', label: 'Đang chiếu' },
  { value: 'COMING_SOON', label: 'Sắp chiếu' },
]

function movieId(movie) {
  return movie?._id || movie?.id
}

function formatDate(value) {
  if (!value) return 'Đang cập nhật'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Đang cập nhật'

  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return 'Đang cập nhật'

  return `${minutes} phút`
}

function StatusBadge({ status }) {
  if (status === 'NOW_SHOWING') return <span className="movie-pill movie-pill--showing">Đang chiếu</span>
  if (status === 'COMING_SOON') return <span className="movie-pill movie-pill--coming">Sắp chiếu</span>
  return <span className="movie-pill movie-pill--stopped">Ngừng chiếu</span>
}

function buildPaginationItems(currentPage, totalPage, maxButtons = 5) {
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

function renderPaginationButtons(currentPage, totalPage, onPageChange) {
  const pageItems = buildPaginationItems(currentPage, totalPage)

  return pageItems.map((pageNumber) => (
    <button
      key={pageNumber}
      type="button"
      className={`movie-pagination__page ${pageNumber === currentPage ? 'movie-pagination__page--active' : ''}`}
      onClick={() => onPageChange(pageNumber)}
    >
      {pageNumber}
    </button>
  ))
}

export default function MoviePage({ searchTerm = '', onOpenMovie }) {
  const { isAdmin } = useAuth()
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [genreFilter, setGenreFilter] = useState('ALL')
  const [page, setPage] = useState(1)

  const [prevFilters, setPrevFilters] = useState({ genreFilter, searchTerm, statusFilter })
  if (
    prevFilters.genreFilter !== genreFilter ||
    prevFilters.searchTerm !== searchTerm ||
    prevFilters.statusFilter !== statusFilter
  ) {
    setPrevFilters({ genreFilter, searchTerm, statusFilter })
    setPage(1)
  }

  const queryParams = {
    title: searchTerm.trim() || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    genreId: genreFilter !== 'ALL' ? genreFilter : undefined,
    page,
    limit: 8,
  }

  const { movies, genres, pagination, isLoading, errorMessage } = useMovieCatalog(queryParams)

  return (
    <section className="movie-page container-fluid px-3 px-lg-4">
      <div className="movie-toolbar movie-toolbar--page">
        <div className="movie-toolbar__filters">
          {STATUS_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`movie-filter-chip ${statusFilter === option.value ? 'movie-filter-chip--active' : ''}`}
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="movie-toolbar__controls d-flex gap-3 align-items-center">
          {isAdmin && (
            <button 
              className="btn btn-danger d-flex align-items-center gap-2"
              onClick={() => alert('Tính năng Thêm phim mới đang được phát triển!')}
            >
              <i className="bi bi-plus-circle"></i> Thêm Phim
            </button>
          )}
          <label className="movie-select">
            <span>Thể loại</span>
            <select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)}>
              <option value="ALL">Tất cả thể loại</option>
              {genres.map((genre) => (
                <option key={movieId(genre)} value={movieId(genre)}>
                  {genre.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {errorMessage ? <div className="alert alert-warning alert-modern movie-alert">{errorMessage}</div> : null}

      <section className="movie-section movie-section--page">
        <div className="movie-grid movie-grid--catalog">
          {isLoading
            ? Array.from({ length: 8 }).map((_, index) => (
                <article key={index} className="movie-card movie-card--catalog movie-card--placeholder">
                  <div className="movie-card__poster-wrap movie-card__poster-wrap--placeholder" />
                  <div className="movie-card__body">
                    <div className="placeholder-line placeholder-line--title" />
                    <div className="placeholder-line" />
                    <div className="placeholder-line placeholder-line--short" />
                  </div>
                </article>
              ))
            : movies.map((movie) => (
                <article key={movieId(movie)} className="movie-card movie-card--catalog" style={{ cursor: 'pointer' }} onClick={() => onOpenMovie?.(movieId(movie))}>
                  <div className="movie-card__poster-wrap">
                    <img src={movie.posterUrl || ''} alt={movie.title} className="movie-card__poster" />
                    <StatusBadge status={movie.status} />
                    
                    {/* Hover Details Overlay */}
                    <div className="movie-card__hover-overlay">
                      <div className="hover-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm flex-grow-1 py-2 fw-bold"
                          onClick={() => onOpenMovie?.(movieId(movie))}
                        >
                          CHI TIẾT
                        </button>
                        <button
                          type="button"
                          className="btn btn-warning btn-sm flex-grow-1 py-2 fw-bold text-dark"
                          onClick={() => onOpenMovie?.(`${movieId(movie)}?book=true`)}
                        >
                          ĐẶT VÉ
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="movie-card__body">
                    <h3>{movie.title}</h3>
                    <p>{(movie.genres || []).map((genre) => genre?.name).filter(Boolean).join(' · ') || 'Chưa có thể loại'}</p>
                    <div className="movie-card__meta">
                      <span>{formatDuration(movie.durationMinutes)}</span>
                      <span>{formatDate(movie.releaseDate)}</span>
                    </div>
                    {isAdmin && (
                      <div className="d-flex gap-2 w-100 mt-2 pt-2 border-top border-secondary" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="btn btn-outline-warning px-3 flex-grow-1" onClick={() => alert('Tính năng Sửa phim đang được phát triển!')} title="Sửa">
                          <i className="bi bi-pencil-square"></i> Sửa
                        </button>
                        <button type="button" className="btn btn-outline-danger px-3 flex-grow-1" onClick={() => alert('Tính năng Xóa phim đang được phát triển!')} title="Xóa">
                          <i className="bi bi-trash"></i> Xóa
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
        </div>

        {!isLoading && movies.length > 0 ? (
          <div className="movie-pagination">
            <button
              type="button"
              className="btn btn-outline-light btn-hero-secondary"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={pagination.currentPage <= 1}
              aria-label="Trang trước"
            >
              ‹
            </button>

            <div className="movie-pagination__pages">
              {renderPaginationButtons(pagination.currentPage, pagination.totalPage, setPage)}
            </div>

            <button
              type="button"
              className="btn btn-outline-light btn-hero-secondary"
              onClick={() => setPage((current) => Math.min(current + 1, pagination.totalPage))}
              disabled={pagination.currentPage >= pagination.totalPage}
              aria-label="Trang sau"
            >
              ›
            </button>
          </div>
        ) : null}
      </section>
    </section>
  )
}