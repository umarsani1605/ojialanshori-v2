import 'dotenv/config'
import mysql from 'mysql2/promise'

async function test() {
  console.log('Connecting to:', process.env.MYSQL_URL)
  try {
    const connection = await mysql.createConnection(process.env.MYSQL_URL!)
    console.log('✅ Connected!')
    await connection.end()
  } catch (err) {
    console.error('❌ Failed:', err)
  }
}
test()
