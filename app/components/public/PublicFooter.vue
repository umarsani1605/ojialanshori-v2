<script setup lang="ts">
const props = defineProps<{
  settings?: Record<string, string> | null
}>()

const navLinks = [
  { label: 'Beranda', to: '/' },
  { label: 'Profil', to: '/profil' },
  { label: 'Kegiatan', to: '/kegiatan' },
  { label: 'Berita', to: '/berita' },
  { label: 'Pena Santri', to: '/pena-santri' },
  { label: 'Kontak', to: '/kontak' },
  { label: 'FAQ', to: '/faq' },
]

const year = new Date().getFullYear()

const instagramUrl = computed(() => props.settings?.instagram_url ?? 'https://instagram.com/ojialanshori')
const youtubeUrl = computed(() => props.settings?.youtube_url ?? 'https://youtube.com/@ojialanshori')
const address = computed(() => props.settings?.address ?? '')
const mapsEmbed = computed(() => props.settings?.maps_embed ?? '')
</script>

<template>
  <footer class="bg-emerald-700 text-white mt-16">
    <div class="max-w-7xl mx-auto px-4 py-10">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Brand -->
        <div>
          <div class="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Omah Ngaji Al-Anshori"
              class="h-10 w-10 object-contain bg-white rounded-full p-1"
            >
            <p class="font-bold leading-tight">
              Omah Ngaji<br>Al-Anshori
            </p>
          </div>
          <p
            v-if="address"
            class="mt-4 text-sm text-emerald-100"
          >
            {{ address }}
          </p>
        </div>

        <!-- Nav -->
        <div>
          <h4 class="text-sm font-semibold uppercase tracking-wide text-emerald-100">
            Halaman
          </h4>
          <ul class="mt-3 space-y-2">
            <li v-for="link in navLinks" :key="link.to">
              <NuxtLink
                :to="link.to"
                class="text-sm text-emerald-50 hover:text-white"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Social + maps -->
        <div>
          <h4 class="text-sm font-semibold uppercase tracking-wide text-emerald-100">
            Sosial Media
          </h4>
          <div class="mt-3 flex gap-3">
            <a
              :href="instagramUrl"
              target="_blank"
              rel="noopener"
              class="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
              aria-label="Instagram"
            >
              <UIcon name="i-lucide-instagram" class="size-5" />
            </a>
            <a
              :href="youtubeUrl"
              target="_blank"
              rel="noopener"
              class="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
              aria-label="YouTube"
            >
              <UIcon name="i-lucide-youtube" class="size-5" />
            </a>
          </div>
          <div
            v-if="mapsEmbed"
            class="mt-4 rounded-lg overflow-hidden"
          >
            <div class="aspect-video" v-html="mapsEmbed" />
          </div>
        </div>
      </div>

      <div class="mt-10 pt-6 border-t border-emerald-600 text-center text-xs text-emerald-100">
        © {{ year }} Omah Ngaji Al-Anshori. All rights reserved.
      </div>
    </div>
  </footer>
</template>
