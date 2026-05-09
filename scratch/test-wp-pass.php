<?php
$hash = '$2y$10$5CG2SwZGLrV7fWDFGAd5f.qTdZqcFKm4bgonkif2iuCXg4zTHTBUW';
$pass = '@ojisuperadminsolo';
$salt = '$2y$10$5CG2SwZGLrV7fWDFGAd5f.q'; // This is actually an invalid assumption but testing MD5 combo

// SolidWP/iThemes Security plugin uses:
// 1. the password
// 2. MD5(password)
// Let's test if the plain password was somehow altered or if wp_hash_password was overridden.

// Since WP uses wp_hash_password, some plugins like Solid Security might do:
// password_verify( $password, $hash ) OR password_verify( md5( $password ), $hash )
// Which we tested.

// What if the password is over 72 characters? No, it's short.
echo "Testing...\n";
