import { emailLayout, escapeHtml } from './_layout'

export function postRejectedEmail(data: {
  authorName: string
  postTitle: string
  reviewerName: string
  reviewNote: string
  editUrl: string
}): string {
  const name = escapeHtml(data.authorName)
  const title = escapeHtml(data.postTitle)
  const reviewer = escapeHtml(data.reviewerName)
  const note = escapeHtml(data.reviewNote).replace(/\n/g, '<br/>')
  const url = escapeHtml(data.editUrl)
  return emailLayout({
    previewText: `Artikel "${data.postTitle}" membutuhkan revisi.`,
    bodyHtml: `
      <h2 style="margin:0 0 12px;font-size:18px;">Artikel kamu membutuhkan revisi</h2>
      <p style="margin:0 0 12px;">Halo ${name},</p>
      <p style="margin:0 0 12px;">Artikel <strong>${title}</strong> belum bisa dipublish dan perlu beberapa revisi.</p>
      <p style="margin:0 0 6px;font-weight:600;">Catatan dari ${reviewer}:</p>
      <div style="border-left:3px solid #e5e7eb;background:#f9fafb;padding:12px 14px;margin:0 0 16px;border-radius:6px;color:#0f172a;">${note}</div>
      <p style="margin:0 0 16px;">
        <a href="${url}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:500;">Edit artikel</a>
      </p>
      <p style="margin:0;font-size:13px;color:#64748b;">Setelah revisi, kirim ulang artikel untuk direview kembali.</p>
    `,
  })
}
