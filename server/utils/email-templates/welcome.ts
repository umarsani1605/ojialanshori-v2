import { emailLayout, escapeHtml } from './_layout'

export function welcomeEmail(data: { name: string }): string {
  const name = escapeHtml(data.name)
  return emailLayout({
    previewText: `Selamat datang di Omah Ngaji Al-Anshori, ${data.name}!`,
    bodyHtml: `
      <h2 style="margin:0 0 12px;font-size:18px;">Selamat datang, ${name}! 👋</h2>
      <p style="margin:0 0 12px;">Akunmu di Omah Ngaji Al-Anshori sudah aktif. Mulai sekarang kamu bisa menulis dan mengirim karya di Pena Santri.</p>
      <p style="margin:0 0 12px;">Semoga jadi sarana belajar dan berbagi yang bermanfaat.</p>
      <p style="margin:0;">Jazakumullah khairan,<br/>Tim Omah Ngaji Al-Anshori</p>
    `,
  })
}
