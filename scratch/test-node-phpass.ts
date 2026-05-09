import phpass from 'node-phpass';

const ph = new phpass.PasswordHash(8, true);
const isMatch1 = ph.CheckPassword('@ojisuperadminsolo', '$wp$2y$10$5CG2SwZGLrV7fWDFGAd5f.qTdZqcFKm4bgonkif2iuCXg4zTHTBUW');
console.log('Match with node-phpass 1:', isMatch1);

const isMatch2 = ph.CheckPassword('@ojisuperadminsolo', '$P$BmH/IAKzH8wDa8ifnYSDkBfIA8ZoHx1');
console.log('Match with node-phpass 2 (portable):', isMatch2);
