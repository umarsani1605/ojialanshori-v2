declare module 'nuxt/schema' {
  interface RuntimeConfig {
    mysqlUrl: string
    sessionSecret: string
    brevoApiKey: string
    r2AccessKeyId: string
    r2SecretAccessKey: string
    r2Bucket: string
    r2Endpoint: string
  }

  interface PublicRuntimeConfig {
    disqusShortname: string
    siteUrl: string
  }
}

export {}
