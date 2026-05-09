import 'dotenv/config';
import { verifyUserPassword } from '../server/utils/password';

async function run() {
  const hash = '$wp$2y$10$5CG2SwZGLrV7fWDFGAd5f.qTdZqcFKm4bgonkif2iuCXg4zTHTBUW';
  const plain = '@ojisuperadminsolo';
  const isMatch = await verifyUserPassword(plain, hash, 'phpass');
  console.log('Does the new logic match the password?', isMatch);
}
run();
