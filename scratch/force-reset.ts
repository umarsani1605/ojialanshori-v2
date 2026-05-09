import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function run() {
  const c = await mysql.createPool(process.env.MYSQL_URL!);
  const hash = await bcrypt.hash('@ojisuperadminsolo', 10);
  await c.query('UPDATE users SET password = ?, password_type = "bcrypt" WHERE email = "superadmin@ojialanshori.com"', [hash]);
  console.log('Password reset successfully.');
  c.end();
}
run();
