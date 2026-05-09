<?php
$hash1 = '$2y$10$Fajj4Bp6lpAIdxdoqhLDluxVQ8zEdV9tgSw4.QQD8tJScFQoUiumq'; // Umar
$hash2 = '$2y$10$3GerM/RP4tpiHx5ZRr9Lfumsz8QBo4VnxfnuneQrXqWfnN9eYKaE.'; // Ulf
$pass = '@ojisuperadminsolo';

if (password_verify($pass, $hash1)) {
    echo "Match with Umar!\n";
}
if (password_verify($pass, $hash2)) {
    echo "Match with Ulf!\n";
}
echo "Done\n";
