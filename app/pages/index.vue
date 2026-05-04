<script setup lang="ts">
type Post = {
  id: number
  title: string
  slug: string
  excerpt: string | null
  featuredImage: string | null
  publishedAt: string | Date | null
  createdAt: string | Date
  categorySlug?: string
  authorName?: string
}

type Testimonial = {
  id: number
  name: string
  title: string
  content: string
  avatarPath: string | null
  order: number
}

type GalleryItem = {
  id: number
  title: string
  imagePath: string
  album: string | null
  order: number
}

const features = [
  {
    icon: 'i-lucide-graduation-cap',
    title: 'Kuliah sambil Ngaji',
    description: 'Tetap fokus belajar di kampus sambil memperdalam ilmu agama.',
  },
  {
    icon: 'i-lucide-book-open',
    title: "Ngaji Al-Qur'an dan Kitab",
    description: "Mengaji Al-Qur'an dan kitab kuning bersama asatidz pilihan.",
  },
  {
    icon: 'i-lucide-home',
    title: 'Rumah Baru, Keluarga Baru',
    description: 'Suasana hangat layaknya rumah kedua bersama santri lainnya.',
  },
  {
    icon: 'i-lucide-sparkles',
    title: 'Kegiatan Seru Lainnya',
    description: 'Aneka kegiatan keagamaan, sosial, dan pengembangan diri.',
  },
]

const [{ data: settings }, { data: testimonials }, { data: berita }, { data: pena }, { data: gallery }] = await Promise.all([
  useFetch<Record<string, string>>('/api/public/settings', { key: 'public-settings', default: () => ({}) }),
  useFetch<Testimonial[]>('/api/public/home/testimonials', { key: 'home-testimonials', default: () => [] }),
  useFetch<Post[]>('/api/public/home/posts-berita', { key: 'home-posts-berita', default: () => [] }),
  useFetch<Post[]>('/api/public/home/posts-pena', { key: 'home-posts-pena', default: () => [] }),
  useFetch<GalleryItem[]>('/api/public/home/gallery', { key: 'home-gallery', default: () => [] }),
])

const siteName = computed(() => settings.value?.site_name ?? 'Omah Ngaji Al-Anshori')
const siteTagline = computed(() => settings.value?.site_tagline ?? 'Pondok Pesantren')
const heroDescription = computed(() => settings.value?.hero_description
  ?? 'Tempat belajar Al-Qur\'an, kitab, dan akhlak — sambil tetap kuliah dan berkarya.')

const testimonialIndex = ref(0)
const currentTestimonial = computed(() => testimonials.value?.[testimonialIndex.value] ?? null)

function nextTestimonial() {
  if (!testimonials.value || testimonials.value.length === 0) return
  testimonialIndex.value = (testimonialIndex.value + 1) % testimonials.value.length
}
function prevTestimonial() {
  if (!testimonials.value || testimonials.value.length === 0) return
  testimonialIndex.value = (testimonialIndex.value - 1 + testimonials.value.length) % testimonials.value.length
}

const featureSection = ref<HTMLElement | null>(null)
function scrollToFeatures() {
  featureSection.value?.scrollIntoView({ behavior: 'smooth' })
}

const instagramUrl = computed(() => settings.value?.instagram_url ?? 'https://instagram.com/ojialanshori')
const youtubeUrl = computed(() => settings.value?.youtube_url ?? 'https://youtube.com/@ojialanshori')
const youtubeEmbed = computed(() => settings.value?.youtube_embed ?? '')

useSeoMeta({
  title: () => `${siteName.value} — ${siteTagline.value}`,
  description: () => heroDescription.value,
  ogTitle: () => `${siteName.value} — ${siteTagline.value}`,
  ogDescription: () => heroDescription.value,
  ogImage: () => settings.value?.og_image ?? '/logo.png',
})
</script>

<template>
  <div>
    <!-- 1. Hero -->
    <section class="bg-gradient-to-b from-emerald-600 to-emerald-700 text-white relative overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 py-16 md:py-24 text-center relative z-10">
        <p class="text-sm md:text-base text-emerald-100 uppercase tracking-widest">
          {{ siteTagline }}
        </p>
        <h1 class="mt-3 text-3xl md:text-5xl font-bold leading-tight">
          {{ siteName }}
        </h1>
        <p class="mt-6 text-base md:text-lg text-emerald-50 max-w-2xl mx-auto">
          {{ heroDescription }}
        </p>
        <UButton
          class="mt-8"
          color="neutral"
          variant="solid"
          size="lg"
          icon="i-lucide-arrow-down"
          @click="scrollToFeatures"
        >
          Kenali lebih dekat
        </UButton>
      </div>
      <!-- Decorative blobs -->
      <div class="absolute -top-12 -left-12 size-48 bg-emerald-400/30 rounded-full blur-3xl" />
      <div class="absolute bottom-0 -right-12 size-64 bg-emerald-300/20 rounded-full blur-3xl" />
    </section>

    <!-- 2. Fitur -->
    <section ref="featureSection" class="max-w-7xl mx-auto px-4 py-16">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="text-center"
        >
          <div class="mx-auto size-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UIcon :name="feature.icon" class="size-8" />
          </div>
          <h3 class="mt-4 font-semibold text-neutral-800 text-sm md:text-base">
            {{ feature.title }}
          </h3>
          <p class="mt-1 text-xs md:text-sm text-neutral-500">
            {{ feature.description }}
          </p>
        </div>
      </div>
    </section>

    <!-- 3. Testimoni Alumni -->
    <section
      v-if="testimonials && testimonials.length > 0"
      class="bg-neutral-50 py-16"
    >
      <div class="max-w-3xl mx-auto px-4 text-center">
        <h2 class="text-sm uppercase tracking-widest text-emerald-700 font-semibold">
          Kata Alumni
        </h2>
        <h3 class="mt-2 text-2xl md:text-3xl font-bold text-neutral-800">
          Suara dari Mereka
        </h3>

        <div
          v-if="currentTestimonial"
          class="mt-8 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-default"
        >
          <UIcon name="i-lucide-quote" class="size-8 text-emerald-200 mx-auto" />
          <p class="mt-4 text-neutral-700 leading-relaxed text-sm md:text-base">
            {{ currentTestimonial.content }}
          </p>
          <div class="mt-6 flex flex-col items-center gap-2">
            <AppAvatar
              :name="currentTestimonial.name"
              :src="currentTestimonial.avatarPath"
              size="xl"
            />
            <p class="font-semibold text-neutral-800">
              {{ currentTestimonial.name }}
            </p>
            <p class="text-sm text-neutral-500">
              {{ currentTestimonial.title }}
            </p>
          </div>
        </div>

        <div v-if="testimonials.length > 1" class="mt-6 flex items-center justify-center gap-3">
          <UButton
            icon="i-lucide-chevron-left"
            color="neutral"
            variant="outline"
            size="sm"
            aria-label="Sebelumnya"
            @click="prevTestimonial"
          />
          <span class="text-sm text-neutral-500">
            {{ testimonialIndex + 1 }} / {{ testimonials.length }}
          </span>
          <UButton
            icon="i-lucide-chevron-right"
            color="neutral"
            variant="outline"
            size="sm"
            aria-label="Selanjutnya"
            @click="nextTestimonial"
          />
        </div>
      </div>
    </section>

    <!-- 4. Berita Terbaru -->
    <section class="max-w-7xl mx-auto px-4 py-16">
      <div class="flex items-end justify-between mb-8">
        <div>
          <h2 class="text-sm uppercase tracking-widest text-emerald-700 font-semibold">
            Berita
          </h2>
          <h3 class="mt-1 text-2xl md:text-3xl font-bold text-neutral-800">
            Berita Terbaru
          </h3>
        </div>
        <NuxtLink
          to="/berita"
          class="text-sm text-emerald-700 font-medium hover:underline shrink-0"
        >
          Lainnya →
        </NuxtLink>
      </div>

      <div v-if="berita && berita.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PublicPostCard
          v-for="post in berita"
          :key="post.id"
          :post="post"
          base-path="/berita"
        />
      </div>
      <PublicEmptyState
        v-else
        title="Belum ada berita"
        description="Berita terbaru dari pondok akan tampil di sini."
        icon="i-lucide-newspaper"
      />
    </section>

    <!-- 5. Pena Santri -->
    <section class="bg-neutral-50 py-16">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-end justify-between mb-8">
          <div>
            <h2 class="text-sm uppercase tracking-widest text-emerald-700 font-semibold">
              Pena Santri
            </h2>
            <h3 class="mt-1 text-2xl md:text-3xl font-bold text-neutral-800">
              Karya Santri
            </h3>
          </div>
          <NuxtLink
            to="/pena-santri"
            class="text-sm text-emerald-700 font-medium hover:underline shrink-0"
          >
            Lainnya →
          </NuxtLink>
        </div>

        <div v-if="pena && pena.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PublicPostCard
            v-for="post in pena"
            :key="post.id"
            :post="post"
            base-path="/pena-santri"
          />
        </div>
        <PublicEmptyState
          v-else
          title="Belum ada karya"
          description="Karya santri akan ditampilkan di sini."
          icon="i-lucide-pen-line"
        />
      </div>
    </section>

    <!-- 6. Galeri -->
    <section class="max-w-7xl mx-auto px-4 py-16">
      <div class="flex items-end justify-between mb-8">
        <div>
          <h2 class="text-sm uppercase tracking-widest text-emerald-700 font-semibold">
            Galeri
          </h2>
          <h3 class="mt-1 text-2xl md:text-3xl font-bold text-neutral-800">
            Momen Pondok
          </h3>
        </div>
        <NuxtLink
          to="/galeri"
          class="text-sm text-emerald-700 font-medium hover:underline shrink-0"
        >
          Lihat semua →
        </NuxtLink>
      </div>

      <div v-if="gallery && gallery.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div
          v-for="item in gallery"
          :key="item.id"
          class="aspect-square rounded-lg overflow-hidden bg-neutral-100"
        >
          <NuxtImg
            :src="item.imagePath"
            :alt="item.title"
            loading="lazy"
            class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>
      <PublicEmptyState
        v-else
        title="Belum ada foto"
        description="Galeri foto kegiatan akan tampil di sini."
        icon="i-lucide-image"
      />
    </section>

    <!-- 7. Sosmed -->
    <section class="bg-emerald-50 py-16">
      <div class="max-w-3xl mx-auto px-4 text-center">
        <h2 class="text-sm uppercase tracking-widest text-emerald-700 font-semibold">
          Sosial Media
        </h2>
        <h3 class="mt-1 text-2xl md:text-3xl font-bold text-neutral-800">
          Ikuti Kami
        </h3>
        <p class="mt-3 text-neutral-600">
          Update kegiatan harian melalui sosial media kami.
        </p>

        <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a :href="instagramUrl" target="_blank" rel="noopener">
            <UButton size="lg" color="primary" variant="solid" icon="i-lucide-instagram">
              Instagram
            </UButton>
          </a>
          <a :href="youtubeUrl" target="_blank" rel="noopener">
            <UButton size="lg" color="error" variant="solid" icon="i-lucide-youtube">
              YouTube
            </UButton>
          </a>
        </div>

        <div
          v-if="youtubeEmbed"
          class="mt-10 rounded-xl overflow-hidden border border-default"
        >
          <div class="aspect-video" v-html="youtubeEmbed" />
        </div>
      </div>
    </section>
  </div>
</template>
