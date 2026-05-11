<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error.statusCode === 404)

const title = computed(() =>
  isNotFound.value ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan',
)

const description = computed(() =>
  isNotFound.value
    ? 'Halaman yang kamu cari tidak ada atau sudah dipindahkan.'
    : 'Maaf, ada sesuatu yang tidak beres di server. Coba beberapa saat lagi.',
)

function handleHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-6 text-center">
    <p class="text-6xl font-bold text-primary">
      {{ error.statusCode }}
    </p>
    <h1 class="mt-4 text-2xl font-semibold">{{ title }}</h1>
    <p class="mt-2 max-w-md text-muted">{{ description }}</p>

    <UButton class="mt-8" icon="i-ph-house" size="lg" @click="handleHome">
      Pulang ke Beranda
    </UButton>
  </div>
</template>
