import { Readable } from 'node:stream'
import { setHeader, type H3Event } from 'h3'

type S3Body = {
  transformToByteArray?: () => Promise<Uint8Array>
}

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
}

export function hasR2MediaConfig() {
  return Boolean(
    process.env.R2_ACCESS_KEY_ID
    && process.env.R2_SECRET_ACCESS_KEY
    && process.env.R2_BUCKET
    && process.env.R2_ENDPOINT,
  )
}

export async function serveR2MediaObject(event: H3Event, pathname: string) {
  if (!hasR2MediaConfig()) {
    return null
  }

  const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3')
  const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
    },
  })

  try {
    const object = await s3.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: pathname,
    }))
    const body = await readS3Body(object.Body as S3Body | Readable | undefined)

    if (!body) {
      return null
    }

    setHeader(event, 'Content-Type', object.ContentType || getContentType(pathname))
    setHeader(event, 'Content-Length', body.byteLength)

    if (object.ETag) {
      setHeader(event, 'etag', object.ETag)
    }

    return new ReadableStream({
      start(controller) {
        controller.enqueue(body)s
        controller.close()
      },
    })
  }
  catch {
    return null
  }
}

async function readS3Body(body: S3Body | Readable | undefined) {
  if (!body) {
    return null
  }

  if ('transformToByteArray' in body && body.transformToByteArray) {
    return body.transformToByteArray()
  }

  if (body instanceof Readable) {
    const chunks: Buffer[] = []

    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }

    return new Uint8Array(Buffer.concat(chunks))
  }

  return null
}

function getContentType(pathname: string) {
  const extension = pathname.split('.').pop()?.toLowerCase() ?? ''

  return MIME_BY_EXTENSION[extension] ?? 'application/octet-stream'
}
