<template>
  <div class="flex min-h-screen bg-slate-50">
    <!-- Desktop Sidebar -->
    <div class="hidden lg:flex h-screen sticky top-0">
      <AppSidebar />
    </div>

    <!-- Mobile Sidebar -->
    <USlideover
      v-model:open="isSidebarOpen"
      side="left"
      :ui="{ content: 'w-64', overlay: 'bg-black/50' }"
    >
      <template #content>
        <AppSidebar />
      </template>
    </USlideover>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top Header Bar -->
      <header class="h-16 bg-white border-b border-default px-5 flex items-center sticky top-0 z-30">
        <!-- Mobile: hamburger + brand -->
        <div class="lg:hidden flex items-center justify-between w-full">
          <div class="flex items-center gap-3">
            <UButton
              icon="i-lucide-menu"
              variant="ghost"
              color="neutral"
              class="text-gray-500"
              @click="isSidebarOpen = !isSidebarOpen"
            />
            <span class="font-bold text-primary">Omah Ngaji</span>
          </div>
          <div class="flex items-center gap-2">
            <UBadge :color="roleColor" variant="subtle" size="xs">{{ roleLabel }}</UBadge>
            <UDropdownMenu :items="dropdownItems" :ui="{ content: 'min-w-[200px]' }">
              <UButton trailing-icon="i-lucide-chevron-down" color="neutral" variant="ghost" size="sm">
                <span class="font-medium text-gray-700 text-sm">{{ auth.user.value?.name?.split(' ')[0] }}</span>
              </UButton>
              <template #profile>
                <slot name="profile-slot">
                  <ProfileDropdownContent />
                </slot>
              </template>
            </UDropdownMenu>
          </div>
        </div>

        <!-- Desktop: user info di kanan -->
        <div class="hidden lg:flex items-center w-full justify-end gap-3">
          <UBadge :color="roleColor" variant="subtle" size="sm">{{ roleLabel }}</UBadge>
          <UDropdownMenu :items="dropdownItems" :ui="{ content: 'min-w-[240px]', item: 'cursor-pointer gap-3' }">
            <UButton trailing-icon="i-lucide-chevron-down" color="neutral" variant="ghost" size="md">
              <span class="font-semibold text-sm text-gray-700">{{ auth.user.value?.name }}</span>
            </UButton>
            <template #profile>
              <div class="flex items-center gap-3 px-1">
                <div class="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <span class="text-primary-700 text-sm font-bold uppercase">{{ userInitial }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="font-medium text-gray-800 text-sm">{{ auth.user.value?.name }}</span>
                  <span class="text-xs text-gray-400">{{ auth.user.value?.email }}</span>
                </div>
              </div>
            </template>
          </UDropdownMenu>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto p-6 space-y-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RoleColor } from '~/utils/roleDisplay'

const isSidebarOpen = ref(false)
const route = useRoute()
const auth = useAuth()

const userInitial = computed(() => auth.user.value?.name?.charAt(0) ?? '?')
const userRole = computed(() => auth.user.value?.role ?? '')
const roleLabel = computed(() => roleLabelMap[userRole.value] ?? userRole.value)
const roleColor = computed<RoleColor>(() => roleColorMap[userRole.value] ?? 'primary')

const dropdownItems = computed(() => [
  [
    {
      label: auth.user.value?.name || 'Profil',
      icon: 'i-lucide-circle-user-round',
      slot: 'profile',
      onSelect: () => navigateTo('/dashboard/profile'),
    },
  ],
  [
    {
      label: 'Logout',
      icon: 'i-lucide-log-out',
      color: 'error' as const,
      onSelect: () => auth.logout(),
    },
  ],
])

// Tutup sidebar mobile setiap kali rute berubah
watch(() => route.path, () => {
  isSidebarOpen.value = false
})
</script>
