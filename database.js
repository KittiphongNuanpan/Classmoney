const { Pool } = require('pg');

// วางลิงก์ที่ได้จาก Transaction pooler ตรงนี้ครับ (เผื่อเวลารันเทสต์ในคอมตัวเอง)
const supabaseUrl = process.env.DATABASE_URL || "postgresql://postgres.gbncpprvrytzifyzbtnr:[123789147369159#Ss]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";

const pool = new Pool({
    connectionString: supabaseUrl, 
    ssl: { rejectUnauthorized: false }
});

module.exports = pool;
