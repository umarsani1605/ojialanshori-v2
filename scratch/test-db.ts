import 'dotenv/config'
import mysql from 'mysql2/promise'

async function test() {
  console.log('Connecting to:', process.env.MYSQL_URL)
  try {
    const connection = await mysql.createConnection(process.env.MYSQL_URL!)
    console.log('✅ Connected!')
    
    const [pagesColumns] = await connection.execute('SHOW COLUMNS FROM pages')
    console.log('Pages columns:', pagesColumns)
    
    const [testimonialsColumns] = await connection.execute('SHOW COLUMNS FROM testimonials')
    console.log('Testimonials columns:', testimonialsColumns)

    const [faqsColumns] = await connection.execute('SHOW COLUMNS FROM faqs')
    console.log('FAQs columns:', faqsColumns)
    
    await connection.end()
  } catch (err) {
    console.error('❌ Failed:', err)
  }
}
test()
