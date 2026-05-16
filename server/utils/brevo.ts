import type { H3Event } from 'h3'

export interface SendEmailInput {
  to: string
  toName?: string
  subject: string
  htmlContent: string
  textContent?: string
}

export interface SendEmailResult {
  messageId?: string
}

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

export async function sendEmail(event: H3Event, input: SendEmailInput): Promise<SendEmailResult> {
  const config = useRuntimeConfig(event)
  const apiKey = config.brevoApiKey
  const fromName = config.emailFromName
  const fromAddress = config.emailFromAddress

  if (!apiKey) {
    console.log('[brevo:stub] would send', {
      to: input.to,
      subject: input.subject,
      preview: (input.textContent ?? input.htmlContent).slice(0, 120),
    })
    return {}
  }

  console.info('[brevo] sendEmail start', { to: input.to, subject: input.subject })

  const res = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromAddress },
      to: [{ email: input.to, name: input.toName ?? input.to }],
      subject: input.subject,
      htmlContent: input.htmlContent,
      ...(input.textContent ? { textContent: input.textContent } : {}),
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('[brevo] sendEmail error', { to: input.to, status: res.status, body })
    throw createError({
      statusCode: 502,
      message: `Brevo send failed (${res.status}): ${body}`,
    })
  }

  const result = (await res.json().catch(() => ({}))) as SendEmailResult
  console.info('[brevo] sendEmail success', { to: input.to, messageId: result.messageId })
  return result
}
