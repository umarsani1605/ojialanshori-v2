-- 1. Kegiatan (activities)
TRUNCATE TABLE `activities`;

INSERT INTO `activities` (`title`, `description`, `image_path`, `order`, `created_at`) VALUES
("Ngaji Al-Qur\'an", "Ngaji Al-Qur\'an dilaksanakan setiap hari Ba\'da Subuh. Santri menyetorkan bacaan Quran pada Bapak Rosyid (Putra) dan Ibu Faiz (Putri). Ngaji subuh dilakukan dengan Bil Nadzri (Membaca) dan atau Bil Hifdzi (Menghafal).", "/images/kegiatan/ngaji-quran.jpg", 1, NOW()),
("Ngaji Kitab Kuning", "Ngaji kitab kuning dilaksanakan 3 kali dalam seminggu setiap Ba\'da Maghrib, mengkaji kitab kuning karya Ulama dengan metode bandongan. Topik kajian: Kitab Fiqih, Kitab Tauhid, dan Kitab Akhlak.", "/images/kegiatan/kitab-kuning.jpg", 2, NOW()),
("Diskusi Tematik", "Diskusi Tematik merupakan kegiatan diskusi dengan tema-tema terkini, bertujuan agar santri tetap aktif dan kritis pada permasalahan sosial non-keagamaan. Membiasakan santri untuk selalu terbuka dan moderat dalam menyikapi suatu permasalahan.", "/images/kegiatan/diskusi-tematik.jpg", 3, NOW()),
("Pengembangan Diri", "Pengembangan diri merupakan kegiatan dimana santri diharuskan untuk menguasai dan mendalami amalan-amalan ilmu keagamaan. Harapannya santri dapat memahami makna tersurat dan tersirat, serta mengamalkan dalam kegiatan sehari-hari.", "/images/kegiatan/pengembangan-diri.jpg", 4, NOW()),
("Kegiatan Seru Lainnya", "Selain kegiatan di atas, Omah Ngaji memiliki kegiatan rutin lain seperti Pembacaan Tahlil, Pembacaan Kitab Maulid, Khitobah, Semaan Al Quran Mingguan, Bootcamp, Rihlah, dan Kegiatan Ramadhan.", "/images/kegiatan/lainnya.jpg", 5, NOW());

-- 2. Pengurus (board_members)
TRUNCATE TABLE `board_members`;

INSERT INTO `board_members` (`name`, `role`, `avatar_path`, `order`, `created_at`) VALUES
("K.H. Abdul Karim Ahmad", "Penasehat", "/images/profil/gus-karim.jpg", 1, NOW()),
("Kiai Anshori Syukri", "Penasehat", "/images/profil/kyai-anshori.jpg", 2, NOW()),
("M. Tohir Rosyid, S.Si", "Pengajar", "/images/profil/tohir.png", 3, NOW()),
("Dr. Faizatul Anshoriah, S.Sos., M.Si.", "Pengajar", "/images/profil/faiz.png", 4, NOW()),
("Dr. Arifuddin, Lc., M.A.", "Pengajar", "/images/profil/arifuddin.png", 5, NOW()),
("Abdul Halim, S.Th.I., M.Hum.", "Pengajar", "/images/profil/halim.png", 6, NOW()),
("Andi Alfan Qodri, S.Si.", "Pengajar", "/images/profil/alfan.png", 7, NOW()),
("Ahmad Multazam, S.Hum.", "Pengajar", "/images/profil/multazam.png", 8, NOW());

-- 3. Testimonial (testimonials)
TRUNCATE TABLE `testimonials`;

INSERT INTO `testimonials` (`name`, `title`, `content`, `avatar`, `order`, `is_active`, `created_at`) VALUES
("Asmaul Khusna, S.Pd.", "Penerima Beasiswa LPDP Magister Program Monash University", "Omah Ngaji adalah rumah kedua bagi Khusna. Tempat dimana Khusna bertumbuh, belajar mengaji dan nilai-nilai kehidupan. Omah ngaji itu ‘adem’, erat dengan rasa kekeluargaannya. Terutama, bapak dan ibu yang senantiasa membimbing dengan penuh kasih, serta teman-teman yang saling mendukung, membuat Omah Ngaji menjadi support system terbesar bagi Khusna.", "/images/testimonials/khusna.jpg", 1, 1, NOW()),
("Putri Lestari, S.Pd.", "Penerima Beasiswa LPDP MSc Social Anthropology, The University of Edinburgh", "Di sela-sela kesibukan dalam aktivitas kemahasiswaan, Omah Ngaji merupakan oase bagi saya selama di Solo. Saya tidak sekadar mengaji namun juga diberi ruang mengasah nalar berpikir melalui diskusi dan pelatihan untuk meningkatkan skill. Tidak berhenti pada ilmu praktis, saya juga belajar tentang kebermanfaatan di sini. Banyak kenangan dan kebersamaan bersama guru dan sahabat yang tidak hanya terpatri dalam memori, namun juga memberikan hikmah dalam kehidupan saya.", "/images/testimonials/putri.jpg", 2, 1, NOW()),
("Eka Wulan Safriani, S.Pd.", "Penerima Beasiswa LPDP Magister Program UPI", "Bagi saya omah ngaji bukan hanya sekedar tempat melepas istirahat dari padatnya aktivitas kampus, tapi lebih dari itu. Omah ngaji menjadi sebuah rumah untuk menimba ilmu agama, rumah untuk membuka wawasan, rumah untuk tumbuh bersama, bahkan selama saya di Omah Ngaji, saya menemukan figure-figure yang membuat saya terdorong dan termotivasi untuk terus berprestasi di akademik dan aktif terlibat kegiatan sosial di masyarakat. Bahkan ada satu nilai dari omah ngaji yang terus saya pegang sampai sekarang, yakni ilmu dan adab.", "/images/testimonials/eka.jpg", 3, 1, NOW());

-- 4. FAQ (faqs)
TRUNCATE TABLE `faqs`;

INSERT INTO `faqs` (`question`, `answer`, `order`, `is_active`, `created_at`, `updated_at`) VALUES
("Siapa saja yang bisa mendaftar di Omah Ngaji Al-Anshori?", "Omah Ngaji Al-Anshori terbuka untuk seluruh mahasiswa aktif dari berbagai perguruan tinggi di sekitar Surakarta yang memiliki komitmen untuk belajar agama Islam berlandaskan nilai-nilai Ahlussunnah Wal Jamaah.", 1, 1, NOW(), NOW()),
("Apa saja program unggulan di Omah Ngaji?", "Program unggulan kami meliputi Ngaji Al-Qur\'an (bil-nadzri & bil-hifdzi) setiap Ba\'da Subuh, Ngaji Kitab Kuning (Fiqih, Tauhid, Akhlak) Ba\'da Maghrib, Diskusi Tematik, dan program Pengembangan Diri.", 2, 1, NOW(), NOW()),
("Apakah ada kegiatan selain mengaji?", "Ya, selain mengaji kami juga memiliki kegiatan seru lainnya seperti Pembacaan Tahlil, Pembacaan Kitab Maulid, Khitobah, Semaan Al Quran Mingguan, Bootcamp, Rihlah (jalan-jalan/ziarah), dan Kegiatan Ramadhan.", 3, 1, NOW(), NOW()),
("Di mana lokasi asrama Omah Ngaji Al-Anshori?", "Omah Ngaji Al-Anshori berlokasi di area Surakarta (Solo). Lokasi kami sangat strategis dan mudah dijangkau dari berbagai kampus utama di kota Surakarta.", 4, 1, NOW(), NOW()),
("Bagaimana prosedur dan waktu pendaftaran santri baru?", "Pendaftaran biasanya dibuka menjelang tahun ajaran baru perguruan tinggi. Informasi resmi mengenai pendaftaran, kuota, dan persyaratan akan diumumkan melalui Instagram resmi kami @omahngaji_ dan website ini.", 5, 1, NOW(), NOW());