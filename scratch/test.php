<?php
$hash = '$2y$10$5CG2SwZGLrV7fWDFGAd5f.qTdZqcFKm4bgonkif2iuCXg4zTHTBUW';
$pass = '@ojisuperadminsolo';
if (password_verify($pass, $hash)) {
    echo "Match in PHP!\n";
} else {
    echo "No match in PHP!\n";
}
