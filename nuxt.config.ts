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
    "@posthog/nuxt",
  ],

  posthogConfig: {
    publicKey: process.env.NUXT_PUBLIC_POSTHOG_PROJECT_TOKEN || "",
    host: process.env.NUXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
    clientConfig: {
      capture_exceptions: true,
      __add_tracing_headers: ["localhost", "ojialanshori.com"],
      disable_session_recording: true,
    },
    serverConfig: {
      // Disabled — pakai custom plugin di server/plugins/posthog-error-context.ts
      // yang filter 4xx + enrich konteks user.
      enableExceptionAutocapture: false,
    },
  },

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

  routeRules: {
    '/admin/**': { robots: false },
    '/dashboard/**': { robots: false },
    '/masuk': { robots: false },
    '/daftar': { robots: false },
  },

  robots: {
    disallow: ['/admin', '/dashboard', '/masuk', '/daftar'],
  },

  sitemap: {
    exclude: ['/admin/**', '/dashboard/**', '/masuk', '/daftar'],
  },

  seo: {
    redirectToCanonicalSiteUrl: true,
  },

  // Disable dynamic OG image — dikonfigurasi di E8 (SEO & Performance)
  ogImage: {
    enabled: false,
  },

  image: {
    provider: process.env.NODE_ENV === "production" ? "ipx" : "none",
    domains: ["assets.ojialanshori.com"],
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
      r2PublicDomain:
        process.env.NUXT_PUBLIC_R2_DOMAIN || "assets.ojialanshori.com",
      disqusShortname:
        process.env.NUXT_PUBLIC_DISQUS_SHORTNAME ||
        process.env.DISQUS_SHORTNAME ||
        "",
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "",
      posthog: {
        publicKey: process.env.NUXT_PUBLIC_POSTHOG_PROJECT_TOKEN || "",
        host:
          process.env.NUXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      },
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
