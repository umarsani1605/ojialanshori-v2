const { PasswordHash } = require('node-phpass');
const bcrypt = require('bcryptjs');

const ph = new PasswordHash(8, true);
const plain = '@ojisuperadminsolo';
const hash = '$wp$2y$10$5CG2SwZGLrV7fWDFGAd5f.qTdZqcFKm4bgonkif2iuCXg4zTHTBUW';
console.log('node-phpass CheckPassword:', ph.CheckPassword(plain, hash));

// Wait! Did CheckPassword return TRUE?
