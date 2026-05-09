import wphash from 'wordpress-hash-node';

const hash = '$wp$2y$10$5CG2SwZGLrV7fWDFGAd5f.qTdZqcFKm4bgonkif2iuCXg4zTHTBUW';
const plain = '@ojisuperadminsolo';

const isMatch = wphash.CheckPassword(plain, hash);
console.log('Match with wordpress-hash-node?', isMatch);
