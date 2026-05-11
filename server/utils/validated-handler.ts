import type { H3Event, EventHandlerRequest } from 'h3'
import { createError, defineEventHandler, readBody } from 'h3'
import type { z } from 'zod'

/**
 * Bungkus event handler dengan validasi body Zod.
 *
 * Pakai untuk endpoint POST/PATCH/PUT/DELETE yang menerima JSON body.
 * Kalau validasi gagal → 400 dengan { message, issues }.
 * Kalau lolos → handler dipanggil dgn body yang sudah ter-type.
 *
 * Contoh:
 *   const schema = z.object({ name: z.string(), order: z.number().optional() })
 *   export default defineValidatedHandler(schema, async (event, body) => {
 *     // body: { name: string; order?: number }
 *     return db.insert(...).values(body)
 *   })
 */
export function defineValidatedHandler<TSchema extends z.ZodTypeAny, TResult>(
  schema: TSchema,
  handler: (event: H3Event<EventHandlerRequest>, body: z.infer<TSchema>) => Promise<TResult> | TResult,
) {
  return defineEventHandler(async (event) => {
    const raw = await readBody(event).catch(() => undefined)
    const parsed = schema.safeParse(raw)

    if (!parsed.success) {
      const first = parsed.error.issues[0]
      const path = first?.path?.join('.') || 'body'
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: {
          message: first ? `${path}: ${first.message}` : 'Input tidak valid',
          issues: parsed.error.issues,
        },
      })
    }

    return handler(event, parsed.data)
  })
}
