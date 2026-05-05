<script setup lang="ts">
const auth = useAuth()
const route = useRoute()

const navLinks = [
  { label: 'Beranda', to: '/' },
  { label: 'Profil', to: '/profil' },
  { label: 'Kegiatan', to: '/kegiatan' },
  { label: 'Berita', to: '/berita' },
  { label: 'Pena Santri', to: '/pena-santri' },
  { label: 'Kontak', to: '/kontak' },
  { label: 'FAQ', to: '/faq' },
]

const mobileOpen = ref(false)

watch(() => route.path, () => {
  mobileOpen.value = false
})

function isActive(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}
</script>

<template>
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-default">
    <nav class="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-6">
      <NuxtLink to="/" class="flex items-center gap-3 shrink-0">
        <img
          src="/images/logo/logo1.png"
          alt="Omah Ngaji Al-Anshori"
          class="h-12 w-auto object-contain"
        >
      </NuxtLink>

      <!-- Desktop nav -->
      <ul class="hidden lg:flex items-center gap-8">
        <li v-for="link in navLinks" :key="link.to">
          <NuxtLink
            :to="link.to"
            class="relative font-ui text-sm font-medium transition-colors py-2 group"
            :class="isActive(link.to) ? 'text-brand-600' : 'hover:text-brand-600'"
          >
            {{ link.label }}
            <span
              class="absolute left-0 -bottom-0.5 h-[2px] bg-brand-500 transition-all duration-300"
              :class="isActive(link.to) ? 'w-full' : 'w-0 group-hover:w-full'"
            />
          </NuxtLink>
        </li>
      </ul>

      <div class="flex items-center gap-2 shrink-0">
        <template v-if="auth.loggedIn.value">
          <NuxtLink to="/dashboard">
            <UButton
              size="md"
              color="primary"
              variant="solid"
              icon="i-lucide-layout-dashboard"
              class="rounded-full font-ui font-semibold px-6"
            >
              <span class="hidden sm:inline">Dashboard</span>
            </UButton>
          </NuxtLink>
          <AppAvatar
            :name="auth.user.value?.name"
            :src="auth.user.value?.avatar"
            size="sm"
          />
        </template>
        <NuxtLink v-else to="/masuk">
          <UButton
            size="md"
            color="primary"
            variant="solid"
            icon="i-lucide-user"
            class="rounded-full font-ui font-semibold px-6"
          >
            <span class="hidden sm:inline">Masuk</span>
          </UButton>
        </NuxtLink>

        <button
          type="button"
          class="lg:hidden p-2 rounded-md hover:bg-neutral-100 transition cursor-pointer"
          aria-label="Buka menu"
          @click="mobileOpen = !mobileOpen"
        >
          <UIcon :name="mobileOpen ? 'i-lucide-x' : 'i-lucide-menu'" class="size-6" />
        </button>
      </div>
    </nav>

    <!-- Mobile drawer -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="mobileOpen"
        class="lg:hidden border-t border-default bg-white"
      >
        <ul class="px-4 py-2">
          <li v-for="link in navLinks" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="block px-3 py-3 font-ui text-sm rounded-md"
              :class="isActive(link.to)
                ? 'text-brand-600 font-semibold bg-brand-50'
                : 'hover:bg-neutral-50'"
            >
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </Transition>
  </header>
</template>
