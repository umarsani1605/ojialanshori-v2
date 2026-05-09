<?php
$hash = '$2y$10$5CG2SwZGLrV7fWDFGAd5f.qTdZqcFKm4bgonkif2iuCXg4zTHTBUW';
$passwords = [
  'superadmin@ojialanshori.com',
  'superadmin',
  'ojialanshori',
];
foreach ($passwords as $p) {
  if (password_verify($p, $hash)) {
    echo "MATCH FOUND: $p\n";
    exit;
  }
}
echo "No match.\n";
