<?php
$hash = '$2y$10$5CG2SwZGLrV7fWDFGAd5f.qTdZqcFKm4bgonkif2iuCXg4zTHTBUW';
$words = [
  'admin', 'superadmin', 'Superadmin', 'superadmin123', 'Admin123',
  'ojisuperadmin', 'oji_superadmin', 'oji-superadmin',
  '@ojisuperadmin', '@ojisuperadmin123', 'ojisuperadminsolo', '@ojisuperadminsolo',
  'password', 'Password', '123456', '12345678'
];
foreach($words as $w) {
  if (password_verify($w, $hash)) {
    echo "Found it: $w\n";
    exit;
  }
}
echo "None found.\n";
