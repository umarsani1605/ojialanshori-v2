<script setup lang="ts">
const tentang = [
  "Omah Ngaji Al-Anshori berdiri pada Juli 2015. Sebagai wadah khusus mahasiswa, Omah Ngaji Al-Anshori ingin menjadi wadah yang mampu memadukan dimensi positif perguruan tinggi dengan dimensi positif Pendidikan Islam, yang akan menjadi penempaan kepribadian dan moral berdasarkan nilai-nilai Islam Ahlussunnah Wal Jamaah.",
  "Omah Ngaji Al-Anshori harus berjuang untuk bertahan dengan sumber daya yang terbatas di tahun-tahun awal. Banyak tantangan silih berganti yang harus dilewati dan dihadapi. Namun, dengan kegigihan dan tekad yang kuat serta doa semua yang terlibat, menjadikan Omah Ngaji Al-Anshori mampu bertahan dan berkembang baik secara kuantitas maupun kualitas.",
  "Perkembangan itu terlihat dari semakin tertata dan terstrukturnya kegiatan di Omah Ngaji Al-Anshori, diantaranya: mengaji Al-Quran, mengaji kitab, diskusi tematik hingga kegiatan amaliyah penunjang lainnya. Harapannya, kegiatan di Omah Ngaji Al-Anshori dapat mencetak kader yang cakap secara intelektual maupun spiritual dan berdaya guna bagi masyarakat.",
  "Berlandaskan kekeluargaan dan semangat perjuangan tinggi untuk membumikan Islam Rahmatan Lil ‘Alamin, Omah Ngaji Al-Anshori bertekad untuk selalu berproses dan berprogress.",
];

const visi = "Membumikan Islam Sebagai Rahmat Semesta Alam";

const misi = [
  "Mengadakan kajian keagamaan yang bersumber dari Al-Qur’an dan Hadits",
  "Menyeimbangkan nilai intelektualisme dan agama",
  "Mengistiqomahkan silaturahmi dengan para ulama dan kyai",
  "Mengedepankan nilai persaudaraan dan kebersamaan",
];

const penasehat = [
  { name: "K.H. Abdul Karim Ahmad", image: "/images/profil/gus-karim.jpg" },
  { name: "Kiai Anshori Syukri", image: "/images/profil/kyai-anshori.jpg" },
];

const pengajar = [
  { name: "M. Tohir Rosyid, S.Si", image: "/images/profil/tohir.png" },
  {
    name: "Dr. Faizatul Anshoriah, S.Sos., M.Si.",
    image: "/images/profil/faiz.png",
  },
  { name: "Dr. Arifuddin, Lc., M.A.", image: "/images/profil/arifuddin.png" },
  { name: "Abdul Halim, S.Th.I., M.Hum.", image: "/images/profil/halim.png" },
  { name: "Andi Alfan Qodri, S.Si.", image: "/images/profil/alfan.png" },
  { name: "Ahmad Multazam, S.Hum.", image: "/images/profil/multazam.png" },
];

useSeoMeta({
  title: "Profil — Omah Ngaji Al-Anshori",
  description:
    "Selayang pandang, visi, misi, dan struktur pengurus Omah Ngaji Al-Anshori — asrama mahasiswa berbasis pesantren di Surakarta.",
  ogTitle: "Profil — Omah Ngaji Al-Anshori",
  ogDescription:
    "Selayang pandang, visi, misi, dan struktur pengurus Omah Ngaji Al-Anshori.",
  ogImage: "/images/logo/logo1.png",
});
</script>

<template>
  <div class="bg-slate-50">
    <UContainer class="py-12 md:py-16">
      <!-- Selayang Pandang -->
      <section class="mb-16">
        <PublicSectionHeading title="Selayang Pandang" />
        <div class="space-y-4 text-base leading-relaxed text-slate-700">
          <p v-for="(p, idx) in tentang" :key="idx">
            {{ p }}
          </p>
        </div>
      </section>

      <!-- Visi -->
      <section class="mb-16">
        <PublicSectionHeading title="Visi" />
        <p class="text-base text-slate-700">
          {{ visi }}
        </p>
      </section>

      <!-- Misi -->
      <section class="mb-16">
        <PublicSectionHeading title="Misi" />
        <ol class="space-y-2 text-base text-slate-700">
          <li v-for="(item, idx) in misi" :key="idx">
            {{ idx + 1 }}. {{ item }}
          </li>
        </ol>
      </section>

      <!-- Struktur Pengurus -->
      <section>
        <PublicSectionHeading title="Struktur Pengurus" />

        <!-- Penasehat -->
        <div class="mb-12">
          <h3 class="font-bold text-lg mb-8">Penasehat:</h3>
          <div
            class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10"
          >
            <PublicProfileFigure
              v-for="person in penasehat"
              :key="person.name"
              :image="person.image"
              :name="person.name"
            />
          </div>
        </div>

        <!-- Pengajar -->
        <div>
          <h3 class="font-bold text-lg mb-8">Pengajar:</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-10">
            <PublicProfileFigure
              v-for="person in pengajar"
              :key="person.name"
              :image="person.image"
              :name="person.name"
            />
          </div>
        </div>
      </section>
    </UContainer>
  </div>
</template>
