import { useState, useEffect } from 'react'

const DEFAULT_MOVIES = [
  {
    title: 'Vùng Đất Bóng Tối',
    genre: 'Hành động · Kịch tính',
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Horizon 2049',
    genre: 'Khoa học viễn tưởng',
    poster: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Mùa Hè Cuối Cùng',
    genre: 'Tình cảm · Thanh xuân',
    poster: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1200&q=80',
  },
]

export function AuthPromo({ eyebrow, title, subtitle, badges, movies = DEFAULT_MOVIES, onBackHome }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const slideMovies = movies && movies.length > 0 ? movies : DEFAULT_MOVIES

  useEffect(() => {
    if (slideMovies.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideMovies.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [slideMovies])

  const handleBackHome = () => {
    if (typeof onBackHome === 'function') {
      onBackHome()
    } else {
      window.location.hash = '#/'
    }
  }

  return (
    <div className="auth-promo">
      {/* Slideshow background */}
      <div className="auth-promo__slides">
        {slideMovies.map((movie, index) => (
          <div
            key={`${movie.title}-${index}`}
            className={`auth-promo__slide ${index === currentIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${movie.poster})` }}
          />
        ))}
      </div>
      
      {/* Dark violet gradient overlay */}
      <div className="auth-promo__overlay" />

      {/* Top Header Row with Logo and Back to Website */}
      <div className="auth-promo__header">
        <div className="auth-promo__logo">
          <span className="brand-logo">CH</span>
          <div className="brand-text">
            <strong>CinemaHCMUTE</strong>
            <small>Premium Cinema</small>
          </div>
        </div>
        <button type="button" className="auth-promo__back-btn" onClick={handleBackHome}>
          Về trang chủ <span className="arrow">→</span>
        </button>
      </div>

      {/* Bottom Content Area */}
      <div className="auth-promo__footer">
        <span className="eyebrow">{eyebrow || 'MovieGate'}</span>
        
        <div className="auth-promo__slide-content">
          <h2 className="slide-title">{slideMovies[currentIndex]?.title}</h2>
          <p className="slide-genre">{slideMovies[currentIndex]?.genre}</p>
        </div>

        {/* Dash Indicators */}
        {slideMovies.length > 1 && (
          <div className="auth-promo__indicators">
            {slideMovies.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`indicator-dash ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


