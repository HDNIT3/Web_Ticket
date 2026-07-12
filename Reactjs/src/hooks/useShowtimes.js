import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCinemasForMovie, getShowtimes } from '../services/movie.api.js'

/**
 * Hook fetches showtimes + distinct cinemas for a given movie.
 *
 * @param {string} movieId
 * @param {{ date?: string, cinema?: string, seatType?: string, language?: string }} filters
 */
export function useShowtimes(movieId, filters = {}) {
  const [showtimes, setShowtimes] = useState([])
  const [cinemas, setCinemas] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const filterKey = useMemo(
    () => JSON.stringify({ movieId, ...filters }),
    [movieId, filters]
  )

  const load = useCallback(async () => {
    if (!movieId) return

    setIsLoading(true)
    setErrorMessage('')

    try {
      const params = {
        movieId,
        upcoming: 'true',
        limit: 200,
        ...filters,
      }

      const [showtimeResult, cinemaResult] = await Promise.all([
        getShowtimes(params),
        getCinemasForMovie(movieId).catch(() => []),
      ])

      setShowtimes(Array.isArray(showtimeResult?.items) ? showtimeResult.items : [])
      setCinemas(Array.isArray(cinemaResult) ? cinemaResult : [])
    } catch (err) {
      console.error('Lỗi khi tải suất chiếu:', err)
      setErrorMessage('Không thể tải suất chiếu. Vui lòng thử lại.')
      setShowtimes([])
      setCinemas([])
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  useEffect(() => {
    const runLoad = async () => {
      await load()
    }
    runLoad()
  }, [load])

  return { showtimes, cinemas, isLoading, errorMessage, reload: load }
}
