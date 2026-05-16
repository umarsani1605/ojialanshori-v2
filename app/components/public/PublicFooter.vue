<script setup lang="ts">
const props = defineProps<{
  settings?: Record<string, string> | null;
}>();

const navLinks = [
  { label: "Profil", to: "/profil" },
  { label: "Kegiatan", to: "/kegiatan" },
  { label: "Berita", to: "/berita" },
  { label: "Blog", to: "/pena-santri" },
  { label: "Kontak", to: "/kontak" },
];

const year = new Date().getFullYear();

const facebookUrl = computed(() => props.settings?.social_facebook ?? "#");
const instagramUrl = computed(
  () =>
    props.settings?.social_instagram ?? "https://www.instagram.com/omahngaji_",
);
const youtubeUrl = computed(
  () =>
    props.settings?.social_youtube ??
    "https://youtube.com/@ojientertainment4897",
);
const tiktokUrl = computed(
  () => props.settings?.social_tiktok ?? "https://tiktok.com/@omahngaji_",
);

const mapsEmbedUrl = computed(
  () =>
    props.settings?.contact_maps_embed ??
    props.settings?.maps_embed ??
    "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d4439.636936115365!2d110.85348123043434!3d-7.545847830514026!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a16e1cb921e67%3A0xf2ca3eeac2c4569e!2sPesantren%20Mahasiswa%20Omah%20Ngaji%20Al%20Anshori!5e0!3m2!1sid!2sid!4v1730611092747!5m2!1sid!2sid",
);

const socials = computed(() => [
  {
    label: "Facebook",
    href: facebookUrl.value,
    icon: "i-simple-icons-facebook",
  },
  {
    label: "Instagram",
    href: instagramUrl.value,
    icon: "i-simple-icons-instagram",
  },
  { label: "YouTube", href: youtubeUrl.value, icon: "i-simple-icons-youtube" },
  { label: "TikTok", href: tiktokUrl.value, icon: "i-simple-icons-tiktok" },
]);
</script>

<template>
  <footer class="text-white">
    <div class="footer-gradient hidden md:block">
      <UContainer>
        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 py-12 md:py-16 items-start"
        >
          <!-- Logo -->
          <NuxtLink to="/" class="inline-flex">
            <NuxtImg
              src="/images/logo/logo_white.png"
              alt="Omah Ngaji Al-Anshori"
              width="152"
              height="96"
              format="webp"
              loading="lazy"
              class="h-24 w-auto object-contain"
            />
          </NuxtLink>

          <!-- Nav -->
          <div>
            <h5 class="font-display font-bold text-white text-lg mb-5">
              Omah Ngaji Al-Anshori
            </h5>
            <ul class="space-y-3">
              <li v-for="link in navLinks" :key="link.to">
                <NuxtLink
                  :to="link.to"
                  class="text-white/90 hover:text-white transition-colors"
                >
                  {{ link.label }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- Sosmed -->
          <div>
            <h5 class="font-display font-bold text-white text-lg mb-5">
              Ikuti kami
            </h5>
            <div class="flex gap-3">
              <a
                v-for="social in socials"
                :key="social.label"
                :href="social.href"
                target="_blank"
                rel="noopener"
                :aria-label="social.label"
                class="size-10 rounded-full border border-white/80 text-white flex items-center justify-center hover:bg-white hover:text-brand-600 transition-colors"
              >
                <UIcon :name="social.icon" class="size-5" />
              </a>
            </div>
          </div>

          <!-- Maps -->
          <div
            class="rounded-lg overflow-hidden bg-white/10 aspect-[16/9] lg:aspect-auto lg:h-[225px]"
          >
            <iframe
              :src="mapsEmbedUrl"
              title="Lokasi Omah Ngaji Al-Anshori"
              class="w-full h-full border-0"
              loading="lazy"
              allowfullscreen
              referrerpolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </UContainer>
    </div>

    <div class="bg-slate-800 py-4">
      <UContainer>
        <p class="text-center text-sm font-ui text-white/80">
          Omah Ngaji Al-Anshori © {{ year }}
        </p>
      </UContainer>
    </div>
  </footer>
</template>

<style scoped>
.footer-gradient {
  background: linear-gradient(180deg, #88de87 0%, #29c4a9 100%);
}
</style>
