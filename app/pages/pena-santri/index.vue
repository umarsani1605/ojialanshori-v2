<script setup lang="ts">
type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  publishedAt: string | Date | null;
  createdAt: string | Date;
  categorySlug?: string;
  categoryName?: string;
  authorName?: string;
};

type PostListingResponse = {
  data: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const route = useRoute();
const currentPage = computed(() => Math.max(1, Number(route.query.page) || 1));

const { data: listing, error } = await useFetch<PostListingResponse>('/api/public/posts/pena-santri', {
  key: () => `public-pena-santri-page-${currentPage.value}`,
  query: computed(() => ({
    page: currentPage.value,
    limit: 9,
  })),
  default: () => ({
    data: [],
    pagination: {
      page: 1,
      limit: 9,
      total: 0,
      totalPages: 1,
    },
  }),
});

if (error.value) {
  throw createError({
    statusCode: 500,
    statusMessage: 'Failed to load pena santri listing',
    cause: error.value,
  });
}

useSeoMeta({
  title: 'Blog',
  description: 'Kumpulan tulisan dan refleksi dari santri Omah Ngaji Al-Anshori.',
});
</script>

<template>
  <section class="py-16 md:py-20">
    <UContainer>
      <div class="mx-auto max-w-6xl">
        <PublicSectionHeading title="Blog" />

        <UPageGrid v-if="listing.data.length > 0" class="gap-10 md:gap-12">
          <PublicPostCard
            v-for="post in listing.data"
            :key="post.id"
            :post="post"
            base-path="/pena-santri"
          />
        </UPageGrid>

        <PublicEmptyState
          v-else
          title="Belum ada tulisan"
          description="Tulisan santri akan tampil di sini ketika sudah tersedia."
          icon="i-lucide-book-open-text"
        />

        <div class="mt-14 flex justify-center">
          <PublicPagination
            :page="listing.pagination.page"
            :total-pages="listing.pagination.totalPages"
          />
        </div>
      </div>
    </UContainer>
  </section>
</template>
