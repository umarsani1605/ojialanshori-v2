export default defineNuxtConfig({
  compatibilityDate: '2026-04-12',
  devtools: { enabled: true },

  modules: [
    '@nuxthub/core',
    '@nuxt/ui',
    '@nuxtjs/seo',
    '@nuxt/image',
    'nuxt-disqus',
  ],

  hub: {
    db: {
      dialect: 'mysql',
      // Matikan auto-migrate saat build & dev — jalankan manual via pnpm db:migrate
      applyMigrationsDuringBuild: false,
      applyMigrationsDuringDev: false,
    },
    blob: true,
    kv: true,
    cache: true,
  },

  // Disable dynamic OG image — dikonfigurasi di E8 (SEO & Performance)
  ogImage: {
    enabled: false,
  },

  // @nuxt/image: provider dikonfigurasi di E8 (SEO & Performance)
  image: {},

  disqus: {
    shortname: process.env.DISQUS_SHORTNAME || '',
  },

  runtimeConfig: {
    sessionSecret: '',
    brevoApiKey: '',
    public: {
      disqusShortname: process.env.DISQUS_SHORTNAME || '',
    },
  },

  nitro: {
    preset: 'cloudflare-pages',
  },

  vite: {
    optimizeDeps: {
      include: [],
    },
  },
})
