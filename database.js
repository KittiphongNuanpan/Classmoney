const { Pool } = require('pg');

// ใส่ลิงก์ของคุณที่นี่ (ใช้สำหรับรันในคอม)
const supabaseUrl = process.env.DATABASE_URL || "postgresql://postgres.gbncpprvrytzifyzbtnr:123789147369159@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";

const pool = new Pool({
    connectionString: supabaseUrl, 
    ssl: { rejectUnauthorized: false }
});

// ระบบเช็คการเชื่อมต่อ
pool.connect()
    .then(() => console.log('🟢 เชื่อมต่อฐานข้อมูล Supabase สำเร็จ 100%!'))
    .catch(err => console.error('🔴 เชื่อมต่อฐานข้อมูลล้มเหลว (เช็ครหัสผ่าน):', err.message));

module.exports = pool;
