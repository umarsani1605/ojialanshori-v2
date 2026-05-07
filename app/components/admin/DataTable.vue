<script setup lang="ts" generic="T">
import type { TableColumn } from '@nuxt/ui'

const props = withDefaults(defineProps<{
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  pageSize?: number
}>(), {
  loading: false,
  pageSize: 10,
})

const page = ref(1)

watch(() => props.data, () => {
  page.value = 1
})

const paginatedData = computed(() => {
  const start = (page.value - 1) * props.pageSize
  return props.data.slice(start, start + props.pageSize)
})
</script>

<template>
  <div class="space-y-4">
    <slot name="header" />

    <UTable :data="paginatedData" :columns="columns" :loading="loading">
      <template #empty>
        <slot name="empty">
          <div class="py-12 text-center">
            <p class="text-muted">Tidak ada data.</p>
          </div>
        </slot>
      </template>
    </UTable>

    <DashboardTablePagination
      v-if="data.length > pageSize"
      :page="page"
      :total="data.length"
      :page-size="pageSize"
      @update:page="page = $event"
    />
  </div>
</template>
