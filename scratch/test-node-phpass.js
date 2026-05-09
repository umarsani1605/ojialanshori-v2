const { PasswordHash } = require('node-phpass');

const ph = new PasswordHash();
const isMatch1 = ph.CheckPassword('@ojisuperadminsolo', '$wp$2y$10$5CG2SwZGLrV7fWDFGAd5f.qTdZqcFKm4bgonkif2iuCXg4zTHTBUW');
console.log('Match with node-phpass:', isMatch1);
