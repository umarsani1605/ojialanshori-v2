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
  categoryParentSlug?: string | null;
  authorName?: string;
  authorUsername?: string;
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

type GalleryItem = {
  id: number;
  title: string;
  imagePath: string;
  order: number;
};

const features = [
  { image: "/images/icons/icon-1.png", title: "Kuliah sambil Ngaji" },
  { image: "/images/icons/icon-3.png", title: "Ngaji Al-Qur'an dan Kitab" },
  { image: "/images/icons/icon-4.png", title: "Rumah Baru, Keluarga Baru" },
  { image: "/images/icons/icon-2.png", title: "Kegiatan Seru Lainnya" },
];

type PageMetaResponse = {
  title: string;
  meta: Record<string, any>;
  updatedAt: string | null;
};

type TestimonialDto = {
  id: number;
  name: string;
  title: string;
  content: string;
  avatarPath: string | null;
  order: number;
};

const [
  { data: settings },
  { data: page },
  { data: testimonials },
  { data: gallery },
] = await Promise.all([
  useFetch<Record<string, string>>("/api/public/settings", {
    key: "public-settings",
    default: () => ({}),
    getCachedData: (key, nuxtApp) => nuxtApp.isHydrating ? nuxtApp.payload.data[key] : undefined,
  }),
  useFetch<PageMetaResponse>("/api/public/pages/home", {
    key: "public-page-home",
    default: () => ({ title: "Beranda", meta: {}, updatedAt: null }),
    getCachedData: (key, nuxtApp) => nuxtApp.isHydrating ? nuxtApp.payload.data[key] : undefined,
  }),
  useFetch<TestimonialDto[]>("/api/public/testimonials", {
    key: "public-testimonials",
    default: () => [],
    getCachedData: (key, nuxtApp) => nuxtApp.isHydrating ? nuxtApp.payload.data[key] : undefined,
  }),
  useFetch<GalleryItem[]>("/api/public/gallery", {
    key: "home-gallery",
    default: () => [],
    getCachedData: (key, nuxtApp) => nuxtApp.isHydrating ? nuxtApp.payload.data[key] : undefined,
  }),
]);

const maxNews = computed(() => {
  const raw = Number(page.value?.meta?.maxNews);
  return Number.isFinite(raw) && raw > 0 ? Math.min(12, raw) : 4;
});
const maxPena = computed(() => {
  const raw = Number(page.value?.meta?.maxPena);
  return Number.isFinite(raw) && raw > 0 ? Math.min(12, raw) : 4;
});

const [{ data: berita, error: beritaError }, { data: pena, error: penaError }] =
  await Promise.all([
    useFetch<PostListingResponse>("/api/public/posts", {
      key: "home-posts-berita",
      query: {
        type: "berita",
        page: 1,
        limit: maxNews,
      },
      default: () => ({
        data: [],
        pagination: { page: 1, limit: 4, total: 0, totalPages: 1 },
      }),
      getCachedData: (key, nuxtApp) => nuxtApp.isHydrating ? nuxtApp.payload.data[key] : undefined,
    }),
    useFetch<PostListingResponse>("/api/public/posts", {
      key: "home-posts-pena",
      query: {
        type: "pena_santri",
        page: 1,
        limit: maxPena,
      },
      default: () => ({
        data: [],
        pagination: { page: 1, limit: 4, total: 0, totalPages: 1 },
      }),
      getCachedData: (key, nuxtApp) => nuxtApp.isHydrating ? nuxtApp.payload.data[key] : undefined,
    }),
  ]);

if (beritaError.value) {
  throw createError({
    statusCode: 500,
    statusMessage: "Failed to load homepage berita posts",
    cause: beritaError.value,
  });
}

if (penaError.value) {
  throw createError({
    statusCode: 500,
    statusMessage: "Failed to load homepage pena santri posts",
    cause: penaError.value,
  });
}

const siteName = computed(
  () =>
    String(page.value?.meta?.title ?? "").trim() ||
    settings.value?.site_name ||
    "Omah Ngaji Al-Anshori",
);
const siteTagline = computed(
  () =>
    String(page.value?.meta?.subtitle ?? "").trim() ||
    settings.value?.site_tagline ||
    "Asrama Mahasiswa",
);
const heroDescription = computed(
  () =>
    String(page.value?.meta?.description ?? "").trim() ||
    settings.value?.hero_description ||
    "Omah Ngaji Al-Anshori adalah asrama mahasiswa yang bertujuan untuk mengembangkan karakter dan spiritualitas mahasiswa.",
);

function scrollToFeatures() {
  const el = document.getElementById("kenalan");
  el?.scrollIntoView({ behavior: "smooth" });
}

const instagramUrl = computed(
  () =>
    settings.value?.instagram_url ??
    settings.value?.contact_instagram_url ??
    "https://www.instagram.com/omahngaji_",
);
const youtubeUrl = computed(
  () =>
    settings.value?.youtube_url ??
    settings.value?.contact_youtube_url ??
    "https://youtube.com/@ojialanshori",
);
const youtubeEmbedUrl = computed(
  () =>
    settings.value?.youtube_embed_url ??
    "https://www.youtube.com/embed/8_yx6vHuLSg",
);

const visibleGallery = computed(() => gallery.value?.slice(0, 8) ?? []);
const galleryLightbox = useGalleryLightbox(visibleGallery);

useSeoMeta({
  title: () => siteTagline.value || "Pesantren Mahasiswa Surakarta",
  description: () => heroDescription.value,
  ogTitle: () => `${siteName.value} — ${siteTagline.value}`,
  ogDescription: () => heroDescription.value,
  ogImage: () =>
    String(page.value?.meta?.ogImage ?? "").trim() ||
    settings.value?.og_image ||
    "/images/logo/logo.png",
  twitterCard: "summary_large_image",
});

</script>

<template>
  <div class="font-sans">
    <!-- 1. Hero — green gradient + Arabic letter ornaments (CSS bg, not LCP) -->
    <section class="hero-gradient relative overflow-hidden text-white">
      <!-- Decorative ornaments via CSS background — keluar dari kandidat LCP -->
      <div
        aria-hidden="true"
        class="hero-ornament hero-ornament-lt absolute top-0 left-0 w-32 md:w-52 aspect-square opacity-90 pointer-events-none"
      />
      <div
        aria-hidden="true"
        class="hero-ornament hero-ornament-lb absolute bottom-0 left-0 w-32 md:w-52 aspect-square opacity-90 pointer-events-none"
      />
      <div
        aria-hidden="true"
        class="hero-ornament hero-ornament-rt absolute top-12 right-0 w-44 md:w-72 aspect-square opacity-90 pointer-events-none"
      />
      <div
        aria-hidden="true"
        class="hero-ornament hero-ornament-rb absolute bottom-0 right-0 w-44 md:w-72 aspect-square opacity-90 pointer-events-none"
      />

      <UPageHero
        orientation="horizontal"
        reverse
        class="relative z-10 py-10"
        :ui="{
          container: 'py-8 sm:py-14 lg:py-16 gap-12 lg:gap-16 items-center',
          wrapper: 'items-start',
          headline:
            'text-lg md:text-xl font-semibold text-white/90 text-center md:text-left',
          title:
            'font-ui text-2xl lg:text-4xl font-extrabold text-white tracking-wide text-center md:text-left',
          description:
            'text-base md:text-lg text-white/85 max-w-xl leading-relaxed text-center md:text-left',
          links: 'mt-2 justify-center md:justify-start',
        }"
      >
        <template #headline>
          <span>
            {{ siteTagline }}
          </span>
        </template>
        <template #title>
          {{ siteName }}
        </template>
        <template #description>
          {{ heroDescription }}
        </template>
        <template #links>
          <UButton
            href="/profil"
            variant="ghost"
            trailing-icon="i-ph-arrow-right"
            class="px-3 py-2 rounded-xl text-white border border-white hover:text-primary hover:bg-white active:text-primary active:bg-white"
          >
            Kenali lebih dekat
          </UButton>
        </template>

        <!-- Default slot = the visual on the opposite side of text (logo) -->
        <div class="flex justify-start md:justify-center">
          <NuxtImg
            src="/images/logo/logo_white.png"
            alt="Omah Ngaji Al-Anshori"
            width="500"
            height="316"
            sizes="sm:180px md:384px"
            format="webp"
            loading="eager"
            fetchpriority="high"
            preload
            class="max-w-[180px] md:max-w-sm object-contain"
          />
        </div>
      </UPageHero>
    </section>

    <!-- 2. Fitur -->
    <section id="kenalan" class="py-10 md:py-16">
      <UContainer>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="group flex flex-col items-center text-center p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-sm hover:-translate-y-2 transition-all duration-300"
          >
            <div
              class="size-24 md:size-28 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500"
            >
              <NuxtImg
                :src="feature.image"
                :alt="feature.title"
                width="96"
                height="96"
                format="webp"
                loading="lazy"
                class="size-20 md:size-24 object-contain"
              />
            </div>
            <h4 class="text-base md:text-lg font-semibold">
              {{ feature.title }}
            </h4>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- 3. Kata Alumni -->
    <section v-if="testimonials.length > 0" class="bg-[#f9fafb] py-10 md:py-16">
      <UContainer>
        <h2 class="font-bold text-xl md:text-2xl tracking-wide mb-10 md:mb-14">
          Kata Alumni
        </h2>
        <UCarousel
          v-slot="{ item }"
          :items="testimonials"
          :autoplay="{ delay: 6000 }"
          loop
          arrows
          dots
          prev-icon="i-ph-caret-left"
          next-icon="i-ph-caret-right"
          :prev="{ variant: 'ghost', color: 'neutral' }"
          :next="{ variant: 'ghost', color: 'neutral' }"
          :ui="{
            root: 'group/testimonials relative',
            prev: 'absolute left-6! rounded-full opacity-0 pointer-events-none transition-opacity duration-200 group-hover/testimonials:opacity-100 group-hover/testimonials:pointer-events-auto group-focus-within/testimonials:opacity-100 group-focus-within/testimonials:pointer-events-auto',
            next: 'absolute right-6! rounded-full opacity-0 pointer-events-none transition-opacity duration-200 group-hover/testimonials:opacity-100 group-hover/testimonials:pointer-events-auto group-focus-within/testimonials:opacity-100 group-focus-within/testimonials:pointer-events-auto',
          }"
        >
          <figure class="max-w-3xl mx-auto px-4 text-center">
            <blockquote class="text-base md:text-lg leading-relaxed mb-8">
              &ldquo;{{ item.content }}&rdquo;
            </blockquote>
            <NuxtImg
              v-if="isManagedImage(item.avatarPath)"
              :src="item.avatarPath"
              :alt="item.name"
              width="64"
              height="64"
              format="webp"
              loading="lazy"
              class="size-16 rounded-full object-cover mx-auto mb-3"
            />
            <img
              v-else-if="item.avatarPath"
              :src="item.avatarPath"
              :alt="item.name"
              loading="lazy"
              decoding="async"
              width="64"
              height="64"
              class="size-16 rounded-full object-cover mx-auto mb-3"
            />
            <figcaption>
              <p class="font-bold">{{ item.name }}</p>
              <p class="text-sm text-dimmed mt-1">{{ item.title }}</p>
            </figcaption>
          </figure>
        </UCarousel>
      </UContainer>
    </section>

    <!-- 4. Berita Terbaru -->
    <section class="py-10 md:py-16">
      <UContainer>
        <PublicSectionHeading title="Berita">
          <template #action>
            <NuxtLink
              to="/berita"
              class="text-default hover:text-slate-800 flex items-center gap-2 transition-colors"
            >
              Lainnya
              <UIcon name="i-ph-caret-right" class="size-4" />
            </NuxtLink>
          </template>
        </PublicSectionHeading>

        <div
          v-if="berita.data.length > 0"
          class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8"
        >
          <PublicPostCard
            v-for="post in berita.data"
            :key="post.id"
            :post="post"
            base-path="/berita"
          />
        </div>
        <PublicEmptyState
          v-else
          title="Belum ada berita"
          icon="i-ph-newspaper"
        />
      </UContainer>
    </section>

    <!-- 5. Pena Santri -->
    <section class="py-10 md:py-16">
      <UContainer>
        <PublicSectionHeading title="Pena Santri">
          <template #action>
            <NuxtLink
              to="/pena-santri"
              class="text-default hover:text-slate-800 flex items-center gap-2 transition-colors"
            >
              Lainnya
              <UIcon name="i-ph-caret-right" class="size-4" />
            </NuxtLink>
          </template>
        </PublicSectionHeading>

        <div
          v-if="pena.data.length > 0"
          class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8"
        >
          <PublicPostCard
            v-for="post in pena.data"
            :key="post.id"
            :post="post"
            base-path="/pena-santri"
          />
        </div>
        <PublicEmptyState v-else title="Belum ada karya" icon="i-ph-pen-nib" />
      </UContainer>
    </section>

    <!-- 6. Galeri -->
    <section class="py-10 md:py-16">
      <UContainer>
        <PublicSectionHeading title="Galeri" />

        <div
          v-if="visibleGallery.length > 0"
          class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8"
        >
          <button
            v-for="(item, index) in visibleGallery"
            :key="item.id"
            type="button"
            class="aspect-3/2 rounded-2xl overflow-hidden bg-slate-100 group relative text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            :aria-label="`Lihat foto ${item.title}`"
            @click="galleryLightbox.open(index)"
          >
            <img
              :src="item.imagePath"
              :alt="item.title"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div
              class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 to-transparent px-4 py-3 text-sm font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              {{ item.title }}
            </div>
          </button>
        </div>
        <PublicEmptyState
          v-else
          title="Belum ada foto"
          description="Galeri foto kegiatan akan tampil di sini."
          icon="i-ph-image"
        />
      </UContainer>
    </section>

    <PublicGalleryLightbox
      v-model:open="galleryLightbox.isOpen.value"
      :items="visibleGallery"
      :active-index="galleryLightbox.activeIndex.value"
      @close="galleryLightbox.close"
      @prev="galleryLightbox.prev"
      @next="galleryLightbox.next"
    />

    <!-- 7. Instagram -->
    <section class="py-10 md:py-16">
      <UContainer>
        <PublicSectionHeading title="Instagram" />
        <a
          :href="instagramUrl"
          target="_blank"
          rel="noopener"
          class="group flex flex-col md:flex-row gap-6 items-center justify-between text-center p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-sm hover:-translate-y-2 transition-all duration-300"
        >
          <div class="flex items-start gap-5">
            <div
              class="size-16 rounded-2xl flex items-center justify-center shrink-0 text-slate-600"
            >
              <UIcon name="i-ph-instagram-logo" class="size-full" />
            </div>
            <div class="text-left">
              <h4 class="font-bold text-lg md:text-xl mb-0.5">@omahngaji_</h4>
              <p class="font-ui text-sm text-muted">
                Akun Resmi Omah Ngaji Al-Anshori Surakarta
              </p>
            </div>
          </div>
          <div
            class="font-semibold bg-brand-500 text-white group-hover:bg-brand-600 px-4 py-1.5 rounded-lg transition-colors"
          >
            Ikuti Kami
          </div>
        </a>
      </UContainer>
    </section>

    <!-- 8. Youtube -->
    <section class="py-10 md:py-16">
      <UContainer>
        <PublicSectionHeading title="Youtube" />

        <div class="aspect-video rounded-2xl overflow-hidden bg-slate-100">
          <iframe
            :src="youtubeEmbedUrl"
            title="YouTube video Omah Ngaji Al-Anshori"
            class="w-full h-full"
            frameborder="0"
            allow="
              accelerometer;
              autoplay;
              clipboard-write;
              encrypted-media;
              gyroscope;
              picture-in-picture;
              web-share;
            "
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          />
        </div>
      </UContainer>
    </section>
  </div>
</template>

<style scoped>
.hero-gradient {
  background: linear-gradient(180deg, #88de87 0%, #29c4a9 100%);
}
.hero-ornament {
  background-repeat: no-repeat;
  background-size: contain;
}
.hero-ornament-lt {
  background-image: url("/images/hero/hero-left-top.png");
  background-position: top left;
}
.hero-ornament-lb {
  background-image: url("/images/hero/hero-left-bottom.png");
  background-position: bottom left;
}
.hero-ornament-rt {
  background-image: url("/images/hero/hero-right-top.png");
  background-position: top right;
}
.hero-ornament-rb {
  background-image: url("/images/hero/hero-right-bottom.png");
  background-position: bottom right;
}
</style>
