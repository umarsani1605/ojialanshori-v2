<?php
$hash = '$2y$10$5CG2SwZGLrV7fWDFGAd5f.qTdZqcFKm4bgonkif2iuCXg4zTHTBUW';
$pass = '@ojisuperadminsolo';
if (password_verify(md5($pass), $hash)) {
    echo "Match with MD5!\n";
} else {
    echo "No match with MD5!\n";
}
