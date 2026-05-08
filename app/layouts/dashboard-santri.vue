<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

const route = useRoute();
const auth = useAuth();

const mobileOpen = ref(false);

const writePath = "/dashboard/posts/create";

const navLinks = computed(() => {
  const items = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Artikel Saya", to: "/dashboard/posts" },
  ];
  if (auth.isReviewer.value) {
    items.push({ label: "Antrian Review", to: "/dashboard/review" });
  }
  items.push({ label: "Profil", to: "/dashboard/profile" });
  return items;
});

const dropdownItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: "Kembali ke Beranda",
      icon: "i-ph-house",
      to: "/",
    },
  ],
  [
    {
      label: "Profil",
      icon: "i-ph-user-circle",
      to: "/dashboard/profile",
    },
  ],
  [
    {
      label: "Keluar",
      icon: "i-ph-sign-out",
      color: "error",
      onSelect: () => auth.logout(),
    },
  ],
]);

watch(
  () => route.path,
  () => {
    mobileOpen.value = false;
  },
);

function isActive(to: string) {
  if (to === "/dashboard") {
    return route.path === "/dashboard";
  }
  return route.path === to || route.path.startsWith(`${to}/`);
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="border-b border-default bg-white">
      <UContainer class="flex h-20 items-center justify-between gap-8">
        <NuxtLink :to="auth.homePath.value" class="shrink-0 mr-4">
          <img
            src="/images/logo/logo_santri.png"
            alt="Omah Ngaji Al-Anshori"
            class="h-16 w-auto object-contain"
          />
        </NuxtLink>

        <ul class="hidden items-center gap-2 md:flex">
          <li
            v-for="item in navLinks"
            :key="String(item.to ?? item.label)"
            class="[&>a]:relative [&>a]:inline-flex [&>a]:h-9 [&>a]:items-center [&>a]:justify-center [&>a]:rounded-lg [&>a]:px-4 [&>a]:py-2 [&>a]:text-sm [&>a]:font-medium [&>a]:text-slate-700 [&>a]:transition-colors [&>a]:hover:text-brand-600 [&>a]:after:content-[''] [&>a]:after:absolute [&>a]:after:bottom-0 [&>a]:after:left-1/4 [&>a]:after:h-[3px] [&>a]:after:w-1/2 [&>a]:after:scale-x-0 [&>a]:after:rounded-full [&>a]:after:bg-brand-500 [&>a]:after:transition-transform [&>a]:after:duration-300 [&>a]:after:ease-in-out [&>a]:hover:after:scale-x-100 [&>a[aria-current=page]]:text-brand-600 [&>a[aria-current=page]]:after:scale-x-100"
          >
            <NuxtLink
              :to="item.to as string"
              :aria-current="isActive(item.to as string) ? 'page' : undefined"
            >
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>

        <div class="hidden md:flex items-center gap-6">
          <NuxtLink
            v-if="auth.canWritePenaSantri.value"
            :to="writePath"
            class="hidden shrink-0 md:block"
          >
            <UButton variant="light">
              <UIcon name="i-ph-pen-nib" size="16" class="mr-1" />
              Tulis Artikel
            </UButton>
          </NuxtLink>
          <UDropdownMenu :items="dropdownItems" :ui="{ content: 'min-w-52' }">
            <UButton variant="ghost" trailing-icon="i-ph-caret-down">
              <UAvatar
                :src="auth.user.value?.avatar ?? undefined"
                :alt="auth.user.value?.name ?? ''"
                :text="getInitials(auth.user.value?.name)"
                size="xs"
              />
              <span class="text-sm font-medium">{{
                auth.user.value?.name
              }}</span>
            </UButton>
          </UDropdownMenu>
        </div>

        <UButton
          class="ml-auto md:hidden"
          color="neutral"
          variant="ghost"
          icon="i-ph-list"
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
          <div
            class="flex items-center justify-between border-b border-default px-5 py-4"
          >
            <NuxtLink :to="auth.homePath.value" class="shrink-0">
              <img
                src="/images/logo/logo.png"
                alt="Omah Ngaji Al-Anshori"
                class="h-10 w-auto object-contain"
              />
            </NuxtLink>

            <UButton
              color="neutral"
              variant="ghost"
              icon="i-ph-x"
              aria-label="Tutup navigasi dashboard"
              @click="mobileOpen = false"
            />
          </div>

          <div class="flex flex-1 flex-col px-5 py-5">
            <nav class="flex flex-col gap-1">
              <NuxtLink
                v-if="auth.canWritePenaSantri.value"
                :to="writePath"
                class="mb-1"
              >
                <UButton
                  size="sm"
                  color="primary"
                  variant="solid"
                  icon="i-ph-pen-nib"
                  class="w-full justify-center"
                >
                  Tulis Artikel
                </UButton>
              </NuxtLink>
              <NuxtLink
                v-for="item in navLinks"
                :key="String(item.to ?? item.label)"
                :to="item.to as string"
                class="rounded-md px-3 py-3 text-sm transition-colors"
                :class="
                  isActive(item.to as string)
                    ? 'bg-primary/8 text-primary font-medium'
                    : 'text-muted hover:text-default hover:bg-slate-50'
                "
              >
                {{ item.label }}
              </NuxtLink>
            </nav>

            <div class="mt-auto border-t border-default pt-4">
              <div
                class="flex items-center gap-3 rounded-xl bg-slate-100/70 p-3"
              >
                <UAvatar
                  :src="auth.user.value?.avatar ?? undefined"
                  :alt="auth.user.value?.name ?? ''"
                  :text="getInitials(auth.user.value?.name)"
                  size="sm"
                />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">
                    {{ auth.user.value?.name }}
                  </p>
                  <p class="truncate text-xs text-dimmed">
                    {{ auth.user.value?.email }}
                  </p>
                </div>
              </div>

              <UButton
                color="error"
                variant="ghost"
                icon="i-ph-sign-out"
                class="mt-3 w-full justify-center"
                @click="auth.logout()"
              >
                Keluar
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </USlideover>

    <main class="py-6">
      <slot />
    </main>
  </div>
</template>
