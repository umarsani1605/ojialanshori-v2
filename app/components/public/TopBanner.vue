<script setup lang="ts">
type Banner = {
  id: number
  text: string
  link: string | null
}

const dismissed = ref(false)

onMounted(() => {
  if (typeof sessionStorage !== 'undefined') {
    dismissed.value = sessionStorage.getItem('topBannerDismissed') === '1'
  }
})

const { data: banner } = await useFetch<Banner | null>('/api/public/banner', {
  key: 'public-banner',
})

const visible = computed(() => !!banner.value && !dismissed.value)

function dismiss() {
  dismissed.value = true
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('topBannerDismissed', '1')
  }
}
</script>

<template>
  <div
    v-if="visible && banner"
    class="bg-emerald-700 text-white text-sm"
  >
    <div class="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
      <p class="flex-1 text-center">
        <NuxtLink
          v-if="banner.link"
          :to="banner.link"
          class="hover:underline"
        >
          {{ banner.text }}
        </NuxtLink>
        <span v-else>{{ banner.text }}</span>
      </p>
      <button
        type="button"
        class="shrink-0 p-1 rounded hover:bg-white/10 transition cursor-pointer"
        aria-label="Tutup banner"
        @click="dismiss"
      >
        <UIcon name="i-lucide-x" class="size-4" />
      </button>
    </div>
  </div>
</template>
