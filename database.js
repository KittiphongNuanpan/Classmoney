const { Pool } = require('pg');

const pool = new Pool({
    // ตรงบรรทัดล่างนี้ เวลาเทสต์ในคอม ให้เอาลิงก์ Supabase ของคุณมาใส่ในเครื่องหมายคำพูดแทน process.env.DATABASE_URL ได้เลยครับ
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false }
});

module.exports = pool;