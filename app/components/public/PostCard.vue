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
  authorName?: string;
};

const props = defineProps<{
  post: Post;
  basePath?: string;
}>();

const href = computed(
  () => `${props.basePath ?? "/berita"}/${props.post.slug}`,
);

const dateFormatted = computed(() =>
  formatDateLong(props.post.publishedAt ?? props.post.createdAt),
);
</script>

<template>
  <NuxtLink :to="href" class="group flex flex-col">
    <div class="aspect-3/2 bg-slate-100 rounded-2xl overflow-hidden">
      <img
        v-if="post.featuredImage"
        :src="post.featuredImage"
        :alt="post.title"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center text-dimmed"
      >
        <UIcon name="i-ph-image" class="size-10" />
      </div>
    </div>
    <h3
      class="text-xl font-bold line-clamp-2 mt-6 transition-colors group-hover:text-primary"
    >
      {{ post.title }}
    </h3>
    <div class="text-base text-muted mt-4">
      <span>{{ post.authorName }} • {{ dateFormatted }}</span>
    </div>
  </NuxtLink>
</template>
