import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';

async function run() {
  const plain = '@ojisuperadminsolo';
  const md5Hash = createHash('md5').update(plain).digest('hex');
  const isMatchMd5Bcrypt = await bcrypt.compare(md5Hash, '$2a$10$5CG2SwZGLrV7fWDFGAd5f.qTdZqcFKm4bgonkif2iuCXg4zTHTBUW');
  const isMatchMd5BcryptY = await bcrypt.compare(md5Hash, '$2y$10$5CG2SwZGLrV7fWDFGAd5f.qTdZqcFKm4bgonkif2iuCXg4zTHTBUW');

  console.log('Does MD5 hash of the password match the WP bcrypt?', isMatchMd5Bcrypt, isMatchMd5BcryptY);
}

run();
