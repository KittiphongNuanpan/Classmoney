const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./class_money.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS payments ( 
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        studentNo INTEGER, 
        type TEXT, 
        slipLink TEXT, 
        dateSent DATETIME DEFAULT CURRENT_TIMESTAMP, 
        amount REAL 
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS ledger ( 
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        date DATETIME DEFAULT CURRENT_TIMESTAMP, 
        description TEXT, 
        type TEXT, 
        amount REAL,
        payment_id INTEGER
    )`);
    
    // special_targets ต้องมี method + customData สำหรับระบบเฉพาะบุคคล
    db.run(`CREATE TABLE IF NOT EXISTS special_targets ( 
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        title TEXT, 
        totalAmount REAL, 
        perPerson REAL,
        method TEXT DEFAULT 'divide',
        customData TEXT DEFAULT '-'
    )`);

    // Migration: เพิ่ม columns ให้ตารางเก่าที่อาจสร้างไว้โดยไม่มี method/customData
    // SQLite จะ error เงียบๆ ถ้า column มีอยู่แล้ว — ปลอดภัยไว้ก่อน
    db.run(`ALTER TABLE special_targets ADD COLUMN method TEXT DEFAULT 'divide'`, () => {});
    db.run(`ALTER TABLE special_targets ADD COLUMN customData TEXT DEFAULT '-'`, () => {});
});

const pool = {
    query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            const normalizedSql = sql.replace(/\$\d+/g, '?');
            
            if (normalizedSql.trim().toUpperCase().startsWith('SELECT')) {
                db.all(normalizedSql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve({ rows });
                });
            } else {
                db.run(normalizedSql, params, function(err) {
                    if (err) reject(err);
                    else resolve({ rows: [], lastID: this.lastID, changes: this.changes });
                });
            }
        });
    }
};

module.exports = pool;