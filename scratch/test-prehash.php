<?php
$password = '@ojisuperadminsolo';
echo "PHP: " . base64_encode( hash_hmac( 'sha384', $password, 'wp-sha384', true ) ) . "\n";
