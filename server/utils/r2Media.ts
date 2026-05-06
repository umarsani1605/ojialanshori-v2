import { Readable } from 'node:stream'
import { setHeader, type H3Event } from 'h3'

import { getR2MediaConfig } from '#server/utils/runtime'

type S3Body = {
  arrayBuffer?: () => Promise<ArrayBuffer>;
  transformToByteArray?: () => Promise<Uint8Array>;
  transformToWebStream?: () => ReadableStream<Uint8Array>;
};

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
};

export async function serveR2MediaObject(event: H3Event, pathname: string) {
  const mediaConfig = getR2MediaConfig(event)

  if (!mediaConfig) {
    return null
  }

  const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3')
  const s3 = new S3Client({
    region: 'auto',
    endpoint: mediaConfig.endpoint,
    credentials: {
      accessKeyId: mediaConfig.accessKeyId,
      secretAccessKey: mediaConfig.secretAccessKey,
    },
  })

  try {
    const object = await s3.send(
      new GetObjectCommand({
        Bucket: mediaConfig.bucket,
        Key: pathname,
      }),
    )
    const body = await readS3Body(object.Body as S3Body | Readable | undefined)

    if (!body) {
      return null
    }

    setHeader(
      event,
      'Content-Type',
      object.ContentType || getContentType(pathname),
    )
    setHeader(event, 'Content-Length', body.byteLength)

    if (object.ETag) {
      setHeader(event, 'etag', object.ETag)
    }

    return new ReadableStream({
      start(controller) {
        controller.enqueue(body)
        controller.close()
      },
    })
  } catch {
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

  if ('arrayBuffer' in body && body.arrayBuffer) {
    return new Uint8Array(await body.arrayBuffer())
  }

  if ('transformToWebStream' in body && body.transformToWebStream) {
    return readWebStream(body.transformToWebStream())
  }

  if (body instanceof ReadableStream) {
    return readWebStream(body)
  }

  return null
}

async function readWebStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let totalLength = 0

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    if (value) {
      chunks.push(value)
      totalLength += value.byteLength
    }
  }

  const merged = new Uint8Array(totalLength)
  let offset = 0

  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }

  return merged
}

function getContentType(pathname: string) {
  const extension = pathname.split('.').pop()?.toLowerCase() ?? ''

  return MIME_BY_EXTENSION[extension] ?? 'application/octet-stream'
}
