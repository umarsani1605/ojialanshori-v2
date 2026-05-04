<script setup lang="ts">
const props = defineProps<{
  page: number
  totalPages: number
}>()

const route = useRoute()

function pageHref(p: number) {
  const query = { ...route.query, page: p > 1 ? String(p) : undefined }
  if (!query.page) delete query.page
  return { path: route.path, query }
}

const pages = computed(() => {
  const total = props.totalPages
  const current = props.page
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const result: (number | '…')[] = []
  result.push(1)
  if (current > 3) result.push('…')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) result.push(i)

  if (current < total - 2) result.push('…')
  result.push(total)
  return result
})
</script>

<template>
  <nav
    v-if="totalPages > 1"
    class="flex items-center justify-center gap-1"
    aria-label="Pagination"
  >
    <NuxtLink
      v-if="page > 1"
      :to="pageHref(page - 1)"
      class="px-3 py-2 text-sm rounded-md border border-default hover:bg-neutral-50"
      aria-label="Halaman sebelumnya"
    >
      <UIcon name="i-lucide-chevron-left" class="size-4" />
    </NuxtLink>

    <template v-for="(p, i) in pages" :key="i">
      <span
        v-if="p === '…'"
        class="px-3 py-2 text-sm text-neutral-400"
      >…</span>
      <NuxtLink
        v-else
        :to="pageHref(p as number)"
        class="px-3 py-2 text-sm rounded-md border min-w-[36px] text-center"
        :class="p === page
          ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
          : 'border-default hover:bg-neutral-50 text-neutral-700'"
      >
        {{ p }}
      </NuxtLink>
    </template>

    <NuxtLink
      v-if="page < totalPages"
      :to="pageHref(page + 1)"
      class="px-3 py-2 text-sm rounded-md border border-default hover:bg-neutral-50"
      aria-label="Halaman selanjutnya"
    >
      <UIcon name="i-lucide-chevron-right" class="size-4" />
    </NuxtLink>
  </nav>
</template>
