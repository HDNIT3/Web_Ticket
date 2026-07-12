import { useEffect, useMemo, useState } from 'react'
import { getGenres, getMovies } from '../services/movie.api.js'

export function useMovieCatalog(params = {}, options = {}) {
  const [movies, setMovies] = useState([])
  const [genres, setGenres] = useState([])
  const [pagination, setPagination] = useState({ currentPage: 1, currentItem: [], totalPage: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const { loadGenres = true } = options
  const queryKey = useMemo(() => JSON.stringify(params), [params])

  useEffect(() => {
    let alive = true

    const loadCatalog = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const movieResult = await getMovies(params)
        const genreResult = loadGenres ? await getGenres() : []

        if (!alive) return

        const apiMovies = Array.isArray(movieResult?.currentItem)
          ? movieResult.currentItem
          : Array.isArray(movieResult?.currentItems)
            ? movieResult.currentItems
          : Array.isArray(movieResult?.items)
            ? movieResult.items
            : []
        const apiGenres = Array.isArray(genreResult) ? genreResult : []

        setMovies(apiMovies)
        setGenres(apiGenres)
        setPagination({
          currentPage: movieResult?.currentPage || 1,
          currentItem: apiMovies,
          totalPage: movieResult?.totalPage || 1,
        })
      } catch (err) {
        if (!alive) return

        console.error('Lỗi khi tải catalog:', err)
        setMovies([])
        setGenres([])
        setPagination({ currentPage: 1, currentItem: [], totalPage: 1 })
        setErrorMessage('Không thể kết nối đến server. Vui lòng kiểm tra lại.')
      } finally {
        if (alive) {
          setIsLoading(false)
        }
      }
    }

    loadCatalog()

    return () => {
      alive = false
    }
  }, [queryKey])

  return {
    movies,
    genres,
    pagination,
    isLoading,
    errorMessage,
  }
}