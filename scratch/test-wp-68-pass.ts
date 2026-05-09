import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createHmac } from 'node:crypto';

const password = '@ojisuperadminsolo';
const preHash = createHmac('sha384', 'wp-sha384').update(password).digest('base64');
const storedHash = '$wp$2y$10$5CG2SwZGLrV7fWDFGAd5f.qTdZqcFKm4bgonkif2iuCXg4zTHTBUW';
const bcryptPart = storedHash.slice(4); // $2y$10...

async function run() {
  const isMatch = await bcrypt.compare(preHash, bcryptPart);
  console.log('Does it match with HMAC-SHA384 pre-hash?', isMatch);
}
run();
