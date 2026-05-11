import { createError, getRouterParam, type H3Event } from 'h3'
import type { z } from 'zod'
import { routeIdSchema, routeSlugSchema } from '~~/shared/schemas'

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

/**
 * Extract & validate route param `id` (positive integer).
 * Pakai di endpoint `/api/xxx/[id].(post|patch|delete)`.
 */
export function requireId(event: H3Event, paramName = 'id'): number {
  const raw = getRouterParam(event, paramName)
  const parsed = routeIdSchema.safeParse(raw)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid route param',
      data: { message: `Param ${paramName} tidak valid.` },
    })
  }
  return parsed.data
}

/**
 * Extract & validate route param `slug` (non-empty string).
 */
export function requireSlug(event: H3Event, paramName = 'slug'): string {
  const raw = getRouterParam(event, paramName)
  const parsed = routeSlugSchema.safeParse(raw)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid route param',
      data: { message: `Param ${paramName} tidak valid.` },
    })
  }
  return parsed.data
}
