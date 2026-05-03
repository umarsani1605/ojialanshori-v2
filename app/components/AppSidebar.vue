<template>
  <aside class="w-64 h-full flex bg-white border-r border-default flex-col">
    <!-- Logo -->
    <div class="h-18 flex items-center px-6 border-b border-default shrink-0">
      <NuxtLink to="/dashboard" class="text-xl font-bold text-primary">
        Omah Ngaji
      </NuxtLink>
    </div>

    <!-- Navigation Links -->
    <UScrollArea class="flex-1 py-4 px-3">
      <ul class="space-y-0.5">
        <li v-for="item in mainLinks" :key="item.to as string">
          <NuxtLink
            :to="item.to as string"
            class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative"
            :class="[
              isActive(item.to as string)
                ? 'bg-primary-50 text-primary-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            ]"
          >
            <!-- Active indicator bar -->
            <span
              v-if="isActive(item.to as string)"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-primary-500 rounded-r-full"
            />
            <UIcon :name="item.icon as string" class="w-4.5 h-4.5 shrink-0" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </li>
      </ul>
    </UScrollArea>

    <!-- Footer: Profil + User Info -->
    <div class="border-t border-default shrink-0">
      <!-- Profil Saya link -->
      <div class="px-3 pt-3 pb-2">
        <li v-for="item in footerLinks" :key="item.to as string" class="list-none">
          <NuxtLink
            :to="item.to as string"
            class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative"
            :class="[
              isActive(item.to as string)
                ? 'bg-primary-50 text-primary-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            ]"
          >
            <span
              v-if="isActive(item.to as string)"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-primary-500 rounded-r-full"
            />
            <UIcon :name="item.icon as string" class="w-4.5 h-4.5 shrink-0" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </li>
      </div>

      <!-- User info + logout -->
      <div class="px-4 pb-4 pt-1 flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
          <span class="text-primary-700 text-xs font-bold uppercase">{{ userInitial }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-800 truncate">{{ auth.user.value?.name }}</p>
          <UBadge :color="roleColor" variant="subtle" size="xs">{{ roleLabel }}</UBadge>
        </div>
        <UButton
          icon="i-lucide-log-out"
          variant="ghost"
          color="neutral"
          size="sm"
          class="text-gray-400 hover:text-red-500 shrink-0"
          title="Logout"
          @click="auth.logout()"
        />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { RoleColor } from '~/utils/roleDisplay'

const route = useRoute()
const auth = useAuth()
const { mainLinks, footerLinks } = useNavigation()

const userInitial = computed(() => auth.user.value?.name?.charAt(0) ?? '?')
const userRole = computed(() => auth.user.value?.role ?? '')
const roleLabel = computed(() => roleLabelMap[userRole.value] ?? userRole.value)
const roleColor = computed<RoleColor>(() => roleColorMap[userRole.value] ?? 'primary')

function isActive(to: string) {
  if (to === '/dashboard') {
    return route.path === '/dashboard'
  }
  return route.path.startsWith(to)
}
</script>

<style scoped>
.sidebar-scroll::-webkit-scrollbar {
  width: 0;
}
</style>
