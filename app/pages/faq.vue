<script setup lang="ts">
type FaqItem = {
  question: string;
  answer: string;
};

type PageMetaResponse = {
  title: string;
  meta: Record<string, any>;
  updatedAt: string | null;
};

const [{ data: faqs, error }, { data: page }] = await Promise.all([
  useFetch<FaqItem[]>("/api/public/faqs", {
    key: "public-faqs",
    default: () => [],
    getCachedData: (key, nuxtApp) => nuxtApp.isHydrating ? nuxtApp.payload.data[key] : undefined,
  }),
  useFetch<PageMetaResponse>("/api/public/pages/faq", {
    key: "public-page-faq",
    default: () => ({ title: "FAQ", meta: {}, updatedAt: null }),
    getCachedData: (key, nuxtApp) => nuxtApp.isHydrating ? nuxtApp.payload.data[key] : undefined,
  }),
]);

if (error.value) {
  throw createError({
    statusCode: 500,
    statusMessage: "Failed to load FAQ items",
    cause: error.value,
  });
}

const accordionItems = computed(() =>
  faqs.value.map((item, index) => ({
    label: item.question,
    content: item.answer,
    value: `faq-${index}`,
  })),
);

const seoTitle = computed(() => page.value?.title || "FAQ");
const seoDescription = computed(
  () =>
    String(page.value?.meta?.description ?? "").trim() ||
    "Pertanyaan yang sering diajukan tentang Omah Ngaji Al-Anshori.",
);

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
  <section class="py-16 md:py-20">
    <UContainer>
      <div class="mx-auto max-w-6xl">
        <PublicSectionHeading title="Frequently Asked Questions" />

        <UAccordion
          v-if="accordionItems.length > 0"
          :items="accordionItems"
          :ui="{
            root: 'space-y-4',
            item: 'rounded-2xl border border-default bg-white px-5 md:px-6 border-b!',
            trigger: 'cursor-pointer text-lg',
            body: 'text-base',
          }"
        />

        <PublicEmptyState
          v-else
          title="Belum ada FAQ"
          description="Pertanyaan yang sering diajukan akan tampil di sini."
          icon="i-ph-question"
        />
      </div>
    </UContainer>
  </section>
</template>
