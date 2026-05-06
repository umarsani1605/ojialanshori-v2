<script setup lang="ts">
const programs = [
  {
    title: "Ngaji Al-Qur'an",
    image: "/images/kegiatan/ngaji-quran.jpg",
    description:
      "Ngaji Al-Qur'an dilaksanakan setiap hari Ba'da Subuh. Santri menyetorkan bacaan Quran pada Bapak Rosyid (Putra) dan Ibu Faiz (Putri). Ngaji subuh dilakukan dengan Bil Nadzri (Membaca) dan atau Bil Hifdzi (Menghafal).",
  },
  {
    title: "Ngaji Kitab Kuning",
    image: "/images/kegiatan/kitab-kuning.jpg",
    description:
      "Ngaji kitab kuning dilaksanakan 3 kali dalam seminggu setiap Ba'da Maghrib, mengkaji kitab kuning karya Ulama dengan metode bandongan. Topik kajian: Kitab Fiqih, Kitab Tauhid, dan Kitab Akhlak.",
  },
  {
    title: "Diskusi Tematik",
    image: "/images/kegiatan/diskusi-tematik.jpg",
    description:
      "Diskusi Tematik merupakan kegiatan diskusi dengan tema-tema terkini, bertujuan agar santri tetap aktif dan kritis pada permasalahan sosial non-keagamaan. Membiasakan santri untuk selalu terbuka dan moderat dalam menyikapi suatu permasalahan.",
  },
  {
    title: "Pengembangan Diri",
    image: "/images/kegiatan/pengembangan-diri.jpg",
    description:
      "Pengembangan diri merupakan kegiatan dimana santri diharuskan untuk menguasai dan mendalami amalan-amalan ilmu keagamaan. Harapannya santri dapat memahami makna tersurat dan tersirat, serta mengamalkan dalam kegiatan sehari-hari.",
  },
  {
    title: "Kegiatan Seru Lainnya",
    image: "/images/kegiatan/lainnya.jpg",
    description:
      "Selain kegiatan di atas, Omah Ngaji memiliki kegiatan rutin lain seperti Pembacaan Tahlil, Pembacaan Kitab Maulid, Khitobah, Semaan Al Quran Mingguan, Bootcamp, Rihlah, dan Kegiatan Ramadhan.",
  },
];

useSeoMeta({
  title: "Kegiatan — Omah Ngaji Al-Anshori",
  description:
    "Program kegiatan rutin Omah Ngaji Al-Anshori: Ngaji Al-Qur'an, Kitab Kuning, Diskusi Tematik, Pengembangan Diri, dan kegiatan lainnya.",
  ogTitle: "Kegiatan — Omah Ngaji Al-Anshori",
  ogDescription:
    "Program kegiatan rutin Omah Ngaji Al-Anshori — dari ngaji Al-Qur'an sampai diskusi tematik.",
  ogImage: "/images/logo/logo1.png",
});
</script>

<template>
  <div class="bg-slate-50">
    <UContainer class="py-12 md:py-16">
      <section>
        <PublicSectionHeading title="Kegiatan" />

        <div class="space-y-20 md:space-y-16">
          <div
            v-for="(program, idx) in programs"
            :key="program.title"
            class="flex flex-col md:flex-row gap-6 md:gap-10 items-start"
          >
            <!-- Image -->
            <div
              class="flex-none h-72 w-full max-w-120 rounded-2xl overflow-hidden bg-slate-100 aspect-4/3"
              :class="idx % 2 === 1 ? 'md:order-2' : ''"
            >
              <NuxtImg
                :src="program.image"
                :alt="program.title"
                loading="lazy"
                class="w-full h-full object-cover"
              />
            </div>

            <!-- Text -->
            <div
              class="flex flex-col justify-center gap-3 mt-0 md:mt-12"
              :class="idx % 2 === 1 ? 'md:order-1' : ''"
            >
              <h3 class="font-bold text-xl md:text-2xl">
                {{ program.title }}
              </h3>
              <p class="text-base text-slate-700 leading-relaxed">
                {{ program.description }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </UContainer>
  </div>
</template>
