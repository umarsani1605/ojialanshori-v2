import { createError } from 'h3'
import type { z } from 'zod'

/**
 * Adapter Zod schema → h3 validator function untuk `readValidatedBody`.
 *
 * Pakai inline di endpoint:
 *
 *   const body = await readValidatedBody(event, zValidator(upsertFaqSchema))
 *
 * Kalau gagal validasi → throw 400 dengan { message, issues }.
 */
export function zValidator<TSchema extends z.ZodTypeAny>(schema: TSchema) {
  return (raw: unknown): z.infer<TSchema> => {
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
    return parsed.data
  }
}
