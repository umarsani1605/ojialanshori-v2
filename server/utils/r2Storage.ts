import type { H3Event } from 'h3'

import { getR2MediaConfig } from '#server/utils/runtime'

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
