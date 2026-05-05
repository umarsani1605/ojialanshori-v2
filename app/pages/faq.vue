<script setup lang="ts">
type FaqItem = {
  question: string;
  answer: string;
}

const { data: faqs, error } = await useFetch<FaqItem[]>('/api/public/faqs', {
  key: 'public-faqs',
  default: () => [],
})

if (error.value) {
  throw createError({
    statusCode: 500,
    statusMessage: 'Failed to load FAQ items',
    cause: error.value,
  })
}

const accordionItems = computed(() =>
  faqs.value.map((item, index) => ({
    label: item.question,
    content: item.answer,
    value: `faq-${index}`,
  })),
)

useSeoMeta({
  title: 'Frequently Asked Questions',
  description: 'Pertanyaan yang sering diajukan tentang Omah Ngaji Al-Anshori.',
})
</script>

<template>
  <section class="py-16 md:py-20">
    <UContainer>
      <div class="mx-auto max-w-6xl">
        <PublicSectionHeading title="Frequently Asked Questions" />

        <UAccordion
          v-if="accordionItems.length > 0"
          :items="accordionItems"
          default-value="faq-0"
          :unmount-on-hide="false"
          :ui="{
            root: 'space-y-5',
            item: 'rounded-3xl border border-default bg-white px-5 md:px-6',
            trigger: 'py-5 text-left text-lg font-semibold hover:text-brand-600 transition-colors',
            label: 'leading-8',
            content: 'pb-6',
            body: 'whitespace-pre-line text-base leading-8 text-muted',
          }"
        />

        <PublicEmptyState
          v-else
          title="Belum ada FAQ"
          description="Pertanyaan yang sering diajukan akan tampil di sini."
          icon="i-lucide-circle-help"
        />
      </div>
    </UContainer>
  </section>
</template>
