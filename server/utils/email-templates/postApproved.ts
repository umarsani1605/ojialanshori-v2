import { emailLayout, escapeHtml } from './_layout'

export function postApprovedEmail(data: {
  authorName: string
  postTitle: string
  postUrl: string
}): string {
  const name = escapeHtml(data.authorName)
  const title = escapeHtml(data.postTitle)
  const url = escapeHtml(data.postUrl)
  return emailLayout({
    previewText: `Artikel "${data.postTitle}" sudah dipublish.`,
    bodyHtml: `
      <h2 style="margin:0 0 12px;font-size:18px;">Artikel kamu sudah dipublish 🎉</h2>
      <p style="margin:0 0 12px;">Halo ${name},</p>
      <p style="margin:0 0 16px;">Artikel <strong>${title}</strong> telah disetujui dan tayang di website.</p>
      <p style="margin:0 0 16px;">
        <a href="${url}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:500;">Lihat artikel</a>
      </p>
      <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Atau salin link berikut:</p>
      <p style="margin:0;font-size:13px;color:#64748b;word-break:break-all;">${url}</p>
    `,
  })
}
