-- 1. Pastikan kolom lama dihapus (Abaikan jika muncul error "column doesn't exist" kalau ternyata sudah terhapus)
ALTER TABLE `pages` DROP COLUMN IF EXISTS `slug`;
ALTER TABLE `pages` DROP COLUMN IF EXISTS `content`;
ALTER TABLE `pages` DROP COLUMN IF EXISTS `status`;

-- 2. Hapus data lama di tabel pages jika ada, agar bersih (karena kita ganti struktur ke template)
TRUNCATE TABLE `pages`;

-- 1. Beranda
INSERT INTO `pages` (`title`, `template`, `meta`, `updated_at`)
VALUES (
  'Beranda',
  'home',
  '{"subtitle":"Asrama Mahasiswa","title":"Omah Ngaji Al-Anshori","description":"Omah Ngaji Al-Anshori adalah asrama mahasiswa yang bertujuan untuk mengembangkan karakter dan spiritualitas mahasiswa.","features":"Kuliah sambil Ngaji\\nNgaji Al-Qur\'an dan Kitab\\nRumah Baru, Keluarga Baru\\nKegiatan Seru Lainnya","maxNews":4,"maxPena":4}',
  NOW()
);

-- 2. Profil
INSERT INTO `pages` (`title`, `template`, `meta`, `updated_at`)
VALUES (
  'Profil',
  'profile',
  '{"overview":"Omah Ngaji Al-Anshori berdiri pada Juli 2015. Sebagai wadah khusus mahasiswa, Omah Ngaji Al-Anshori ingin menjadi wadah yang mampu memadukan dimensi positif perguruan tinggi dengan dimensi positif Pendidikan Islam, yang akan menjadi penempaan kepribadian dan moral berdasarkan nilai-nilai Islam Ahlussunnah Wal Jamaah.\\n\\nOmah Ngaji Al-Anshori harus berjuang untuk bertahan dengan sumber daya yang terbatas di tahun-tahun awal. Banyak tantangan silih berganti yang harus dilewati dan dihadapi. Namun, dengan kegigihan dan tekad yang kuat serta doa semua yang terlibat, menjadikan Omah Ngaji Al-Anshori mampu bertahan dan berkembang baik secara kuantitas maupun kualitas.\\n\\nPerkembangan itu terlihat dari semakin tertata dan terstrukturnya kegiatan di Omah Ngaji Al-Anshori, diantaranya: mengaji Al-Quran, mengaji kitab, diskusi tematik hingga kegiatan amaliyah penunjang lainnya. Harapannya, kegiatan di Omah Ngaji Al-Anshori dapat mencetak kader yang cakap secara intelektual maupun spiritual dan berdaya guna bagi masyarakat.\\n\\nBerlandaskan kekeluargaan dan semangat perjuangan tinggi untuk membumikan Islam Rahmatan Lil ‘Alamin, Omah Ngaji Al-Anshori bertekad untuk selalu berproses dan berprogress.","vision":"Membumikan Islam Sebagai Rahmat Semesta Alam","mission":"Mengadakan kajian keagamaan yang bersumber dari Al-Qur’an dan Hadits\\nMenyeimbangkan nilai intelektualisme dan agama\\nMengistiqomahkan silaturahmi dengan para ulama dan kyai\\nMengedepankan nilai persaudaraan dan kebersamaan"}',
  NOW()
);

-- 3. Kegiatan
INSERT INTO `pages` (`title`, `template`, `meta`, `updated_at`)
VALUES ('Kegiatan', 'activities', '{}', NOW());

-- 4. Kontak
INSERT INTO `pages` (`title`, `template`, `meta`, `updated_at`)
VALUES ('Kontak', 'contact', '{}', NOW());

-- 5. FAQ
INSERT INTO `pages` (`title`, `template`, `meta`, `updated_at`)
VALUES ('FAQ', 'faq', '{}', NOW());
