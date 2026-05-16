<script setup lang="ts">
type PageMetaResponse = {
  title: string;
  meta: Record<string, any>;
  updatedAt: string | null;
};

type Activity = {
  id: number;
  title: string;
  description: string | null;
  imagePath: string;
  order: number;
};

const [{ data: page }, { data: programs }] = await Promise.all([
  useFetch<PageMetaResponse>("/api/public/pages/activities", {
    key: "public-page-activities",
    default: () => ({ title: "Kegiatan", meta: {}, updatedAt: null }),
    getCachedData: (key, nuxtApp) => nuxtApp.isHydrating ? nuxtApp.payload.data[key] : undefined,
  }),
  useFetch<Activity[]>("/api/public/activities", {
    key: "public-activities",
    default: () => [],
    getCachedData: (key, nuxtApp) => nuxtApp.isHydrating ? nuxtApp.payload.data[key] : undefined,
  }),
]);

const seoTitle = computed(
  () => page.value?.title || "Kegiatan — Omah Ngaji Al-Anshori",
);
const seoDescription = computed(() => {
  const fromMeta = String(page.value?.meta?.description ?? "").trim();
  if (fromMeta) return fromMeta;
  const first = programs.value?.[0]?.description?.trim();
  return (
    first ||
    "Program kegiatan rutin Omah Ngaji Al-Anshori — dari ngaji Al-Qur'an, kitab kuning, diskusi tematik, hingga pengembangan diri."
  );
});

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogImage: "/images/logo/logo.png",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <div class="bg-slate-50">
    <UContainer class="py-12 md:py-16">
      <section>
        <PublicSectionHeading title="Kegiatan" />

        <div
          v-if="programs && programs.length > 0"
          class="space-y-20 md:space-y-16"
        >
          <div
            v-for="(program, idx) in programs"
            :key="program.id"
            class="flex flex-col md:flex-row gap-6 md:gap-10 items-start"
          >
            <!-- Image -->
            <div
              class="flex-none h-72 w-full max-w-120 rounded-2xl overflow-hidden bg-slate-100 aspect-4/3"
              :class="idx % 2 === 1 ? 'md:order-2' : ''"
            >
              <NuxtImg
                v-if="isManagedImage(program.imagePath)"
                :src="program.imagePath"
                :alt="program.title"
                width="480"
                height="360"
                sizes="sm:100vw md:480px"
                format="webp"
                :loading="idx === 0 ? 'eager' : 'lazy'"
                :fetchpriority="idx === 0 ? 'high' : 'auto'"
                class="w-full h-full object-cover"
              />
              <img
                v-else
                :src="program.imagePath"
                :alt="program.title"
                :loading="idx === 0 ? 'eager' : 'lazy'"
                :fetchpriority="idx === 0 ? 'high' : 'auto'"
                decoding="async"
                class="w-full h-full object-cover"
              />
            </div>

            <!-- Text -->
            <div
              class="flex flex-col justify-center gap-3 mt-0 md:mt-12"
              :class="idx % 2 === 1 ? 'md:order-1' : ''"
            >
              <h3 class="font-bold text-xl md:text-2xl">{{ program.title }}</h3>
              <p
                v-if="program.description"
                class="text-base text-slate-700 leading-relaxed"
              >
                {{ program.description }}
              </p>
            </div>
          </div>
        </div>

        <PublicEmptyState
          v-else
          title="Belum ada program kegiatan"
          description="Program kegiatan akan tampil di sini setelah ditambahkan."
          icon="i-ph-calendar"
        />
      </section>
    </UContainer>
  </div>
</template>
