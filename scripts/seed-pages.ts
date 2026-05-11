/**
 * Seed script: pages, activities, board_members, faqs, testimonials
 * Data sourced from hardcoded content in public-facing pages.
 *
 * Usage:
 *   pnpm seed:pages
 *
 * Requirements:
 *   - MYSQL_URL set in .env
 *   - Migrations already applied (pnpm db:migrate)
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from '../server/db/schema.js'

// ─── Data ─────────────────────────────────────────────────────────────────────

const PAGES = [
  {
    title: 'Beranda',
    template: 'home',
    meta: {
      subtitle: 'Asrama Mahasiswa',
      title: 'Omah Ngaji Al-Anshori',
      description:
        'Omah Ngaji Al-Anshori adalah asrama mahasiswa yang bertujuan untuk mengembangkan karakter dan spiritualitas mahasiswa.',
      features: [
        'Kuliah sambil Ngaji',
        "Ngaji Al-Qur'an dan Kitab",
        'Rumah Baru, Keluarga Baru',
        'Kegiatan Seru Lainnya',
      ],
      maxNews: 4,
      maxPena: 4,
    },
  },
  {
    title: 'Profil',
    template: 'profile',
    meta: {
      overview: [
        'Omah Ngaji Al-Anshori berdiri pada Juli 2015. Sebagai wadah khusus mahasiswa, Omah Ngaji Al-Anshori ingin menjadi wadah yang mampu memadukan dimensi positif perguruan tinggi dengan dimensi positif Pendidikan Islam, yang akan menjadi penempaan kepribadian dan moral berdasarkan nilai-nilai Islam Ahlussunnah Wal Jamaah.',
        'Omah Ngaji Al-Anshori harus berjuang untuk bertahan dengan sumber daya yang terbatas di tahun-tahun awal. Banyak tantangan silih berganti yang harus dilewati dan dihadapi. Namun, dengan kegigihan dan tekad yang kuat serta doa semua yang terlibat, menjadikan Omah Ngaji Al-Anshori mampu bertahan dan berkembang baik secara kuantitas maupun kualitas.',
        'Perkembangan itu terlihat dari semakin tertata dan terstrukturnya kegiatan di Omah Ngaji Al-Anshori, diantaranya: mengaji Al-Quran, mengaji kitab, diskusi tematik hingga kegiatan amaliyah penunjang lainnya. Harapannya, kegiatan di Omah Ngaji Al-Anshori dapat mencetak kader yang cakap secara intelektual maupun spiritual dan berdaya guna bagi masyarakat.',
        "Berlandaskan kekeluargaan dan semangat perjuangan tinggi untuk membumikan Islam Rahmatan Lil 'Alamin, Omah Ngaji Al-Anshori bertekad untuk selalu berproses dan berprogress.",
      ],
      vision: 'Membumikan Islam Sebagai Rahmat Semesta Alam',
      mission: [
        "Mengadakan kajian keagamaan yang bersumber dari Al-Qur'an dan Hadits",
        'Menyeimbangkan nilai intelektualisme dan agama',
        'Mengistiqomahkan silaturahmi dengan para ulama dan kyai',
        'Mengedepankan nilai persaudaraan dan kebersamaan',
      ],
    },
  },
  {
    title: 'Kegiatan',
    template: 'activities',
    meta: {},
  },
  {
    title: 'Kontak',
    template: 'contact',
    meta: {},
  },
  {
    title: 'FAQ',
    template: 'faq',
    meta: {},
  },
]

const ACTIVITIES = [
  {
    title: "Ngaji Al-Qur'an",
    description:
      "Ngaji Al-Qur'an dilaksanakan setiap hari Ba'da Subuh. Santri menyetorkan bacaan Quran pada Bapak Rosyid (Putra) dan Ibu Faiz (Putri). Ngaji subuh dilakukan dengan Bil Nadzri (Membaca) dan atau Bil Hifdzi (Menghafal).",
    imagePath: '/images/kegiatan/ngaji-quran.jpg',
    order: 1,
  },
  {
    title: 'Ngaji Kitab Kuning',
    description:
      "Ngaji kitab kuning dilaksanakan 3 kali dalam seminggu setiap Ba'da Maghrib, mengkaji kitab kuning karya Ulama dengan metode bandongan. Topik kajian: Kitab Fiqih, Kitab Tauhid, dan Kitab Akhlak.",
    imagePath: '/images/kegiatan/kitab-kuning.jpg',
    order: 2,
  },
  {
    title: 'Diskusi Tematik',
    description:
      'Diskusi Tematik merupakan kegiatan diskusi dengan tema-tema terkini, bertujuan agar santri tetap aktif dan kritis pada permasalahan sosial non-keagamaan. Membiasakan santri untuk selalu terbuka dan moderat dalam menyikapi suatu permasalahan.',
    imagePath: '/images/kegiatan/diskusi-tematik.jpg',
    order: 3,
  },
  {
    title: 'Pengembangan Diri',
    description:
      'Pengembangan diri merupakan kegiatan dimana santri diharuskan untuk menguasai dan mendalami amalan-amalan ilmu keagamaan. Harapannya santri dapat memahami makna tersurat dan tersirat, serta mengamalkan dalam kegiatan sehari-hari.',
    imagePath: '/images/kegiatan/pengembangan-diri.jpg',
    order: 4,
  },
  {
    title: 'Kegiatan Seru Lainnya',
    description:
      'Selain kegiatan di atas, Omah Ngaji memiliki kegiatan rutin lain seperti Pembacaan Tahlil, Pembacaan Kitab Maulid, Khitobah, Semaan Al Quran Mingguan, Bootcamp, Rihlah, dan Kegiatan Ramadhan.',
    imagePath: '/images/kegiatan/lainnya.jpg',
    order: 5,
  },
]

const BOARD_MEMBERS = [
  {
    name: 'K.H. Abdul Karim Ahmad',
    role: 'Penasehat',
    avatarPath: '/images/profil/gus-karim.jpg',
    order: 1,
  },
  {
    name: 'Kiai Anshori Syukri',
    role: 'Penasehat',
    avatarPath: '/images/profil/kyai-anshori.jpg',
    order: 2,
  },
  {
    name: 'M. Tohir Rosyid, S.Si',
    role: 'Pengajar',
    avatarPath: '/images/profil/tohir.png',
    order: 3,
  },
  {
    name: 'Dr. Faizatul Anshoriah, S.Sos., M.Si.',
    role: 'Pengajar',
    avatarPath: '/images/profil/faiz.png',
    order: 4,
  },
  {
    name: 'Dr. Arifuddin, Lc., M.A.',
    role: 'Pengajar',
    avatarPath: '/images/profil/arifuddin.png',
    order: 5,
  },
  {
    name: 'Abdul Halim, S.Th.I., M.Hum.',
    role: 'Pengajar',
    avatarPath: '/images/profil/halim.png',
    order: 6,
  },
  {
    name: 'Andi Alfan Qodri, S.Si.',
    role: 'Pengajar',
    avatarPath: '/images/profil/alfan.png',
    order: 7,
  },
  {
    name: 'Ahmad Multazam, S.Hum.',
    role: 'Pengajar',
    avatarPath: '/images/profil/multazam.png',
    order: 8,
  },
]

const FAQS = [
  {
    question: 'Bagaimana alur seleksi masuk Omah Ngaji?',
    answer:
      '<ol><li>Mengisi formulir pendaftaran.</li><li>Melakukan konfirmasi pada nomor yang tercantum.</li><li>Melakukan Interview dan Screening sesuai waktu dan tempat yang telah ditentukan.</li><li>Menunggu pengumuman.</li></ol>',
    order: 1,
  },
  {
    question:
      'Apakah ada aturan bagi mahasiswa yang masuk Omah Ngaji, sebelumnya harus pernah mondok?',
    answer: 'Tidak, Omah Ngaji Al Anshori terbuka bagi siapa saja yang siap kuliah dan ngaji.',
    order: 2,
  },
  {
    question: 'Apakah masuk Omah Ngaji harus punya hafalan Al-qur’an?',
    answer:
      'Tidak harus, salah satu Program di Omah Ngaji Al Anshori adalah Ngaji Quran, hal ini memberikan wadah bagi santri untuk belajar dan menghafal Al Quran.',
    order: 3,
  },
  {
    question: 'Apakah harus bisa baca kitab kuning ?',
    answer:
      'Tidak harus, Ngaji Kitab di Omah Ngaji Al Anshori dengan Metode Bandongan, Guru menyampaikan apa yang ada di dalam kitab dan menjelaskan, santri menulis, mendengarkan, dan memahami.',
    order: 4,
  },
  {
    question: 'Apakah boleh hanya mengikuti Kegiatan di Omah Ngaji tapi tidurnya di kos?',
    answer:
      'Tentu saja boleh, Omah Ngaji Al Anshori membuka diri bagi siapa saja yang ingin belajar bersama.',
    order: 5,
  },
  {
    question: 'Apa maksud santri mukim?',
    answer:
      'Santri mukim adalah santri Omah Ngaji yang tidur menginap di Asrama Omah Ngaji Al Anshori.',
    order: 6,
  },
  {
    question: 'Apa maksud santri non mukim?',
    answer:
      'Santri non mukim adalah santri yang hanya mengikuti kegiatan Omah Ngaji, tetapi tidak tidur menginap di Omah Ngaji Al Anshori.',
    order: 7,
  },
  {
    question: 'Berapa jarak antara Omah Ngaji ke UNS?',
    answer: 'Jarak Omah Ngaji Al Anshori dengan UNS sekitar 2,3 KM.',
    order: 8,
  },
  {
    question: 'Apa yang masuk Omah Ngaji harus dari UNS?',
    answer:
      'Tentu saja tidak, Omah Ngaji Al Anshori terbuka untuk kampus sekitar Omah Ngaji seperti ISI Surakarta, Politeknik Akbara, AK Tekstil Solo, Poltekkes Surakarta, dan sekitarnya.',
    order: 9,
  },
  {
    question: 'Berapa jumlah santri per kamar?',
    answer:
      'Untuk Putri dihuni 2-4 orang per kamar sesuai dengan ukuran kamar. Untuk Putra dihuni 3-5 orang per kamar sesuai dengan ukuran kamar.',
    order: 10,
  },
  {
    question: 'Apa di Omah Ngaji sudah disediakan makan?',
    answer:
      'Omah Ngaji Al Anshori menyediakan makan pagi dan sore, setiap santri akan mendapatkan piket masak.',
    order: 11,
  },
  {
    question: 'Apakah tinggal di Omah Ngaji boleh ikut Organisasi kampus?',
    answer:
      'Omah Ngaji Al Anshori mendukung dan memberikan kebebasan pada setiap santri untuk ikut dan aktif di Organisasi kampus maupun luar kampus.',
    order: 12,
  },
]

const SETTINGS: Array<{ key: string; value: string }> = [
  // SEO & Identitas
  { key: 'site_name', value: 'Omah Ngaji Al-Anshori' },
  {
    key: 'site_description',
    value:
      'Omah Ngaji Al-Anshori adalah asrama mahasiswa yang bertujuan untuk mengembangkan karakter dan spiritualitas mahasiswa.',
  },
  // Kontak
  {
    key: 'contact_address',
    value: 'Ngemplak, RT.01/RW.29, Mojosongo, Kec. Jebres, Kota Surakarta, Jawa Tengah 57127',
  },
  { key: 'contact_wa_putra', value: '+628123456789' },
  { key: 'contact_wa_putri', value: '+628123456789' },
  // Sosial Media
  { key: 'social_facebook', value: '' },
  { key: 'social_instagram', value: 'https://www.instagram.com/omahngaji_' },
  { key: 'social_youtube_link', value: 'https://youtube.com/@ojialanshori' },
  { key: 'social_youtube_embed', value: 'https://www.youtube.com/embed/8_yx6vHuLSg' },
  { key: 'social_tiktok', value: '' },
]

const TESTIMONIALS = [
  {
    name: 'Asmaul Khusna, S.Pd.',
    title: 'Penerima Beasiswa LPDP Magister Program Monash University',
    content:
      "Omah Ngaji adalah rumah kedua bagi Khusna. Tempat dimana Khusna bertumbuh, belajar mengaji dan nilai-nilai kehidupan. Omah ngaji itu 'adem', erat dengan rasa kekeluargaannya. Terutama, bapak dan ibu yang senantiasa membimbing dengan penuh kasih, serta teman-teman yang saling mendukung, membuat Omah Ngaji menjadi support system terbesar bagi Khusna.",
    avatarPath: '/images/testimonials/khusna.jpg',
    order: 1,
  },
  {
    name: 'Putri Lestari, S.Pd.',
    title: 'Penerima Beasiswa LPDP MSc Social Anthropology, The University of Edinburgh',
    content:
      'Di sela-sela kesibukan dalam aktivitas kemahasiswaan, Omah Ngaji merupakan oase bagi saya selama di Solo. Saya tidak sekadar mengaji namun juga diberi ruang mengasah nalar berpikir melalui diskusi dan pelatihan untuk meningkatkan skill. Tidak berhenti pada ilmu praktis, saya juga belajar tentang kebermanfaatan di sini. Banyak kenangan dan kebersamaan bersama guru dan sahabat yang tidak hanya terpatri dalam memori, namun juga memberikan hikmah dalam kehidupan saya.',
    avatarPath: '/images/testimonials/putri.jpg',
    order: 2,
  },
  {
    name: 'Eka Wulan Safriani, S.Pd.',
    title: 'Penerima Beasiswa LPDP Magister Program UPI',
    content:
      'Bagi saya omah ngaji bukan hanya sekedar tempat melepas istirahat dari padatnya aktivitas kampus, tapi lebih dari itu. Omah ngaji menjadi sebuah rumah untuk menimba ilmu agama, rumah untuk membuka wawasan, rumah untuk tumbuh bersama, bahkan selama saya di Omah Ngaji, saya menemukan figure-figure yang membuat saya terdorong dan termotivasi untuk terus berprestasi di akademik dan aktif terlibat kegiatan sosial di masyarakat. Bahkan ada satu nilai dari omah ngaji yang terus saya pegang sampai sekarang, yakni ilmu dan adab.',
    avatarPath: '/images/testimonials/eka.jpg',
    order: 3,
  },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.MYSQL_URL) {
    throw new Error('MYSQL_URL is not set. Check your .env file.')
  }

  console.log('🔌 Connecting to database...')
  const connection = await mysql.createConnection(process.env.MYSQL_URL)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  await connection.execute('SET FOREIGN_KEY_CHECKS = 0')

  // ── pages ──────────────────────────────────────────────────────────────────
  console.log('\n📄 Seeding pages...')
  await connection.execute('TRUNCATE TABLE `pages`')
  await db.insert(schema.pages).values(PAGES)
  console.log(`  ✅ ${PAGES.length} pages inserted`)

  // ── activities ─────────────────────────────────────────────────────────────
  console.log('\n🎯 Seeding activities...')
  await connection.execute('TRUNCATE TABLE `activities`')
  await db.insert(schema.activities).values(ACTIVITIES)
  console.log(`  ✅ ${ACTIVITIES.length} activities inserted`)

  // ── board_members ──────────────────────────────────────────────────────────
  console.log('\n👥 Seeding board_members...')
  await connection.execute('TRUNCATE TABLE `board_members`')
  await db.insert(schema.boardMembers).values(BOARD_MEMBERS)
  console.log(`  ✅ ${BOARD_MEMBERS.length} board members inserted`)

  // ── faqs ───────────────────────────────────────────────────────────────────
  console.log('\n❓ Seeding faqs...')
  await connection.execute('TRUNCATE TABLE `faqs`')
  await db.insert(schema.faqs).values(FAQS)
  console.log(`  ✅ ${FAQS.length} FAQs inserted`)

  // ── testimonials ───────────────────────────────────────────────────────────
  console.log('\n💬 Seeding testimonials...')
  await connection.execute('TRUNCATE TABLE `testimonials`')
  await db.insert(schema.testimonials).values(TESTIMONIALS)
  console.log(`  ✅ ${TESTIMONIALS.length} testimonials inserted`)

  // ── settings ───────────────────────────────────────────────────────────────
  console.log('\n⚙️  Seeding settings...')
  for (const { key, value } of SETTINGS) {
    await db
      .insert(schema.settings)
      .values({ key, value })
      .onDuplicateKeyUpdate({ set: { value } })
  }
  console.log(`  ✅ ${SETTINGS.length} settings upserted`)

  await connection.execute('SET FOREIGN_KEY_CHECKS = 1')
  await connection.end()

  console.log('\n🎉 Seed complete!')
}

main().catch((err) => {
  console.error('\n💥 Seed failed:', err)
  process.exit(1)
})
