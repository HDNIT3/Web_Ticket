export function createGenreOption(genre) {
  return {
    value: genre?._id ?? genre?.id ?? '',
    label: genre?.name ?? 'Không rõ',
  }
}

export function createGenreOptions(genres) {
  if (!Array.isArray(genres)) return []
  return genres.map(createGenreOption)
}

export function createGenreMap(genres) {
  if (!Array.isArray(genres)) return {}
  return genres.reduce((map, genre) => {
    const id = genre?._id ?? genre?.id
    if (id) map[id] = genre.name ?? '?'
    return map
  }, {})
}

export function getGenreLabels(genreList) {
  if (!Array.isArray(genreList)) return []
  return genreList.map((g) => g?.name ?? '?')
}
