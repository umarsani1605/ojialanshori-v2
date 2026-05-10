import "dotenv/config";
import mysql from "mysql2/promise";
const c = await mysql.createConnection(process.env.MYSQL_URL!);
const [rows] = await c.execute("SELECT id, username FROM users LIMIT 5");
console.log("users:", JSON.stringify(rows));
const [cats] = await c.execute("SELECT id, slug FROM categories LIMIT 10");
console.log("categories:", JSON.stringify(cats));
await c.end();
