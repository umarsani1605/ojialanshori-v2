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
    class="bg-brand-300 text-white text-sm font-ui"
  >
    <div class="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 relative">
      <p class="text-center italic">
        {{ banner.text }}
        <NuxtLink
          v-if="banner.link"
          :to="banner.link"
          class="font-semibold underline underline-offset-2 hover:text-brand-50 ml-1"
        >
          Selengkapnya
        </NuxtLink>
      </p>
      <button
        type="button"
        class="absolute right-3 p-1 rounded-full opacity-80 hover:opacity-100 hover:bg-white/15 transition cursor-pointer"
        aria-label="Tutup banner"
        @click="dismiss"
      >
        <UIcon name="i-lucide-x" class="size-4" />
      </button>
    </div>
  </div>
</template>
