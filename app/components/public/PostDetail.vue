<script setup lang="ts">
type PostDetailData = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  publishedAt: string | Date | null;
  createdAt: string | Date;
  categorySlug: string;
  categoryName: string;
  categoryType: "berita" | "pena_santri";
  authorName: string;
};

const props = defineProps<{
  post: PostDetailData;
  backPath: string;
  backLabel: string;
}>();

const requestUrl = useRequestURL();
const postUrl = computed(() => requestUrl.href);

const dateFormatted = computed(() =>
  formatDateLong(props.post.publishedAt ?? props.post.createdAt),
);

const shareLinks = computed(() => ({
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl.value)}`,
  twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl.value)}&text=${encodeURIComponent(props.post.title)}`,
  whatsapp: `https://wa.me/?text=${encodeURIComponent(`${props.post.title} ${postUrl.value}`)}`,
  linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl.value)}`,
}));

const shareButtons = computed(() => [
  {
    label: "Facebook",
    href: shareLinks.value.facebook,
    icon: "i-simple-icons-facebook",
  },
  {
    label: "X (Twitter)",
    href: shareLinks.value.twitter,
    icon: "i-simple-icons-x",
  },
  {
    label: "WhatsApp",
    href: shareLinks.value.whatsapp,
    icon: "i-simple-icons-whatsapp",
  },
  {
    label: "LinkedIn",
    href: shareLinks.value.linkedin,
    icon: "i-simple-icons-linkedin",
  },
]);
</script>

<template>
  <article class="py-12 md:py-16">
    <UContainer>
      <div class="mx-auto max-w-3xl">
        <!-- Back navigation -->
        <NuxtLink
          :to="backPath"
          class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-slate-900 transition-colors mb-8"
        >
          <UIcon name="i-ph-arrow-left" class="size-4 shrink-0" />
          {{ backLabel }}
        </NuxtLink>

        <!-- Title -->
        <h1
          class="text-3xl font-bold leading-snug md:text-4xl md:leading-tight"
        >
          {{ post.title }}
        </h1>

        <!-- Meta -->
        <p class="mt-4 text-sm text-muted">
          oleh {{ post.authorName }}
          <span class="mx-2 text-dimmed">|</span>
          {{ dateFormatted }}
        </p>

        <!-- Featured Image -->
        <div class="mt-8 aspect-video overflow-hidden rounded-2xl bg-slate-100">
          <img
            v-if="post.featuredImage"
            :src="post.featuredImage"
            :alt="post.title"
            class="h-full w-full object-cover"
            loading="eager"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-dimmed"
          >
            <UIcon name="i-ph-image" class="size-14" />
          </div>
        </div>

        <!-- Article Body -->
        <div
          class="prose prose-neutral mt-10 max-w-none leading-relaxed break-words"
          v-html="post.content"
        />

        <!-- Share -->
        <div class="mt-12">
          <p class="mb-4 text-sm font-medium">Bagikan artikel:</p>
          <div class="flex flex-wrap gap-2">
            <a
              v-for="btn in shareButtons"
              :key="btn.label"
              :href="btn.href"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-50"
            >
              <UIcon :name="btn.icon" class="size-4 shrink-0" />
              {{ btn.label }}
            </a>
          </div>
        </div>

        <!-- Disqus -->
        <div class="mt-12 border-t border-slate-200 pt-8">
          <ClientOnly>
            <DisqusComments
              :identifier="post.slug"
              :url="postUrl"
              :title="post.title"
            />
          </ClientOnly>
        </div>
      </div>
    </UContainer>
  </article>
</template>
