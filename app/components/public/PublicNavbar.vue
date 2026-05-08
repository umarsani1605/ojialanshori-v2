<script setup lang="ts">
const auth = useAuth();
const route = useRoute();

const navLinks = [
  { label: "Beranda", to: "/" },
  { label: "Profil", to: "/profil" },
  { label: "Kegiatan", to: "/kegiatan" },
  { label: "Berita", to: "/berita" },
  { label: "Pena Santri", to: "/pena-santri" },
  { label: "Kontak", to: "/kontak" },
  { label: "FAQ", to: "/faq" },
];

const mobileOpen = ref(false);

watch(
  () => route.path,
  () => {
    mobileOpen.value = false;
  },
);

function isActive(to: string) {
  if (to === "/") {
    return route.path === "/";
  }

  return route.path === to || route.path.startsWith(`${to}/`);
}
</script>

<template>
  <header
    class="bg-white/95 backdrop-blur-md border-b border-default shadow-xs"
  >
    <nav
      class="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-6 md:px-8 lg:px-10"
    >
      <NuxtLink to="/" class="flex items-center gap-3 shrink-0">
        <img
          src="/images/logo/logo.png"
          alt="Omah Ngaji Al-Anshori"
          class="h-12 w-auto object-contain"
        />
      </NuxtLink>

      <!-- Desktop nav -->
      <ul class="hidden lg:flex items-center gap-2">
        <li
          v-for="link in navLinks"
          :key="link.to"
          class="[&>a]:relative [&>a]:inline-flex [&>a]:h-9 [&>a]:items-center [&>a]:justify-center [&>a]:rounded-lg [&>a]:px-4 [&>a]:py-2 [&>a]:text-sm [&>a]:font-medium [&>a]:text-slate-700 [&>a]:transition-colors [&>a]:hover:text-brand-600 [&>a]:after:content-[''] [&>a]:after:absolute [&>a]:after:bottom-0 [&>a]:after:left-1/4 [&>a]:after:h-[3px] [&>a]:after:w-1/2 [&>a]:after:scale-x-0 [&>a]:after:rounded-full [&>a]:after:bg-brand-500 [&>a]:after:transition-transform [&>a]:after:duration-300 [&>a]:after:ease-in-out [&>a]:hover:after:scale-x-100 [&>a[aria-current=page]]:text-brand-600 [&>a[aria-current=page]]:after:scale-x-100"
        >
          <NuxtLink
            :to="link.to"
            :aria-current="isActive(link.to) ? 'page' : undefined"
          >
            {{ link.label }}
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
              icon="i-ph-squares-four"
            >
              Dashboard
            </UButton>
          </NuxtLink>
        </template>
        <NuxtLink v-else to="/masuk">
          <UButton
            size="md"
            color="primary"
            variant="solid"
            icon="i-ph-user"
          >
            Masuk
          </UButton>
        </NuxtLink>

        <button
          type="button"
          class="lg:hidden p-2 rounded-md hover:bg-slate-100 transition cursor-pointer"
          aria-label="Buka menu"
          @click="mobileOpen = !mobileOpen"
        >
          <UIcon
            :name="mobileOpen ? 'i-ph-x' : 'i-ph-list'"
            class="size-6"
          />
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
        class="absolute top-20 left-0 right-0 lg:hidden border-t border-default bg-white"
      >
        <ul class="px-4 py-2">
          <li v-for="link in navLinks" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="block px-3 py-3 font-ui text-sm rounded-md"
              :class="
                isActive(link.to)
                  ? 'text-brand-600 font-semibold bg-brand-50'
                  : 'hover:bg-slate-50'
              "
            >
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </Transition>
  </header>
</template>
