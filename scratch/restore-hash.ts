import 'dotenv/config';
import mysql from 'mysql2/promise';

async function run() {
  const c = await mysql.createPool(process.env.MYSQL_URL!);
  const hash = '$wp$2y$10$5CG2SwZGLrV7fWDFGAd5f.qTdZqcFKm4bgonkif2iuCXg4zTHTBUW';
  await c.query('UPDATE users SET password = ?, password_type = "phpass" WHERE email = "superadmin@ojialanshori.com"', [hash]);
  console.log('Restored original WP hash.');
  c.end();
}
run();
