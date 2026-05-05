<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const route = useRoute()
const auth = useAuth()

const mobileOpen = ref(false)

const firstName = computed(() => auth.user.value?.name?.trim().split(/\s+/)[0] || 'User')

const navItems = [
  { label: 'Dashboard', to: '/dashboard', exact: true },
  { label: 'Post Saya', to: '/dashboard/posts' },
  { label: 'Profil', to: '/dashboard/profile' },
] as const

const dropdownItems = computed<DropdownMenuItem[][]>(() => [[
  {
    label: 'Profil Saya',
    icon: 'i-lucide-user',
    to: '/dashboard/profile',
  },
  {
    label: 'Keluar',
    icon: 'i-lucide-log-out',
    color: 'error',
    onSelect: () => auth.logout(),
  },
]])

watch(() => route.path, () => {
  mobileOpen.value = false
})

function isActive(to: string, exact = false) {
  if (exact) {
    return route.path === to
  }

  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50">
    <header class="sticky top-0 z-40 h-[60px] border-b border-neutral-200 bg-white">
      <UContainer class="flex h-full items-center gap-4 px-5">
        <NuxtLink to="/dashboard" class="shrink-0">
          <img
            src="/images/logo/logo1.png"
            alt="Omah Ngaji Al-Anshori"
            class="h-[42px] w-auto object-contain"
          >
        </NuxtLink>

        <div class="hidden min-w-0 flex-1 items-center gap-2 md:flex">
          <UButton
            to="/dashboard/posts/create"
            color="primary"
            icon="i-lucide-pen-line"
            size="sm"
            class="shrink-0"
          >
            Tulis Post
          </UButton>

          <nav class="flex min-w-0 items-center">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="flex h-[60px] items-center border-b-2 px-3.5 text-sm font-medium transition-colors"
              :class="isActive(item.to, item.exact) ? 'border-primary-500 text-primary-600' : 'border-transparent text-muted hover:text-neutral-900'"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>

        <div class="ml-auto hidden items-center md:flex">
          <UDropdownMenu :items="dropdownItems" :ui="{ content: 'min-w-52' }">
            <button
              type="button"
              class="flex items-center gap-2 rounded-lg border border-neutral-200 px-2 py-1 transition-colors hover:bg-neutral-100"
            >
              <AppAvatar
                :name="auth.user.value?.name"
                :src="auth.user.value?.avatar"
                size="xs"
              />
              <span class="text-sm font-medium">{{ firstName }}</span>
              <UIcon name="i-lucide-chevron-down" class="size-4 text-muted" />
            </button>
          </UDropdownMenu>
        </div>

        <UButton
          class="ml-auto md:hidden"
          color="neutral"
          variant="ghost"
          icon="i-lucide-menu"
          aria-label="Buka navigasi dashboard"
          @click="mobileOpen = true"
        />
      </UContainer>
    </header>

    <USlideover
      v-model:open="mobileOpen"
      side="left"
      :ui="{ content: 'w-full max-w-xs', overlay: 'bg-black/50' }"
    >
      <template #content>
        <div class="flex h-full flex-col bg-white">
          <div class="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <NuxtLink to="/dashboard" class="shrink-0">
              <img
                src="/images/logo/logo1.png"
                alt="Omah Ngaji Al-Anshori"
                class="h-10 w-auto object-contain"
              >
            </NuxtLink>

            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              aria-label="Tutup navigasi dashboard"
              @click="mobileOpen = false"
            />
          </div>

          <div class="flex flex-1 flex-col px-5 py-5">
            <UButton
              to="/dashboard/posts/create"
              color="primary"
              icon="i-lucide-pen-line"
              class="justify-center"
            >
              Tulis Post
            </UButton>

            <nav class="mt-5 flex flex-col border-t border-neutral-200 pt-3">
              <NuxtLink
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                class="rounded-lg px-3 py-3 text-sm font-medium transition-colors"
                :class="isActive(item.to, item.exact) ? 'bg-primary-50 text-primary-600' : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'"
              >
                {{ item.label }}
              </NuxtLink>
            </nav>

            <div class="mt-auto border-t border-neutral-200 pt-4">
              <div class="flex items-center gap-3 rounded-xl border border-neutral-200 p-3">
                <AppAvatar
                  :name="auth.user.value?.name"
                  :src="auth.user.value?.avatar"
                  size="sm"
                />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold">{{ auth.user.value?.name }}</p>
                  <p class="truncate text-xs text-dimmed">{{ auth.user.value?.email }}</p>
                </div>
              </div>

              <div class="mt-3 flex flex-col gap-2">
                <UButton
                  to="/dashboard/profile"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-user"
                  class="justify-center"
                >
                  Profil Saya
                </UButton>
                <UButton
                  color="error"
                  variant="ghost"
                  icon="i-lucide-log-out"
                  class="justify-center"
                  @click="auth.logout()"
                >
                  Keluar
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </template>
    </USlideover>

    <main class="min-h-[calc(100vh-60px)] bg-neutral-50">
      <slot />
    </main>
  </div>
</template>
