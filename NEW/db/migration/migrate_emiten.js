const XLSX = require('xlsx');
const path = require('path');
const { pool } = require('../db');

async function migrate() {
    const filePath = path.join(__dirname, '../../doc/daftar_emiten.xlsx');
    console.log(`Reading file: ${filePath}`);

    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Skip header row
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`Found ${data.length} rows to migrate.`);
        console.log(`Connecting to database: ${process.env.DB_NAME} on ${process.env.DB_HOST}:${process.env.DB_PORT}`);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            console.log('Clearing existing emiten_master data...');
            await client.query('TRUNCATE TABLE emiten_master RESTART IDENTITY CASCADE');

            console.log('Inserting data...');
            const insertQuery = `
                INSERT INTO emiten_master (raw_no, kode, nama_perusahaan, tanggal_pencatatan, saham, papan_pencatatan)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;

            let successCount = 0;
            let errorCount = 0;

            for (const row of data) {
                try {
                    const rawNo = row['No'];
                    const kode = row['Kode'];
                    const nama = row['Nama Perusahaan'];
                    const tglStr = row['Tanggal Pencatatan'];
                    const sahamStr = row['Saham'] ? String(row['Saham']).replace(/\./g, '') : null;
                    const papan = row['Papan Pencatatan'];

                    // Parse Date: '09 Des 1997' -> '1997-12-09'
                    let tgl = null;
                    if (tglStr) {
                        const months = {
                            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 
                            'Mei': '05', 'Jun': '06', 'Jul': '07', 'Ags': '08', 
                            'Sep': '09', 'Okt': '10', 'Nov': '11', 'Des': '12'
                        };
                        const parts = tglStr.split(' ');
                        if (parts.length === 3) {
                            const day = parts[0].padStart(2, '0');
                            const month = months[parts[1]] || '01';
                            const year = parts[2];
                            tgl = `${year}-${month}-${day}`;
                        }
                    }

                    const saham = sahamStr ? BigInt(sahamStr) : null;

                    await client.query(insertQuery, [
                        rawNo,
                        kode,
                        nama,
                        tgl,
                        saham,
                        papan
                    ]);
                    successCount++;
                } catch (err) {
                    console.error(`Error processing row ${row['Kode']}:`, err.message);
                    errorCount++;
                }
            }

            await client.query('COMMIT');
            console.log(`Migration completed! Success: ${successCount}, Errors: ${errorCount}`);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
