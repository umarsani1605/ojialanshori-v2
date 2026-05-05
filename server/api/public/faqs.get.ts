import { asc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

import * as schema from '~~/server/db/schema'

const fallbackFaqs = [
  {
    question: 'Bagaimana alur seleksi masuk Omah Ngaji?',
    answer: `Alur seleksi masuk Omah Ngaji adalah sebagai berikut:

1. Mengisi formulir pendaftaran.
2. Melakukan konfirmasi pada nomor yang tercantum.
3. Melakukan Interview dan Screening sesuai waktu dan tempat yang telah ditentukan.
4. Menunggu pengumuman.`,
  },
  {
    question: 'Apakah ada aturan bagi mahasiswa yang masuk Omah Ngaji, sebelumnya harus pernah mondok?',
    answer: 'Tidak, Omah Ngaji Al Anshori terbuka bagi siapa saja yang siap kuliah dan ngaji.',
  },
  {
    question: 'Apakah masuk Omah Ngaji harus punya hafalan Al-qur’an?',
    answer: 'Tidak harus, salah satu program di Omah Ngaji Al Anshori adalah Ngaji Quran. Hal ini memberikan wadah bagi santri untuk belajar dan menghafal Al Quran.',
  },
  {
    question: 'Apakah harus bisa baca kitab kuning ?',
    answer: 'Tidak harus, ngaji kitab di Omah Ngaji Al Anshori menggunakan metode bandongan. Guru menyampaikan apa yang ada di dalam kitab dan menjelaskan, santri menulis, mendengarkan, dan memahami.',
  },
  {
    question: 'Apakah boleh hanya mengikuti Kegiatan di Omah Ngaji tapi tidurnya di kos?',
    answer: 'Tentu saja boleh, Omah Ngaji Al Anshori membuka diri bagi siapa saja yang ingin belajar bersama.',
  },
  {
    question: 'Apa maksud santri mukim?',
    answer: 'Santri mukim adalah santri Omah Ngaji yang tidur menginap di Asrama Omah Ngaji Al Anshori.',
  },
  {
    question: 'Apa maksud santri non mukim?',
    answer: 'Santri non mukim adalah santri yang hanya mengikuti kegiatan Omah Ngaji, tetapi tidak tidur menginap di Omah Ngaji Al Anshori.',
  },
  {
    question: 'Berapa jarak antara Omah Ngaji ke UNS?',
    answer: 'Jarak Omah Ngaji Al Anshori dengan UNS sekitar 2,3 KM.',
  },
  {
    question: 'Apa yang masuk Omah Ngaji harus dari UNS?',
    answer: 'Tentu saja tidak, Omah Ngaji Al Anshori terbuka untuk kampus sekitar Omah Ngaji seperti ISI Surakarta, Politeknik Akbara, AK Tekstil Solo, Poltekkes Surakarta, dan sekitarnya.',
  },
  {
    question: 'Berapa jumlah santri per kamar?',
    answer: `Untuk putri dihuni 2-4 orang per kamar sesuai ukuran kamar.
Untuk putra dihuni 3-5 orang per kamar sesuai ukuran kamar.`,
  },
  {
    question: 'Apa di Omah Ngaji sudah disediakan makan?',
    answer: 'Omah Ngaji Al Anshori menyediakan makan pagi dan sore, setiap santri akan mendapatkan piket masak.',
  },
  {
    question: 'Apakah tinggal di Omah Ngaji boleh ikut Organisasi kampus?',
    answer: 'Omah Ngaji Al Anshori mendukung dan memberikan kebebasan pada setiap santri untuk ikut dan aktif di organisasi kampus maupun luar kampus.',
  },
] as const

export default defineCachedEventHandler(async () => {
  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) {
    return fallbackFaqs
  }

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
    const rows = await db.select({
      question: schema.faqs.question,
      answer: schema.faqs.answer,
      order: schema.faqs.order,
    })
      .from(schema.faqs)
      .where(eq(schema.faqs.isActive, true))
      .orderBy(asc(schema.faqs.order), asc(schema.faqs.id))

    if (rows.length === 0) {
      return fallbackFaqs
    }

    return rows.map(({ question, answer }) => ({ question, answer }))
  }
  finally {
    await connection.end()
  }
}, {
  maxAge: 60,
  name: 'public-faqs',
})
