import type { H3Event } from 'h3'

import { sendEmail, type SendEmailResult } from './brevo'
import { welcomeEmail } from './email-templates/welcome'
import { postSubmittedEmail } from './email-templates/postSubmitted'
import { postApprovedEmail } from './email-templates/postApproved'
import { postRejectedEmail } from './email-templates/postRejected'
import { passwordResetEmail } from './email-templates/passwordReset'

function buildPostUrl(event: H3Event, slug: string): string {
  const config = useRuntimeConfig(event)
  const base = (config.public.siteUrl || 'https://ojialanshori.com').replace(/\/$/, '')
  return `${base}/pena-santri/${slug}`
}

function buildEditUrl(event: H3Event, postId: number | string): string {
  const config = useRuntimeConfig(event)
  const base = (config.public.siteUrl || 'https://ojialanshori.com').replace(/\/$/, '')
  return `${base}/dashboard/posts/${postId}/edit`
}

function logStart(method: string, to: string) {
  console.info(`[email] ${method} start`, { to })
}

function logSuccess(method: string, to: string, result: SendEmailResult) {
  console.info(`[email] ${method} success`, { to, messageId: result.messageId })
}

function logError(method: string, to: string, err: unknown) {
  console.error(`[email] ${method} error`, { to, err })
}

class EmailService {
  async sendWelcome(event: H3Event, input: { to: string; name: string }) {
    logStart('sendWelcome', input.to)
    try {
      const result = await sendEmail(event, {
        to: input.to,
        toName: input.name,
        subject: 'Selamat datang di Omah Ngaji Al-Anshori',
        htmlContent: welcomeEmail({ name: input.name }),
      })
      logSuccess('sendWelcome', input.to, result)
      return result
    } catch (error: unknown) {
      logError('sendWelcome', input.to, error)
      throw error
    }
  }

  async sendPostSubmitted(
    event: H3Event,
    input: { to: string; authorName: string; postTitle: string },
  ) {
    logStart('sendPostSubmitted', input.to)
    try {
      const result = await sendEmail(event, {
        to: input.to,
        toName: input.authorName,
        subject: `Artikel kamu sedang direview — ${input.postTitle}`,
        htmlContent: postSubmittedEmail({
          authorName: input.authorName,
          postTitle: input.postTitle,
        }),
      })
      logSuccess('sendPostSubmitted', input.to, result)
      return result
    } catch (error: unknown) {
      logError('sendPostSubmitted', input.to, error)
      throw error
    }
  }

  async sendPostApproved(
    event: H3Event,
    input: { to: string; authorName: string; postTitle: string; postSlug: string },
  ) {
    logStart('sendPostApproved', input.to)
    try {
      const postUrl = buildPostUrl(event, input.postSlug)
      const result = await sendEmail(event, {
        to: input.to,
        toName: input.authorName,
        subject: `Artikel kamu telah dipublish — ${input.postTitle}`,
        htmlContent: postApprovedEmail({
          authorName: input.authorName,
          postTitle: input.postTitle,
          postUrl,
        }),
      })
      logSuccess('sendPostApproved', input.to, result)
      return result
    } catch (error: unknown) {
      logError('sendPostApproved', input.to, error)
      throw error
    }
  }

  async sendPostRejected(
    event: H3Event,
    input: {
      to: string
      authorName: string
      postTitle: string
      postId: number
      reviewerName: string
      reviewNote: string
    },
  ) {
    logStart('sendPostRejected', input.to)
    try {
      const editUrl = buildEditUrl(event, input.postId)
      const result = await sendEmail(event, {
        to: input.to,
        toName: input.authorName,
        subject: `Artikel kamu membutuhkan revisi — ${input.postTitle}`,
        htmlContent: postRejectedEmail({
          authorName: input.authorName,
          postTitle: input.postTitle,
          reviewerName: input.reviewerName,
          reviewNote: input.reviewNote,
          editUrl,
        }),
      })
      logSuccess('sendPostRejected', input.to, result)
      return result
    } catch (error: unknown) {
      logError('sendPostRejected', input.to, error)
      throw error
    }
  }

  async sendPasswordReset(
    event: H3Event,
    input: { to: string; name: string; newPassword: string },
  ) {
    logStart('sendPasswordReset', input.to)
    try {
      const result = await sendEmail(event, {
        to: input.to,
        toName: input.name,
        subject: 'Password akun Omah Ngaji Al-Anshori telah direset',
        htmlContent: passwordResetEmail({ name: input.name, newPassword: input.newPassword }),
      })
      logSuccess('sendPasswordReset', input.to, result)
      return result
    } catch (error: unknown) {
      logError('sendPasswordReset', input.to, error)
      throw error
    }
  }
}

export const emailService = new EmailService()

function failureReason(err: unknown, fallback = 'unknown error'): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: { message?: string } }).data
    if (data?.message) return data.message
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}

/**
 * Fire-and-forget email send. Tracks failures to PostHog and uses
 * `event.waitUntil` (Nitro >= 2.10) so background work isn't cut off after
 * the HTTP response is flushed.
 */
export function fireEmail(event: H3Event, promise: Promise<unknown>, context: string): void {
  const tracked = promise.catch((err) => {
    console.error(`[email] ${context} failed`, err)
    try {
      useServerPostHog().capture({
        distinctId: 'system',
        event: 'email.send_failed',
        properties: { template: context, reason: failureReason(err) },
      })
    } catch (captureErr) {
      console.error('[email] posthog capture failed', captureErr)
    }
  })
  event.waitUntil?.(tracked)
}
