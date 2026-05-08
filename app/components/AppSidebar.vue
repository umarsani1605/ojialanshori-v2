<template>
  <aside class="w-64 h-full flex bg-white border-r border-default flex-col">
    <!-- Logo -->
    <div class="h-18 flex items-center px-6 border-b border-default shrink-0">
      <NuxtLink
        :to="auth.homePath.value"
        class="text-xl font-bold text-primary"
      >
        Omah Ngaji
      </NuxtLink>
    </div>

    <!-- Navigation Links -->
    <UScrollArea class="flex-1 py-4 px-3">
      <ul class="space-y-0.5">
        <li v-for="item in navLinks" :key="item.to as string">
          <NuxtLink
            :to="item.to as string"
            class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative"
            :class="[
              isActive(item.to as string)
                ? 'bg-primary-50 text-primary-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
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
  </aside>
</template>

<script setup lang="ts">
import type { RoleColor } from "~/constants/roleDisplay";

const route = useRoute();
const auth = useAuth();

const navLinks = computed(() => {
  const items = [
    { label: "Beranda", icon: "i-ph-house", to: "/admin" },
    { label: "Semua Artikel", icon: "i-ph-files", to: "/admin/posts" },
    { label: "Kategori", icon: "i-ph-tag", to: "/admin/categories" },
    { label: "Galeri", icon: "i-ph-image", to: "/admin/gallery" },
    { label: "Banner", icon: "i-ph-megaphone", to: "/admin/banner" },
  ];
  if (auth.isAdmin.value) {
    items.push(
      { label: "Halaman Statis", icon: "i-ph-layout", to: "/admin/pages" },
      { label: "Users", icon: "i-ph-users", to: "/admin/users" },
      { label: "Pengaturan", icon: "i-ph-gear", to: "/admin/settings" },
    );
  }
  return items;
});

const profileLink = {
  label: "Profil Saya",
  icon: "i-ph-user-circle",
  to: "/admin/profile",
};

const userInitial = computed(() => auth.user.value?.name?.charAt(0) ?? "?");
const userRole = computed(() => auth.user.value?.role ?? "");
const roleLabel = computed(
  () => roleLabelMap[userRole.value] ?? userRole.value,
);
const roleColor = computed<RoleColor>(
  () => roleColorMap[userRole.value] ?? "primary",
);

function isActive(to: string) {
  if (to === "/admin") {
    return route.path === "/admin";
  }
  return route.path === to || route.path.startsWith(`${to}/`);
}
</script>

<style scoped>
.sidebar-scroll::-webkit-scrollbar {
  width: 0;
}
</style>
