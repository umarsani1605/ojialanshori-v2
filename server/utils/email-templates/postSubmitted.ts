import { emailLayout, escapeHtml } from './_layout'

export function postSubmittedEmail(data: { authorName: string; postTitle: string }): string {
  const name = escapeHtml(data.authorName)
  const title = escapeHtml(data.postTitle)
  return emailLayout({
    previewText: `Artikel "${data.postTitle}" sudah masuk antrian review.`,
    bodyHtml: `
      <h2 style="margin:0 0 12px;font-size:18px;">Artikel kamu sedang direview</h2>
      <p style="margin:0 0 12px;">Halo ${name},</p>
      <p style="margin:0 0 12px;">Artikel <strong>${title}</strong> sudah kami terima dan masuk antrian review. Tim akan memberitahu kamu kalau sudah dipublish atau membutuhkan revisi.</p>
      <p style="margin:0;">Terima kasih sudah berkontribusi.</p>
    `,
  })
}
