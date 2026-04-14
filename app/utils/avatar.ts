const AVATAR_COLORS = [
  '#4F46E5', // indigo-600
  '#7C3AED', // violet-600
  '#DB2777', // pink-600
  '#DC2626', // red-600
  '#D97706', // amber-600
  '#059669', // emerald-600
  '#0284C7', // sky-600
] as const

export function getInitials(name: string | undefined | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]![0]!.toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export function getAvatarColor(name: string | undefined | null): string {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return '#737373' // neutral-500 fallback
  const hash = [...trimmed].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!
}

export { AVATAR_COLORS }
