/**
 * Email stub — E7 will replace with real Brevo REST API integration.
 * For now, logs to console so we can verify the call during development.
 */
export async function sendEmail(opts: {
  to: string
  toName?: string
  subject: string
  htmlContent: string
  textContent?: string
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY

  if (!apiKey) {
    console.log('[email:stub] BREVO_API_KEY not set — would send:', {
      to: opts.to,
      subject: opts.subject,
      preview: opts.textContent?.slice(0, 120) ?? opts.htmlContent.slice(0, 120),
    })
    return
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Omah Ngaji Al-Anshori', email: 'noreply@ojialanshori.com' },
      to: [{ email: opts.to, name: opts.toName ?? opts.to }],
      subject: opts.subject,
      htmlContent: opts.htmlContent,
      ...(opts.textContent ? { textContent: opts.textContent } : {}),
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw createError({
      statusCode: 502,
      message: `Brevo send failed (${res.status}): ${body}`,
    })
  }
}
