import { useEffect, useMemo, useState } from 'react'
import { useMovieCatalog } from '../hooks/useMovieCatalog.js'
import { useShowtimes } from '../hooks/useShowtimes.js'
import { useAuth } from '../components/context/auth.context.jsx'
import MovieReviews from '../components/layout/MovieReviews.jsx'
import { favoriteApi } from '../services/favorite.api.js'
import { getSimilarMovies, getMovieById } from '../services/movie.api.js'
import { notifySuccess, notifyError } from '../util/notify.js'


function getMovieId(movie) {
  return movie?._id || movie?.id
}

function formatDate(value) {
  if (!value) return 'Đang cập nhật'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Đang cập nhật'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return 'Đang cập nhật'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m > 0 ? `${m}p` : ''}`.trim() : `${m} phút`
}

function formatTimeOnly(value) {
  if (!value) return '--:--'
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatDateOnly(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('vi-VN').format(date)
}

function getDateKey(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'invalid'
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}



function StatusBadge({ status }) {
  if (status === 'NOW_SHOWING') return <span className="movie-pill movie-pill--showing">Đang chiếu</span>
  if (status === 'COMING_SOON') return <span className="movie-pill movie-pill--coming">Sắp chiếu</span>
  return <span className="movie-pill movie-pill--stopped">Ngừng chiếu</span>
}

function getTrailerEmbedUrl(url) {
  if (!url) return ''
  if (url.includes('/embed/')) return url
  const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?&]+)/)
  if (match?.[1]) return `https://www.youtube.com/embed/${match[1]}`
  return url
}


function ShowtimeSection({ movieId }) {
  const { isAdmin, isStaff, isAuthenticated } = useAuth()
  const [selectedDate, setSelectedDate] = useState('')
  const { showtimes, isLoading, errorMessage } = useShowtimes(movieId)

  const groupedShowtimes = useMemo(() => {
    const sorted = [...showtimes].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    const byDate = new Map()

    sorted.forEach((st) => {
      const dateKey = getDateKey(st.startTime)
      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, {
          key: dateKey,
          label: formatDateOnly(st.startTime),
          items: [],
        })
      }
      byDate.get(dateKey).items.push(st)
    })

    return Array.from(byDate.values())
  }, [showtimes])

  const visibleGroupedShowtimes = useMemo(() => {
    if (!selectedDate) return groupedShowtimes
    return groupedShowtimes.filter((group) => group.key === selectedDate)
  }, [groupedShowtimes, selectedDate])

  const [prevGrouped, setPrevGrouped] = useState(groupedShowtimes)
  if (groupedShowtimes !== prevGrouped) {
    setPrevGrouped(groupedShowtimes)
    if (selectedDate && !groupedShowtimes.some((g) => g.key === selectedDate)) {
      setSelectedDate('')
    }
  }

  const groupedByDateAndAuditorium = useMemo(() => {
    return visibleGroupedShowtimes.map(dateGroup => {
      const audMap = new Map();
      dateGroup.items.forEach(st => {
        const audName = st.auditorium?.name || 'Phòng chưa xếp';
        if (!audMap.has(audName)) audMap.set(audName, []);
        audMap.get(audName).push(st);
      });
      return {
        ...dateGroup,
        auditoriums: Array.from(audMap.entries()).map(([name, showtimes]) => ({
          name,
          showtimes
        }))
      };
    });
  }, [visibleGroupedShowtimes]);

  return (
    <div className="card bg-dark border-secondary mt-5" style={{ borderRadius: '12px', overflow: 'hidden' }}>
      <div className="card-header border-secondary d-flex align-items-center justify-content-between gap-3 flex-wrap p-3">
        <div className="d-flex align-items-center gap-3">
          <h5 className="mb-0 text-light" style={{ fontSize: '1.25rem' }}>🎬 Lịch Chiếu</h5>
          {(isAdmin || isStaff) && (
            <button 
              className="btn btn-sm btn-danger"
              onClick={() => alert('Tính năng Thêm suất chiếu đang được phát triển!')}
            >
              <i className="bi bi-plus-circle"></i> Thêm Suất Chiếu
            </button>
          )}
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <small className="text-secondary">Chọn ngày có suất chiếu:</small>
          <button
            type="button"
            className={`btn btn-sm ${!selectedDate ? 'btn-danger' : 'btn-outline-secondary'}`}
            onClick={() => setSelectedDate('')}
          >
            Tất cả
          </button>
          {groupedShowtimes.map((group) => (
            <button
              key={group.key}
              type="button"
              className={`btn btn-sm ${selectedDate === group.key ? 'btn-danger' : 'btn-outline-secondary'}`}
              onClick={() => setSelectedDate(group.key)}
            >
              {group.label}
            </button>
          ))}
        </div>
      </div>



      <div className="card-body p-4">
        {errorMessage && <div className="alert alert-warning mb-3">{errorMessage}</div>}
        
        {isLoading ? (
          <p className="text-secondary text-center py-3">Đang tải lịch chiếu...</p>
        ) : visibleGroupedShowtimes.length === 0 ? (
          <p className="text-secondary text-center py-3">
            {selectedDate
              ? 'Không có suất chiếu trong ngày đã chọn.'
              : `Hiện chưa có suất chiếu nào.`}
          </p>
        ) : (
          <div className="vstack gap-4">
            {groupedByDateAndAuditorium.map((group) => (
              <div key={group.key} className="border border-secondary rounded p-4 bg-black">
                <div className="fw-bold text-danger mb-3" style={{ fontSize: '1.25rem' }}>{group.label}</div>
                <div className="vstack gap-4">
                  {group.auditoriums.map(aud => (
                    <div key={aud.name}>
                      <div className="text-secondary fw-semibold mb-2">Phòng chiếu: <span className="text-light">{aud.name}</span></div>
                      <div className="d-flex flex-wrap gap-3">
                        {aud.showtimes.map(st => (
                            <div
                              key={st._id || st.id}
                              className="border border-secondary rounded position-relative p-2"
                              style={{ minWidth: '120px', backgroundColor: '#1a1d20' }}
                            >
                              <div 
                                className="d-flex flex-column align-items-center justify-content-center"
                                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                                onClick={() => {
                                  if (!isAuthenticated) {
                                    notifyError('Vui lòng đăng nhập để đặt vé.')
                                    window.location.hash = '#/login'
                                  } else {
                                    window.location.hash = `#/booking/${st._id || st.id}`;
                                  }
                                }}
                              >
                                <span className="fw-bold text-light" style={{ fontSize: '1.2rem' }}>{formatTimeOnly(st.startTime)}</span>
                                <small className="text-warning fw-semibold mt-1">
                                  {st.baseTicketPrice ? `${st.baseTicketPrice.toLocaleString('vi-VN')}đ` : 'Đang cập nhật'}
                                </small>
                              </div>
                              
                              {(isAdmin || isStaff) && (
                                <div className="d-flex justify-content-center gap-2 mt-2 pt-2 border-top border-secondary">
                                  <button className="btn btn-sm btn-outline-warning py-0 px-2" onClick={(e) => { e.stopPropagation(); alert('Sửa suất chiếu'); }} title="Sửa"><i className="bi bi-pencil"></i></button>
                                  <button className="btn btn-sm btn-outline-danger py-0 px-2" onClick={(e) => { e.stopPropagation(); alert('Xóa suất chiếu'); }} title="Xóa"><i className="bi bi-trash"></i></button>
                                </div>
                              )}
                            </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


export default function MovieDetailPage({ movieId: detailMovieId, onBackMovies, onOpenMovie }) {
  const { movies } = useMovieCatalog()
  const { isAuthenticated } = useAuth()
  const [localMovie, setLocalMovie] = useState(null)
  const [movieLoading, setMovieLoading] = useState(false)
  const [ratingStats, setRatingStats] = useState({ averageRating: 0, totalReviews: 0 })
  const [isFavorite, setIsFavorite] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [similarMovies, setSimilarMovies] = useState([])

  const movie = useMemo(() => {
    if (localMovie && getMovieId(localMovie) === detailMovieId) return localMovie
    return movies.find((item) => getMovieId(item) === detailMovieId) || null
  }, [detailMovieId, movies, localMovie])

  useEffect(() => {
    if (!detailMovieId) return

    setMovieLoading(true)
    getMovieById(detailMovieId)
      .then((data) => {
        setLocalMovie(data)
      })
      .catch((err) => {
        console.error('Lỗi khi tải chi tiết phim:', err)
      })
      .finally(() => {
        setMovieLoading(false)
      })

    getSimilarMovies(detailMovieId, 8)
      .then((data) => setSimilarMovies(Array.isArray(data) ? data : []))
      .catch(() => setSimilarMovies([]))

    if (isAuthenticated) {
      favoriteApi.checkFavorite(detailMovieId)
        .then((data) => setIsFavorite(data?.isFavorite === true))
        .catch(() => setIsFavorite(false))
    } else {
      setIsFavorite(false)
    }

    if (window.location.hash.includes('book=true') || window.location.search.includes('book=true')) {
      setTimeout(() => {
        const el = document.getElementById('showtime-section')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        }
      }, 600)
    }
  }, [detailMovieId, isAuthenticated])

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      notifyError('Vui lòng đăng nhập để thêm phim yêu thích.')
      return
    }
    try {
      setFavLoading(true)
      if (isFavorite) {
        await favoriteApi.removeFavorite(detailMovieId)
        setIsFavorite(false)
        notifySuccess('Đã xóa khỏi danh sách yêu thích.')
      } else {
        await favoriteApi.addFavorite(detailMovieId)
        setIsFavorite(true)
        notifySuccess('Đã thêm vào danh sách yêu thích! ❤️')
      }
    } catch (err) {
      notifyError(err.message || 'Lỗi khi cập nhật yêu thích.')
    } finally {
      setFavLoading(false)
    }
  }

  if (movieLoading && !movie) {
    return (
      <section className="movie-page container-fluid px-3 px-lg-4">
        <div className="movie-empty-state">
          <div className="spinner-border text-danger mb-3" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p>Đang tải chi tiết phim...</p>
        </div>
      </section>
    )
  }

  if (!movie) {
    return (
      <section className="movie-page container-fluid px-3 px-lg-4">
        <div className="movie-empty-state">
          <strong>Không tìm thấy phim.</strong>
          <p>Quay lại tab Movies để chọn phim khác.</p>
          <button type="button" className="btn btn-primary btn-hero mt-3" onClick={onBackMovies}>
            Về danh sách phim
          </button>
        </div>
      </section>
    )
  }

  const trailerUrl = getTrailerEmbedUrl(movie.trailerUrl)

  return (
    <>
    <section className="movie-detail container-fluid px-3 px-lg-4">
      <div className="movie-detail__hero">
        <button type="button" className="link-button movie-detail__back" onClick={onBackMovies}>
          ← Quay lại Movies
        </button>

        <div className="movie-detail__grid">
          <article className="movie-detail__poster">
            <img src={movie.posterUrl} alt={movie.title} loading="lazy" />
            <StatusBadge status={movie.status} />
          </article>

          <div className="movie-detail__content">
            <h1>{movie.title}</h1>
            <p className="movie-detail__summary">{movie.description || 'Phim đang cập nhật mô tả.'}</p>

            <div className="movie-detail__meta">
              <span className="movie-detail__meta-chip">
                🎭 {(movie.genres || []).map((g) => g?.name).filter(Boolean).join(' · ') || 'Chưa có thể loại'}
              </span>
              <span className="movie-detail__meta-chip">📅 {formatDate(movie.releaseDate)}</span>
              <span className="movie-detail__meta-chip">⏱ {formatDuration(movie.durationMinutes)}</span>
              <span className="movie-detail__meta-chip">🔞 {movie.ageRating || 'Đang cập nhật'}</span>
              {ratingStats.totalReviews > 0 ? (
                <span className="movie-detail__meta-chip text-warning fw-bold">
                  ⭐ {ratingStats.averageRating} / 5 ({ratingStats.totalReviews} đánh giá)
                </span>
              ) : (
                <span className="movie-detail__meta-chip text-white-50">
                  ☆ Chưa có đánh giá
                </span>
              )}
            </div>

            <div className="movie-detail__info-grid">
              <div>
                <strong>Đạo diễn</strong>
                <span>{movie.director || 'Đang cập nhật'}</span>
              </div>
              <div>
                <strong>Diễn viên</strong>
                <span>{movie.cast || 'Đang cập nhật'}</span>
              </div>
              <div>
                <strong>Trạng thái</strong>
                <span>
                  <StatusBadge status={movie.status} />
                </span>
              </div>
            </div>

            <div className="movie-detail__actions mt-4 d-flex align-items-center gap-3 flex-wrap">
              {movie.status === 'NOW_SHOWING' && (
                <button
                  type="button"
                  className="btn btn-hero"
                  onClick={() => {
                    document.getElementById('showtime-section')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  🎟 Đặt vé ngay
                </button>
              )}
              <button
                type="button"
                className={`btn fw-bold px-4 py-2 rounded-3 d-flex align-items-center gap-2 ${
                  isFavorite
                    ? 'btn-danger'
                    : 'btn-outline-danger'
                }`}
                style={{ transition: 'all 0.2s ease', fontSize: '0.9rem' }}
                onClick={handleToggleFavorite}
                disabled={favLoading}
                title={isFavorite ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
              >
                {favLoading ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : isFavorite ? '❤️' : '🤍'}
                {isFavorite ? 'Đã yêu thích' : 'Yêu thích'}
              </button>
            </div>
          </div>
        </div>

        <div className="movie-detail__trailer">
          <div className="movie-section__header">
            <div><h2>Trailer phim</h2></div>
          </div>

          <div className="movie-detail__trailer-frame movie-stage">
            {trailerUrl ? (
              <iframe
                src={trailerUrl}
                title={`Trailer ${movie.title}`}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="movie-stage__empty">
                <strong>Trailer chưa có sẵn</strong>
                <p>Hãy thêm trailerUrl để hiển thị video ngay tại đây.</p>
              </div>
            )}
          </div>
        </div>

        <div id="showtime-section" className="movie-detail__showtimes">
          <ShowtimeSection movieId={detailMovieId} />
        </div>

        <MovieReviews movieId={detailMovieId} onStatsLoaded={setRatingStats} />

        {similarMovies.length > 0 && (
          <div className="mt-5">
            <div className="movie-section__header mb-3">
              <div><h2>🔄 Phim Tương Tự</h2></div>
            </div>
            <div className="d-flex flex-wrap gap-3">
              {similarMovies.map((sim) => {
                const simId = sim._id || sim.id
                const simGenres = (sim.genres || []).map((g) => g?.name).filter(Boolean)
                return (
                  <div
                    key={simId}
                    className="rounded-4 overflow-hidden position-relative"
                    style={{
                      width: '140px',
                      cursor: 'pointer',
                      backgroundColor: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.07)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      flexShrink: 0,
                    }}
                    onClick={() => {
                      if (typeof onOpenMovie === 'function') onOpenMovie(simId)
                      else window.location.hash = `#/movie/${simId}`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.5)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {sim.posterUrl ? (
                      <img
                        src={sim.posterUrl}
                        alt={sim.title}
                        style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div
                        style={{ width: '100%', height: '200px', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}
                      >🎬</div>
                    )}
                    <span
                      className="position-absolute top-0 start-0 m-1 badge"
                      style={{
                        fontSize: '0.55rem',
                        backgroundColor: sim.status === 'NOW_SHOWING' ? '#16a34a' : sim.status === 'COMING_SOON' ? '#d97706' : '#6b7280',
                      }}
                    >
                      {sim.status === 'NOW_SHOWING' ? 'Đang chiếu' : sim.status === 'COMING_SOON' ? 'Sắp chiếu' : 'Ngừng chiếu'}
                    </span>
                    <div className="p-2">
                      <p
                        className="fw-bold text-light text-truncate mb-0"
                        style={{ fontSize: '0.75rem' }}
                        title={sim.title}
                      >
                        {sim.title}
                      </p>
                      {simGenres.length > 0 && (
                        <p className="text-truncate mb-0" style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>
                          {simGenres.join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="movie-detail__actions-bottom mt-4 text-center">
          <button type="button" className="btn btn-outline-light btn-hero-secondary" onClick={onBackMovies}>
            Xem thêm phim
          </button>
        </div>
      </div>
    </section>

  </>
  )
}