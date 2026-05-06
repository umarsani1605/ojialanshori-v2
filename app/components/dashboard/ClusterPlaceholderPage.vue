<script setup lang="ts">
const props = defineProps<{
  title: string
  description: string
  cluster: 'admin' | 'dashboard'
}>()

const headline = computed(() =>
  props.cluster === 'admin' ? 'Area Admin' : 'Area Dashboard',
)
</script>

<template>
  <UPageHero
    :headline="headline"
    :title="title"
    :description="description"
  >
    <UPageCard
      variant="subtle"
      highlight
      highlight-color="primary"
      icon="i-lucide-construction"
      title="Belum diimplementasikan"
      description="Struktur route, layout, akses role, dan navigasi canonical sudah final. Isi halaman menyusul di task berikutnya."
    />
  </UPageHero>
</template>
