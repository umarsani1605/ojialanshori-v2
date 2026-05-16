import { emailLayout, escapeHtml } from './_layout'

export function passwordResetEmail(data: { name: string; newPassword: string }): string {
  const name = escapeHtml(data.name)
  const password = escapeHtml(data.newPassword)
  return emailLayout({
    previewText: 'Password akunmu telah direset oleh administrator.',
    bodyHtml: `
      <h2 style="margin:0 0 12px;font-size:18px;">Password kamu telah direset</h2>
      <p style="margin:0 0 12px;">Halo ${name},</p>
      <p style="margin:0 0 12px;">Administrator telah mereset password akunmu. Password baru kamu:</p>
      <p style="margin:0 0 16px;">
        <code style="display:inline-block;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;font-size:15px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${password}</code>
      </p>
      <p style="margin:0;font-size:13px;color:#64748b;">Demi keamanan, segera login dan ganti password di halaman Profil.</p>
    `,
  })
}
