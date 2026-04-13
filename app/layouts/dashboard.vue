<script setup lang="ts">
import type { RoleColor } from '~/utils/roleDisplay'

const auth = useAuth()
const { mainLinks, footerLinks } = useNavigation()

const sidebarCollapsed = ref(false)

const userRole = computed(() => auth.user.value?.role ?? '')
const roleLabel = computed(() => roleLabelMap[userRole.value] ?? userRole.value)
const roleColor = computed<RoleColor>(() => roleColorMap[userRole.value] ?? 'primary')

const navItems = computed(() => [mainLinks.value, footerLinks.value])
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar
      v-model:collapsed="sidebarCollapsed"
      resizable
      collapsible
      :min-size="14"
      :default-size="18"
      :max-size="24"
    >
      <!-- Logo -->
      <template #header>
        <div class="flex items-center gap-2 px-3 py-2">
          <img
            src="/logo.png"
            alt="Omah Ngaji Al-Anshori"
            class="h-8 w-8 shrink-0 object-contain"
          >
          <span
            v-if="!sidebarCollapsed"
            class="text-sm font-semibold text-neutral-800 leading-tight line-clamp-2"
          >
            Omah Ngaji<br>Al-Anshori
          </span>
        </div>
      </template>

      <!-- Navigation -->
      <UNavigationMenu
        :items="navItems"
        orientation="vertical"
        :collapsed="sidebarCollapsed"
        color="neutral"
        :highlight="true"
        highlight-color="primary"
        class="w-full px-1"
      />

      <!-- User info + logout -->
      <template #footer>
        <div
          class="flex items-center gap-2 px-3 py-3 border-t border-default"
          :class="sidebarCollapsed ? 'justify-center' : ''"
        >
          <UAvatar
            :src="auth.user.value?.avatarPath ?? undefined"
            :alt="auth.user.value?.name ?? ''"
            size="sm"
            class="shrink-0"
          />
          <div
            v-if="!sidebarCollapsed"
            class="flex-1 min-w-0"
          >
            <p class="text-sm font-medium text-neutral-800 truncate">
              {{ auth.user.value?.name }}
            </p>
            <UBadge
              :color="roleColor"
              variant="subtle"
              size="xs"
              class="mt-0.5"
            >
              {{ roleLabel }}
            </UBadge>
          </div>
          <UButton
            v-if="!sidebarCollapsed"
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Keluar"
            @click="auth.logout()"
          />
          <UTooltip
            v-else
            text="Keluar"
            :content="{ side: 'right' }"
          >
            <UButton
              icon="i-lucide-log-out"
              color="neutral"
              variant="ghost"
              size="xs"
              aria-label="Keluar"
              @click="auth.logout()"
            />
          </UTooltip>
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
