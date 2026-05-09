<?php
$password = '@ojisuperadminsolo';
$pre_hash = base64_encode( hash_hmac( 'sha384', $password, 'wp-sha384', true ) );
$stored_hash = '$wp$2y$10$5CG2SwZGLrV7fWDFGAd5f.qTdZqcFKm4bgonkif2iuCXg4zTHTBUW'; 
$bcrypt_part = substr($stored_hash, 4); // Removes '$wp$'

if (password_verify($pre_hash, $bcrypt_part)) {
    echo "Success in PHP HMAC!\n";
} else {
    echo "Fail in PHP HMAC.\n";
}
