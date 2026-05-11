/**
 * Helper untuk TanStack Table columns yang dipakai Nuxt UI UTable.
 * Mengurangi boilerplate `resolveComponent` + `h()` di tiap page admin.
 */
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

type AnyRow = Record<string, unknown>

/**
 * Kolom aksi "Edit + Hapus" standar di kanan tabel.
 */
export function actionsColumn<T extends AnyRow>(options: {
  /** Klik Edit memanggil callback (mode modal). Mutually exclusive dgn `editTo`. */
  onEdit?: (row: T) => void
  /** Edit jadi NuxtLink ke URL (mode navigasi). Mutually exclusive dgn `onEdit`. */
  editTo?: (row: T) => string
  onDelete?: (row: T) => void
  editLabel?: string
  deleteLabel?: string
  extra?: (row: T) => ReturnType<typeof h>[]
}): TableColumn<T> {
  const UButton = resolveComponent('UButton')

  return {
    id: 'actions',
    header: () => h('div', { class: 'text-right' }, ''),
    cell: ({ row }) => {
      const children: ReturnType<typeof h>[] = []

      if (options.extra) children.push(...options.extra(row.original))

      if (options.onEdit) {
        children.push(
          h(UButton, {
            size: 'sm',
            variant: 'light',
            label: options.editLabel ?? 'Edit',
            icon: 'i-ph-pencil-simple',
            onClick: () => options.onEdit!(row.original),
          }),
        )
      } else if (options.editTo) {
        children.push(
          h(UButton, {
            size: 'sm',
            variant: 'light',
            label: options.editLabel ?? 'Edit',
            icon: 'i-ph-pencil-simple',
            to: options.editTo(row.original),
          }),
        )
      }
      if (options.onDelete) {
        children.push(
          h(UButton, {
            size: 'sm',
            variant: 'light',
            color: 'error',
            label: options.deleteLabel ?? 'Hapus',
            icon: 'i-ph-trash',
            onClick: () => options.onDelete!(row.original),
          }),
        )
      }

      return h('div', { class: 'flex gap-1 justify-end' }, children)
    },
  }
}

/**
 * Kolom gambar dengan fallback icon kalau src null.
 */
export function imageColumn<T extends AnyRow>(options: {
  accessorKey: keyof T & string
  header?: string
  alt: (row: T) => string
  fallbackIcon?: string
  shape?: 'rect' | 'circle' | 'square'
  size?: number
}): TableColumn<T> {
  const UIcon = resolveComponent('UIcon')
  const shape = options.shape ?? 'rect'
  const fallbackIcon = options.fallbackIcon ?? 'i-ph-image'

  const wrapperClass =
    shape === 'circle'
      ? 'size-16 rounded-full object-cover bg-elevated shrink-0'
      : shape === 'square'
        ? 'size-16 rounded-xl object-cover bg-elevated shrink-0'
        : 'h-24 w-32 rounded-xl object-cover bg-elevated shrink-0'

  const fallbackWrapperClass = wrapperClass.replace(
    'object-cover',
    'flex items-center justify-center',
  )

  return {
    accessorKey: options.accessorKey,
    header: options.header ?? 'Foto',
    cell: ({ row }) => {
      const src = row.getValue(options.accessorKey) as string | null
      if (!src) {
        return h('div', { class: fallbackWrapperClass }, [
          h(UIcon, { name: fallbackIcon, class: 'size-5 text-dimmed' }),
        ])
      }
      return h('img', { src, alt: options.alt(row.original), class: wrapperClass })
    },
  }
}

/**
 * Kolom badge status dengan mapping color + label.
 */
export function badgeColumn<T extends AnyRow, V extends string>(options: {
  accessorKey: keyof T & string
  header?: string
  colorMap: Record<V, 'success' | 'warning' | 'neutral' | 'error' | 'info' | 'primary'>
  labelMap: Record<V, string>
}): TableColumn<T> {
  const UBadge = resolveComponent('UBadge')

  return {
    accessorKey: options.accessorKey,
    header: options.header ?? 'Status',
    cell: ({ row }) => {
      const value = row.getValue(options.accessorKey) as V
      return h(UBadge, {
        label: options.labelMap[value] ?? String(value),
        color: options.colorMap[value] ?? 'neutral',
        variant: 'subtle',
      })
    },
  }
}
