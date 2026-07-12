import { useEffect, useRef, useState } from 'react'
import { useMovieCatalog } from '../hooks/useMovieCatalog.js'

const HOME_SLIDES = [
  {
    title: 'Cine Hall Central',
    description: 'Ảnh nền rạp chiếu lớn, tối, đậm chất điện ảnh và lướt mượt như hero banner.',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80',
    meta: 'Banner đầu trang có mũi tên chuyển slide',
  },
  {
    title: 'Cinema Room Light',
    description: 'Không khí phòng chiếu với ánh sáng thấp, dùng làm poster nền cho home user.',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=80',
    meta: 'Phù hợp UI kiểu rạp chiếu hiện đại',
  },
  {
    title: 'Big Screen Night',
    description: 'Slide cuối nhấn vào chiều sâu, màu tối và cảm giác xem phim online.',
    image: 'https://images.unsplash.com/photo-1489599514909-5e5646f2e2dc?auto=format&fit=crop&w=1600&q=80',
    meta: 'Tự động chạy và có nút điều khiển',
  },
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

function getGenresText(movie) {
  return (movie.genres || []).map((genre) => genre?.name).filter(Boolean).join(' · ')
}

function MovieRail({ title, movies, onOpenMovie }) {
  const railRef = useRef(null)

  const scrollRail = (direction) => {
    if (!railRef.current) return
    railRef.current.scrollBy({ left: direction * 420, behavior: 'smooth' })
  }

  return (
    <section className="home-rail">
      <div className="movie-section__header">
        <div>
          <h2>{title}</h2>
        </div>
        <div className="home-rail__actions">
          <button type="button" className="rail-arrow" onClick={() => scrollRail(-1)} aria-label={`Lướt trái ${title}`}>
            ‹
          </button>
          <button type="button" className="rail-arrow" onClick={() => scrollRail(1)} aria-label={`Lướt phải ${title}`}>
            ›
          </button>
        </div>
      </div>

      <div ref={railRef} className="home-rail__track">
        {movies.map((movie) => (
          <article key={movieId(movie)} className="home-rail-card" onClick={() => onOpenMovie?.(movieId(movie))} role="button" tabIndex={0}>
            <div className="home-rail-card__poster">
              <img src={movie.posterUrl} alt={movie.title} />
              <StatusBadge status={movie.status} />
              
              {/* Hover Details Overlay */}
              <div className="home-rail-card__hover-overlay">
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
            <div className="home-rail-card__body">
              <h3>{movie.title}</h3>
              <p>{getGenresText(movie) || 'Chưa có thể loại'}</p>
              <span>{formatDuration(movie.durationMinutes)} · {formatDate(movie.releaseDate)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default function HomePage({ searchTerm = '', onOpenMovie }) {
  const commonParams = {
    title: searchTerm.trim() || undefined,
    page: 1,
    limit: 10,
  }

  const hotCatalog = useMovieCatalog({ ...commonParams }, { loadGenres: false })
  const showingCatalog = useMovieCatalog({ ...commonParams, status: 'NOW_SHOWING' }, { loadGenres: false })
  const comingSoonCatalog = useMovieCatalog({ ...commonParams, status: 'COMING_SOON' }, { loadGenres: false })
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % HOME_SLIDES.length)
    }, 5500)

    return () => window.clearInterval(timer)
  }, [])

  const hotMovies = hotCatalog.movies
  const showingMovies = showingCatalog.movies
  const comingSoonMovies = comingSoonCatalog.movies
  const slide = HOME_SLIDES[activeSlide]
  const isLoading = hotCatalog.isLoading || showingCatalog.isLoading || comingSoonCatalog.isLoading

  return (
    <section className="home-page container-fluid px-3 px-lg-4">
      <div className="home-hero">
        <button type="button" className="home-hero__nav home-hero__nav--left" onClick={() => setActiveSlide((current) => (current - 1 + HOME_SLIDES.length) % HOME_SLIDES.length)}>
          ‹
        </button>

        <article className="home-hero__slide">
          <img src={slide.image} alt={slide.title} className="home-hero__image" />
          <div className="home-hero__overlay">
            <p className="eyebrow">Rạp chiếu</p>
            <h1>{slide.title}</h1>
            <p>{slide.description}</p>
            <span>{slide.meta}</span>
            <div className="home-hero__dots">
              {HOME_SLIDES.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  className={`home-hero__dot ${index === activeSlide ? 'home-hero__dot--active' : ''}`}
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Chuyển slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </article>

        <button type="button" className="home-hero__nav home-hero__nav--right" onClick={() => setActiveSlide((current) => (current + 1) % HOME_SLIDES.length)}>
          ›
        </button>
      </div>

      <MovieRail title="PHIM HOT" movies={hotMovies} onOpenMovie={onOpenMovie} />
      <MovieRail title="PHIM ĐANG CHIẾU" movies={showingMovies} onOpenMovie={onOpenMovie} />
      <MovieRail title="PHIM SẮP CHIẾU" movies={comingSoonMovies} onOpenMovie={onOpenMovie} />

      {isLoading ? <div className="movie-loading home-loading">Đang tải catalog phim...</div> : null}
    </section>
  )
}

