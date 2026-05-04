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
  <header class="sticky top-0 z-40 bg-white border-b border-default shadow-sm">
    <nav class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
      <NuxtLink to="/" class="flex items-center gap-2 shrink-0">
        <img
          src="/logo.png"
          alt="Omah Ngaji Al-Anshori"
          class="h-8 w-8 object-contain"
        >
        <span class="hidden sm:inline text-sm font-bold text-emerald-700 leading-tight">
          Omah Ngaji<br>Al-Anshori
        </span>
      </NuxtLink>

      <!-- Desktop nav -->
      <ul class="hidden lg:flex items-center gap-1">
        <li v-for="link in navLinks" :key="link.to">
          <NuxtLink
            :to="link.to"
            class="px-3 py-2 text-sm rounded-md transition-colors"
            :class="isActive(link.to)
              ? 'text-emerald-700 font-semibold'
              : 'text-neutral-600 hover:text-emerald-700 hover:bg-emerald-50'"
          >
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>

      <div class="flex items-center gap-2 shrink-0">
        <template v-if="auth.loggedIn.value">
          <NuxtLink to="/dashboard">
            <UButton
              size="sm"
              color="primary"
              variant="solid"
              icon="i-lucide-layout-dashboard"
            >
              <span class="hidden sm:inline">Dashboard</span>
            </UButton>
          </NuxtLink>
          <AppAvatar
            :name="auth.user.value?.name"
            :src="auth.user.value?.avatarPath"
            size="sm"
          />
        </template>
        <NuxtLink v-else to="/masuk">
          <UButton size="sm" color="primary" variant="solid" icon="i-lucide-log-in">
            <span class="hidden sm:inline">Masuk</span>
          </UButton>
        </NuxtLink>

        <button
          type="button"
          class="lg:hidden p-2 rounded-md hover:bg-neutral-100 transition cursor-pointer"
          aria-label="Buka menu"
          @click="mobileOpen = !mobileOpen"
        >
          <UIcon :name="mobileOpen ? 'i-lucide-x' : 'i-lucide-menu'" class="size-5" />
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
              class="block px-3 py-3 text-sm rounded-md"
              :class="isActive(link.to)
                ? 'text-emerald-700 font-semibold bg-emerald-50'
                : 'text-neutral-700 hover:bg-neutral-50'"
            >
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </Transition>
  </header>
</template>
