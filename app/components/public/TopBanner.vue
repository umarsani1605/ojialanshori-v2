<script setup lang="ts">
type Banner = {
  text: string;
  link: string | null;
};

const dismissed = ref(false);

onMounted(() => {
  if (typeof sessionStorage !== "undefined") {
    dismissed.value = sessionStorage.getItem("topBannerDismissed") === "1";
  }
});

const { data: banner } = await useFetch<Banner | null>("/api/public/banner", {
  key: "public-banner",
  default: () => null,
});

const visible = computed(() => !!banner.value && !dismissed.value);
</script>

<template>
  <div v-if="visible && banner" class="bg-slate-800 text-white text-sm font-ui">
    <div
      class="mx-auto flex max-w-7xl items-center justify-center gap-3 px-6 py-2.5 md:px-8 lg:px-10 relative"
    >
      <p class="text-center">
        {{ banner.text }}
        <NuxtLink
          v-if="banner.link"
          :to="banner.link"
          class="font-semibold underline underline-offset-2 hover:text-brand-50 ml-1"
        >
          Selengkapnya
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
