<script setup lang="ts">
type FaqItem = {
  question: string;
  answer: string;
};

const { data: faqs, error } = await useFetch<FaqItem[]>("/api/public/faqs", {
  key: "public-faqs",
  default: () => [],
});

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

useSeoMeta({
  title: "FAQ",
  description: "Pertanyaan yang sering diajukan tentang Omah Ngaji Al-Anshori.",
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
