<script setup lang="ts">
import type { NavigationMenuItem, DropdownMenuItem } from "@nuxt/ui";
import type { RoleColor } from "~/constants/roleDisplay";

const route = useRoute();
const auth = useAuth();
const open = ref(false);

const userInitial = computed(() => auth.user.value?.name?.charAt(0) ?? "?");
const userRole = computed(() => auth.user.value?.role ?? "");
const roleLabel = computed(
  () => roleLabelMap[userRole.value] ?? userRole.value,
);
const roleColor = computed<RoleColor>(
  () => roleColorMap[userRole.value] ?? "primary",
);

const dropdownItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: "Kembali ke Beranda",
      icon: "i-ph-house-duotone",
      to: "/",
    },
  ],
  [
    {
      label: "Profil",
      icon: "i-ph-user-circle-duotone",
      slot: "profile" as const,
      onSelect: () => navigateTo(auth.profilePath.value),
    },
  ],
  [
    {
      label: "Keluar",
      icon: "i-ph-sign-out-duotone",
      color: "error" as const,
      onSelect: () => auth.logout(),
    },
  ],
]);

function isActive(to: string, exact = false) {
  if (exact || to === "/admin") return route.path === to;
  return route.path === to || route.path.startsWith(`${to}/`);
}

const navLinks = computed<NavigationMenuItem[]>(() => {
  const items: NavigationMenuItem[] = [
    {
      label: "Beranda",
      icon: "i-ph-house-duotone",
      to: "/admin",
      active: isActive("/admin", true),
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Berita",
      icon: "i-ph-newspaper-duotone",
      to: "/admin/berita",
      active: isActive("/admin/berita"),
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Pena Santri",
      icon: "i-ph-pen-nib-duotone",
      to: "/admin/pena-santri",
      active: isActive("/admin/pena-santri"),
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Kategori",
      icon: "i-ph-tag-duotone",
      to: "/admin/categories",
      active: isActive("/admin/categories"),
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Galeri",
      icon: "i-ph-images-duotone",
      to: "/admin/gallery",
      active: isActive("/admin/gallery"),
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Banner",
      icon: "i-ph-megaphone-duotone",
      to: "/admin/banner",
      active: isActive("/admin/banner"),
      onSelect: () => {
        open.value = false;
      },
    },
  ];
  if (auth.isAdmin.value) {
    items.push(
      {
        label: "Halaman Publik",
        icon: "i-ph-article-duotone",
        to: "/admin/pages",
        active: isActive("/admin/pages"),
        onSelect: () => {
          open.value = false;
        },
      },
      {
        label: "Users",
        icon: "i-ph-users-duotone",
        to: "/admin/users",
        active: isActive("/admin/users"),
        onSelect: () => {
          open.value = false;
        },
      },
      {
        label: "Pengaturan",
        icon: "i-ph-gear-duotone",
        to: "/admin/settings",
        active: isActive("/admin/settings"),
        onSelect: () => {
          open.value = false;
        },
      },
    );
  }
  return items;
});

const navMenuUi = {
  item: "relative px-4 after:absolute after:left-0 after:top-1/2 after:-translate-y-1/2 after:w-1 after:h-[90%] after:rounded-r-full after:transition-colors has-[[aria-current=page]]:after:bg-primary",
};

watch(
  () => route.path,
  () => {
    open.value = false;
  },
);
</script>

<template>
  <UDashboardGroup unit="%">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      resizable
      collapsible
      :default-size="14"
      class="bg-white"
      :ui="{
        header: 'border-b border-default h-18!',
        body: 'py-8 px-0',
        footer: 'lg:border-t lg:border-default',
      }"
    >
      <template #header="{ collapsed }">
        <div
          class="flex items-center h-14 w-full"
          :class="collapsed ? 'justify-center' : 'px-4'"
        >
          <NuxtLink
            :to="auth.homePath.value"
            class="flex items-center justify-center w-full"
          >
            <NuxtImg
              v-if="!collapsed"
              src="/images/logo/logo.png"
              alt="Omah Ngaji"
              class="h-9 w-auto"
            />
            <NuxtImg
              v-else
              src="/images/logo/logo_small.png"
              alt="Omah Ngaji"
              class="h-8 w-auto"
            />
          </NuxtLink>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="navLinks"
          :ui="navMenuUi"
          orientation="vertical"
          tooltip
        />
      </template>

      <template #footer="{ collapsed }">
        <UDashboardSidebarCollapse
          icon="i-ph-sidebar-simple-duotone"
          :label="collapsed ? '' : 'Collapse'"
          :ui="{ base: 'text-dimmed' }"
        />
      </template>
    </UDashboardSidebar>

    <UDashboardPanel
      id="main"
      :ui="{
        body: 'p-2 sm:p-6',
      }"
    >
      <template #header>
        <UDashboardNavbar
          :title="(route.meta.navbarTitle as string) || ''"
          :ui="{ right: 'gap-3' }"
          class="bg-white h-18!"
        >
          <template #right>
            <UDropdownMenu :items="dropdownItems" :modal="false">
              <button
                class="flex items-center gap-2 rounded-lg p-2 hover:bg-gray-100 transition-colors"
              >
                <div
                  class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0"
                >
                  <span class="text-primary-700 text-sm font-bold uppercase">{{
                    userInitial
                  }}</span>
                </div>
                <span
                  class="hidden sm:block text-sm font-medium text-gray-700"
                  >{{ auth.user.value?.name }}</span
                >
                <UIcon
                  name="i-ph-caret-down-duotone"
                  class="hidden sm:block size-4 text-muted"
                />
              </button>
              <template #profile>
                <div class="flex items-center gap-3 px-1">
                  <div
                    class="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0"
                  >
                    <span
                      class="text-primary-700 text-sm font-bold uppercase"
                      >{{ userInitial }}</span
                    >
                  </div>
                  <div class="flex flex-col">
                    <span class="font-medium text-gray-800 text-sm">{{
                      auth.user.value?.name
                    }}</span>
                    <span class="text-xs text-gray-400">{{
                      auth.user.value?.email
                    }}</span>
                  </div>
                </div>
              </template>
            </UDropdownMenu>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
