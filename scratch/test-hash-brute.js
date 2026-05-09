const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const hash = '$2y$10$5CG2SwZGLrV7fWDFGAd5f.qTdZqcFKm4bgonkif2iuCXg4zTHTBUW';
const pass = '@ojisuperadminsolo';

const variants = [
  pass,
  crypto.createHash('md5').update(pass).digest('hex'),
  crypto.createHash('md5').update(pass).digest('base64'),
  crypto.createHash('sha1').update(pass).digest('hex'),
  crypto.createHash('sha256').update(pass).digest('hex'),
  crypto.createHash('sha512').update(pass).digest('hex'),
  Buffer.from(pass).toString('base64'),
];

async function run() {
  for (const v of variants) {
    if (await bcrypt.compare(v, hash)) {
      console.log('Match found! Variant:', v);
      return;
    }
  }
  console.log('No match found.');
}
run();
