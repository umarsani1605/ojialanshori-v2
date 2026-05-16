<script setup lang="ts">
type PageMetaResponse = {
  title: string;
  meta: Record<string, any>;
  updatedAt: string | null;
};

type BoardMember = {
  id: number;
  name: string;
  role: string;
  avatarPath: string | null;
  order: number;
};

const [{ data: page }, { data: members }] = await Promise.all([
  useFetch<PageMetaResponse>("/api/public/pages/profile", {
    key: "public-page-profile",
    default: () => ({ title: "Profil", meta: {}, updatedAt: null }),
    getCachedData: (key, nuxtApp) => nuxtApp.isHydrating ? nuxtApp.payload.data[key] : undefined,
  }),
  useFetch<BoardMember[]>("/api/public/board-members", {
    key: "public-board-members",
    default: () => [],
    getCachedData: (key, nuxtApp) => nuxtApp.isHydrating ? nuxtApp.payload.data[key] : undefined,
  }),
]);

function toLines(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  const raw = String(value ?? "").trim();
  if (!raw) return [];
  return raw
    .split(/\n{2,}|\r?\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

const overviewParagraphs = computed(() =>
  toLines(page.value?.meta?.overview),
);
const visi = computed(() => String(page.value?.meta?.vision ?? "").trim());
const misiItems = computed(() => toLines(page.value?.meta?.mission));

const penasehat = computed(() =>
  (members.value ?? []).filter((m) => m.role === "Penasehat"),
);
const pengajar = computed(() =>
  (members.value ?? []).filter((m) => m.role === "Pengajar"),
);

const seoTitle = computed(
  () => page.value?.title || "Profil — Omah Ngaji Al-Anshori",
);
const seoDescription = computed(() => {
  const fromMeta = String(page.value?.meta?.description ?? "").trim();
  if (fromMeta) return fromMeta;
  const firstParagraph = overviewParagraphs.value[0];
  return (
    firstParagraph ||
    "Selayang pandang, visi, misi, dan struktur pengurus Omah Ngaji Al-Anshori — asrama mahasiswa berbasis pesantren di Surakarta."
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
      <!-- Selayang Pandang -->
      <section v-if="overviewParagraphs.length > 0" class="mb-16">
        <PublicSectionHeading title="Selayang Pandang" />
        <div class="space-y-4 text-base leading-relaxed text-slate-700">
          <p v-for="(p, idx) in overviewParagraphs" :key="idx">{{ p }}</p>
        </div>
      </section>

      <!-- Visi -->
      <section v-if="visi" class="mb-16">
        <PublicSectionHeading title="Visi" />
        <p class="text-base text-slate-700">{{ visi }}</p>
      </section>

      <!-- Misi -->
      <section v-if="misiItems.length > 0" class="mb-16">
        <PublicSectionHeading title="Misi" />
        <ol class="space-y-2 text-base text-slate-700">
          <li v-for="(item, idx) in misiItems" :key="idx">
            {{ idx + 1 }}. {{ item }}
          </li>
        </ol>
      </section>

      <!-- Struktur Pengurus -->
      <section v-if="penasehat.length > 0 || pengajar.length > 0">
        <PublicSectionHeading title="Struktur Pengurus" />

        <div v-if="penasehat.length > 0" class="mb-12">
          <h3 class="font-bold text-lg mb-8">Penasehat:</h3>
          <div
            class="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-10 text-left"
          >
            <PublicProfileFigure
              v-for="person in penasehat"
              :key="person.id"
              :image="person.avatarPath || '/images/placeholder.png'"
              :name="person.name"
            />
          </div>
        </div>

        <div v-if="pengajar.length > 0">
          <h3 class="font-bold text-lg mb-8">Pengajar:</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-10">
            <PublicProfileFigure
              v-for="person in pengajar"
              :key="person.id"
              :image="person.avatarPath || '/images/placeholder.png'"
              :name="person.name"
            />
          </div>
        </div>
      </section>
    </UContainer>
  </div>
</template>
