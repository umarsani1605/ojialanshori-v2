import type { H3Event } from 'h3'

import { getR2MediaConfig } from '#server/utils/runtime'

export function getR2PublicUrl(event: H3Event, key: string) {
  const cfg = useRuntimeConfig(event)
  return `https://${cfg.public.r2PublicDomain}/${key}`
}

/**
 * Ekstrak storage key dari path yang tersimpan di DB.
 * Mendukung dua format:
 *   - Legacy: `/images/{key}` (diproxy via server route)
 *   - Baru:   `https://{r2PublicDomain}/{key}` (langsung ke R2 custom domain)
 * Return `null` jika bukan path yang dikelola R2 (mis. URL eksternal).
 */
export function getR2KeyFromPath(event: H3Event, path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('/images/')) return path.replace(/^\/images\//, '')
  const cfg = useRuntimeConfig(event)
  const domain = cfg.public.r2PublicDomain
  if (!domain) return null
  const prefix = `https://${domain}/`
  if (path.startsWith(prefix)) return path.slice(prefix.length)
  return null
}

async function getClient(event: H3Event) {
  const cfg = getR2MediaConfig(event)
  if (!cfg) {
    throw createError({ statusCode: 500, message: 'R2 storage tidak terkonfigurasi.' })
  }
  const { S3Client } = await import('@aws-sdk/client-s3')
  const client = new S3Client({
    region: 'auto',
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  })
  return { client, bucket: cfg.bucket }
}

export async function putR2(
  event: H3Event,
  key: string,
  data: Uint8Array | Buffer | Blob,
  options: { contentType?: string } = {},
) {
  const { client, bucket } = await getClient(event)
  const { PutObjectCommand } = await import('@aws-sdk/client-s3')

  let body: Uint8Array | Buffer
  if (data instanceof Blob) {
    body = new Uint8Array(await data.arrayBuffer())
  } else {
    body = data
  }

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: options.contentType,
  }))
}

export async function deleteR2(event: H3Event, key: string) {
  const { client, bucket } = await getClient(event)
  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
  await client.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  }))
}
