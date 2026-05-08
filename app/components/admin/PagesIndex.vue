<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

type PageItem = { id: number, title: string, template: string, updatedAt: string }
const { data } = useFetch<{ data: PageItem[] }>('/api/pages')
const pages = computed(() => data.value?.data ?? [])

const UButton = resolveComponent('UButton')

const columns: TableColumn<PageItem>[] = [
  { accessorKey: 'title', header: 'Halaman', cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.title) },
  { accessorKey: 'template', header: 'Template' },
  {
    accessorKey: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex justify-end' }, [
      h(UButton, {
        size: 'sm', variant: 'ghost', icon: 'i-ph-pencil-simple',
        to: `/admin/pages/${row.original.template}`
      })
    ]),
  },
]
</script>

<template>
  <AdminDataTable :data="pages" :columns="columns" />
</template>