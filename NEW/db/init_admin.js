const bcrypt = require('bcryptjs');
const db = require('./db');
// db/db.js already handles dotenv configuration robustly

async function initAdmin() {
    const username = 'admin';
    const password = 'admin123';
    const name = 'System Admin';
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (username, password, name, role, status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO UPDATE SET password = $2',
            [username, hashedPassword, name, 'ADMIN', 'APPROVED']
        );
        console.log('Admin user initialized successfully!');
        console.log('Username: admin');
        console.log('Password: admin123');
        process.exit(0);
    } catch (err) {
        console.error('Error initializing admin:', err);
        process.exit(1);
    }
}

initAdmin();
