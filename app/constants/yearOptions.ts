export const YEAR_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const year = 2026 - index

  return {
    label: String(year),
    value: year,
  }
})
