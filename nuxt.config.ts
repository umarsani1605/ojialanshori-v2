import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2026-04-12",
  devtools: { enabled: true },

  site: {
    url:
      process.env.NUXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      "http://localhost:3000",
    name: "Omah Ngaji Al-Anshori",
  },

  css: ["~/assets/css/main.css"],

  modules: [
    "@nuxt/ui",
    "@nuxtjs/seo",
    "@nuxt/image",
    "nuxt-disqus",
    "nuxt-auth-utils",
  ],

  colorMode: {
    preference: "light",
    fallback: "light",
  },

  app: {
    head: {
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/favicon-16x16.png",
        },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700;800;900&family=Poppins:wght@500;600;700;800&display=swap",
        },
      ],
      script: [
        {
          innerHTML: `localStorage.setItem('vueuse-color-scheme','light');localStorage.setItem('nuxt-color-mode','light');document.documentElement.classList.remove('dark');`,
          tagPriority: "critical",
        },
      ],
    },
  },

  // Disable dynamic OG image — dikonfigurasi di E8 (SEO & Performance)
  ogImage: {
    enabled: false,
  },

  image: {
    provider: process.env.NODE_ENV === "production" ? "ipx" : "none",
  },

  disqus: {
    shortname: process.env.NUXT_PUBLIC_DISQUS_SHORTNAME || "",
  },

  runtimeConfig: {
    session: {
      password:
        process.env.NUXT_SESSION_PASSWORD ||
        process.env.NUXT_SESSION_SECRET ||
        "8dc6e480ab1f431d9582c02f0b06a3ba",
    },
    brevoApiKey:
      process.env.NUXT_BREVO_API_KEY || process.env.BREVO_API_KEY || "",
    mysqlUrl: process.env.NUXT_MYSQL_URL || process.env.MYSQL_URL || "",
    r2AccessKeyId:
      process.env.NUXT_R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || "",
    r2SecretAccessKey:
      process.env.NUXT_R2_SECRET_ACCESS_KEY ||
      process.env.R2_SECRET_ACCESS_KEY ||
      "",
    r2Bucket: process.env.NUXT_R2_BUCKET || process.env.R2_BUCKET || "",
    r2Endpoint: process.env.NUXT_R2_ENDPOINT || process.env.R2_ENDPOINT || "",
    public: {
      disqusShortname:
        process.env.NUXT_PUBLIC_DISQUS_SHORTNAME ||
        process.env.DISQUS_SHORTNAME ||
        "",
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "",
    },
  },

  imports: {
    dirs: ["constants"],
  },

  nitro: {
    preset: "node-server",
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
