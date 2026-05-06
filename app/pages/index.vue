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
  album: string | null;
  order: number;
};

const features = [
  { image: "/images/icons/icon-1.png", title: "Kuliah sambil Ngaji" },
  { image: "/images/icons/icon-3.png", title: "Ngaji Al-Qur'an dan Kitab" },
  { image: "/images/icons/icon-4.png", title: "Rumah Baru, Keluarga Baru" },
  { image: "/images/icons/icon-2.png", title: "Kegiatan Seru Lainnya" },
];

const testimonials = [
  {
    name: "Asmaul Khusna, S.Pd.",
    role: "Penerima Beasiswa LPDP Magister Program Monash University",
    avatar: "/images/testimonials/khusna.jpg",
    quote:
      "Omah Ngaji adalah rumah kedua bagi Khusna. Tempat dimana Khusna bertumbuh, belajar mengaji dan nilai-nilai kehidupan. Omah ngaji itu ‘adem’, erat dengan rasa kekeluargaannya. Terutama, bapak dan ibu yang senantiasa membimbing dengan penuh kasih, serta teman-teman yang saling mendukung, membuat Omah Ngaji menjadi support system terbesar bagi Khusna.",
  },
  {
    name: "Putri Lestari, S.Pd.",
    role: "Penerima Beasiswa LPDP MSc Social Anthropology, The University of Edinburgh",
    avatar: "/images/testimonials/putri.jpg",
    quote:
      "Di sela-sela kesibukan dalam aktivitas kemahasiswaan, Omah Ngaji merupakan oase bagi saya selama di Solo. Saya tidak sekadar mengaji namun juga diberi ruang mengasah nalar berpikir melalui diskusi dan pelatihan untuk meningkatkan skill. Tidak berhenti pada ilmu praktis, saya juga belajar tentang kebermanfaatan di sini. Banyak kenangan dan kebersamaan bersama guru dan sahabat yang tidak hanya terpatri dalam memori, namun juga memberikan hikmah dalam kehidupan saya.",
  },
  {
    name: "Eka Wulan Safriani, S.Pd.",
    role: "Penerima Beasiswa LPDP Magister Program UPI",
    avatar: "/images/testimonials/eka.jpg",
    quote:
      "Bagi saya omah ngaji bukan hanya sekedar tempat melepas istirahat dari padatnya aktivitas kampus, tapi lebih dari itu. Omah ngaji menjadi sebuah rumah untuk menimba ilmu agama, rumah untuk membuka wawasan, rumah untuk tumbuh bersama, bahkan selama saya di Omah Ngaji, saya menemukan figure-figure yang membuat saya terdorong dan termotivasi untuk terus berprestasi di akademik dan aktif terlibat kegiatan sosial di masyarakat. Bahkan ada satu nilai dari omah ngaji yang terus saya pegang sampai sekarang, yakni ilmu dan adab.",
  },
];

const [
  { data: settings },
  { data: berita, error: beritaError },
  { data: pena, error: penaError },
  { data: gallery },
] = await Promise.all([
  useFetch<Record<string, string>>("/api/public/settings", {
    key: "public-settings",
    default: () => ({}),
  }),
  useFetch<PostListingResponse>("/api/public/posts", {
    key: "home-posts-berita",
    query: {
      type: "berita",
      page: 1,
      limit: 4,
    },
    default: () => ({
      data: [],
      pagination: {
        page: 1,
        limit: 4,
        total: 0,
        totalPages: 1,
      },
    }),
  }),
  useFetch<PostListingResponse>("/api/public/posts", {
    key: "home-posts-pena",
    query: {
      type: "pena_santri",
      page: 1,
      limit: 4,
    },
    default: () => ({
      data: [],
      pagination: {
        page: 1,
        limit: 4,
        total: 0,
        totalPages: 1,
      },
    }),
  }),
  useFetch<GalleryItem[]>("/api/public/gallery", {
    key: "home-gallery",
    default: () => [],
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
  () => settings.value?.site_name ?? "Omah Ngaji Al-Anshori",
);
const siteTagline = computed(
  () => settings.value?.site_tagline ?? "Asrama Mahasiswa",
);
const heroDescription = computed(
  () =>
    settings.value?.hero_description ??
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
  title: () => `${siteName.value} — ${siteTagline.value}`,
  description: () => heroDescription.value,
  ogTitle: () => `${siteName.value} — ${siteTagline.value}`,
  ogDescription: () => heroDescription.value,
  ogImage: () => settings.value?.og_image ?? "/images/logo/logo1.png",
});
</script>

<template>
  <div class="font-sans">
    <!-- 1. Hero — green gradient + Arabic letter ornaments -->
    <section class="hero-gradient relative overflow-hidden text-white">
      <!-- Decorative ornaments — white Arabic letters & shapes on green bg -->
      <NuxtImg
        src="/images/hero/hero-left-top.png"
        alt=""
        aria-hidden="true"
        class="absolute top-6 left-0 w-32 md:w-52 opacity-90 pointer-events-none select-none"
      />
      <NuxtImg
        src="/images/hero/hero-left-bottom.png"
        alt=""
        aria-hidden="true"
        class="absolute bottom-0 left-0 w-32 md:w-52 opacity-90 pointer-events-none select-none"
      />
      <NuxtImg
        src="/images/hero/hero-right-top.png"
        alt=""
        aria-hidden="true"
        class="absolute top-12 right-0 w-44 md:w-72 opacity-90 pointer-events-none select-none"
      />
      <NuxtImg
        src="/images/hero/hero-right-bottom.png"
        alt=""
        aria-hidden="true"
        class="absolute bottom-0 right-0 w-44 md:w-72 opacity-90 pointer-events-none select-none"
      />

      <UPageHero
        orientation="horizontal"
        reverse
        class="relative z-10 py-10"
        :ui="{
          container: 'py-14 sm:py-16 lg:py-18 gap-12 lg:gap-16 items-center',
          wrapper: 'items-start',
          headline: 'text-xl font-semibold text-white/90',
          title:
            'font-ui text-xl md:text-2xl lg:text-4xl font-extrabold text-white tracking-wide',
          description:
            'text-base md:text-lg text-white/85 max-w-xl leading-relaxed',
          links: 'mt-2',
        }"
      >
        <template #headline>
          <span class="flex items-center gap-3">
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
            variant="ghost"
            icon="i-lucide-arrow-down"
            class="px-3 py-2 rounded-xl text-white border border-white hover:text-primary hover:bg-white"
            @click="scrollToFeatures"
          >
            Kenali lebih dekat
          </UButton>
        </template>

        <!-- Default slot = the visual on the opposite side of text (logo) -->
        <div class="flex justify-center">
          <NuxtImg
            src="/images/logo/logo3.png"
            alt="Omah Ngaji Al-Anshori"
            class="max-w-sm object-contain"
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
    <section class="bg-[#f9fafb] py-10 md:py-16">
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
          prev-icon="i-lucide-chevron-left"
          next-icon="i-lucide-chevron-right"
          :prev="{ variant: 'ghost', color: 'neutral' }"
          :next="{ variant: 'ghost', color: 'neutral' }"
          :ui="{
            root: 'group/testimonials relative',
            prev: 'absolute rounded-full opacity-0 pointer-events-none transition-opacity duration-200 group-hover/testimonials:opacity-100 group-hover/testimonials:pointer-events-auto group-focus-within/testimonials:opacity-100 group-focus-within/testimonials:pointer-events-auto',
            next: 'absolute rounded-full opacity-0 pointer-events-none transition-opacity duration-200 group-hover/testimonials:opacity-100 group-hover/testimonials:pointer-events-auto group-focus-within/testimonials:opacity-100 group-focus-within/testimonials:pointer-events-auto',
          }"
        >
          <div class="max-w-3xl mx-auto px-4 text-center">
            <p class="text-base md:text-lg leading-relaxed mb-8">
              &ldquo;{{ item.quote }}&rdquo;
            </p>
            <NuxtImg
              :src="item.avatar"
              :alt="item.name"
              class="size-16 rounded-full object-cover mx-auto mb-3"
              loading="lazy"
            />
            <p class="font-bold">
              {{ item.name }}
            </p>
            <p class="text-sm text-dimmed mt-1">
              {{ item.role }}
            </p>
          </div>
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
              <UIcon name="i-lucide-chevron-right" class="size-4" />
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
          icon="i-lucide-newspaper"
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
              <UIcon name="i-lucide-chevron-right" class="size-4" />
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
        <PublicEmptyState
          v-else
          title="Belum ada karya"
          icon="i-lucide-pen-line"
        />
      </UContainer>
    </section>

    <!-- 6. Galeri -->
    <section class="py-10 md:py-16">
      <UContainer>
        <PublicSectionHeading title="Galeri">
          <template #action>
            <NuxtLink
              to="/galeri"
              class="text-default hover:text-slate-800 flex items-center gap-2 transition-colors"
            >
              Lainnya
              <UIcon name="i-lucide-chevron-right" class="size-4" />
            </NuxtLink>
          </template>
        </PublicSectionHeading>

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
            <NuxtImg
              :src="item.imagePath"
              :alt="item.title"
              loading="lazy"
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
          icon="i-lucide-image"
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
          class="group flex flex-col md:flex-row gap-6 items-center text-center p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-sm hover:-translate-y-2 transition-all duration-300"
        >
          <div class="flex items-center gap-5">
            <div
              class="size-14 rounded-2xl border border-default flex items-center justify-center shrink-0 text-slate-700"
            >
              <UIcon name="i-lucide-instagram" class="size-8" />
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
</style>
