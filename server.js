const express = require('express');
const app = express();
const pool = require('./database'); 

app.use(express.json({ limit: '50mb' })); 
app.use(express.static('public'));

app.get('/api/slip/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT "slipLink" FROM payments WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0 && result.rows[0].slipLink !== "-") {
            const base64 = result.rows[0].slipLink.replace(/^data:image\/\w+;base64,/, "");
            const imgBuffer = Buffer.from(base64, 'base64');
            res.writeHead(200, { 'Content-Type': 'image/png' });
            res.end(imgBuffer);
        } else { res.send("ไม่มีสลิป"); }
    } catch(e) { res.send("Error"); }
});

app.get('/api', async (req, res) => {
    if (req.query.action === 'getDashboardData') {
        try {
            const payRes = await pool.query('SELECT * FROM payments ORDER BY "dateSent" ASC');
            const ledRes = await pool.query('SELECT * FROM ledger ORDER BY date ASC');
            const spRes = await pool.query('SELECT * FROM special_targets');
            
            const formattedPayments = payRes.rows.map(row => {
                if (row.slipLink && row.slipLink !== "-") { row.slipLink = `/api/slip/${row.id}`; }
                return row;
            });
            res.json({ status: "success", payments: formattedPayments, ledger: ledRes.rows, specialTargets: spRes.rows });
        } catch (err) { 
            console.error(err);
            res.json({ status: "error", message: "ดึงข้อมูลล้มเหลว" }); 
        }
    }
});

app.post('/api', async (req, res) => {
    const data = req.body;
    try {
        if (data.action === "savePayment") {
            let slipData = "-";
            if (data.fileData && data.fileData !== "-") { slipData = data.fileData; }

            const studentNum = parseInt(data.studentNo);
            const result = await pool.query(
                'INSERT INTO payments ("studentNo", type, "slipLink", amount) VALUES ($1, $2, $3, $4) RETURNING id',
                [studentNum, data.type, slipData, data.amount]
            );
            const newPaymentId = result.rows[0].id;
            const desc = `รับเงินจากเลขที่ ${studentNum} (${data.type})`;

            await pool.query(
                "INSERT INTO ledger (description, type, amount) VALUES ($1, 'เงินห้อง', $2)",
                [desc, data.amount]
            );
            res.json({ status: "success", message: "✅ บันทึกยอดเงินเข้ากองกลางเรียบร้อย!", paymentId: newPaymentId });
        }
        else if (data.action === "undoPayment") {
            const payRes = await pool.query("SELECT * FROM payments WHERE id = $1", [data.paymentId]);
            if (payRes.rows.length > 0) {
                const row = payRes.rows[0];
                await pool.query("DELETE FROM payments WHERE id = $1", [data.paymentId]);
                const desc = `รับเงินจากเลขที่ ${row.studentNo} (${row.type})`;
                await pool.query(
                    `DELETE FROM ledger WHERE id = (SELECT id FROM ledger WHERE description = $1 AND amount = $2 AND type = 'เงินห้อง' ORDER BY id DESC LIMIT 1)`,
                    [desc, row.amount]
                );
                res.json({ status: "success", message: "ยกเลิกรายการล่าสุดสำเร็จ!" });
            } else { res.json({ status: "error", message: "ไม่พบรายการนี้" }); }
        }
        else if (data.action === "addSpecialTarget") {
            const perPerson = Math.ceil(data.totalAmount / 31); 
            await pool.query(
                'INSERT INTO special_targets (title, "totalAmount", "perPerson") VALUES ($1, $2, $3)',
                [data.title, data.totalAmount, perPerson]
            );
            res.json({ status: "success" });
        }
        else if (data.action === "deleteSpecialTarget") {
            await pool.query("DELETE FROM special_targets WHERE id = $1", [data.id]);
            res.json({ status: "success" });
        }
        else if (data.action === "saveDirectLedger") {
            await pool.query(
                "INSERT INTO ledger (description, type, amount) VALUES ($1, $2, $3)",
                [data.description, data.type, data.amount]
            );
            res.json({ status: "success" });
        }
        else if (data.action === "deleteLedgerEntry") {
            await pool.query("DELETE FROM ledger WHERE id = $1", [data.id]);
            res.json({ status: "success" });
        }
    } catch (err) {
        console.error(err);
        res.json({ status: "error", message: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 เซิร์ฟเวอร์เริ่มทำงานที่พอร์ต ${PORT}`));
