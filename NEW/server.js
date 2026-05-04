const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db/db');
// Environment variables are loaded in db/db.js

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Root route to check API status
app.get('/', (req, res) => {
    res.json({ message: 'KataSaham API is running', version: '1.0.0' });
});

// Favicon handler to avoid 404s in browser
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT Verify Error:', err);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

const handleQueryError = (res, err) => {
    console.error('Database Error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
};

// --- AUTH ROUTES ---

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, name } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await db.query(
            'INSERT INTO users (username, password, name, status, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, role',
            [username, hashedPassword, name, 'PENDING', 'USER']
        );
        
        res.status(201).json({ message: 'Registration successful. Waiting for admin approval.', user: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        handleQueryError(res, err);
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) return res.status(400).json({ error: 'User not found' });
        if (user.status !== 'APPROVED') return res.status(403).json({ error: 'Account not approved yet' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
    } catch (err) {
        handleQueryError(res, err);
    }
});

// Get Current User
app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT id, username, role, name, status FROM users WHERE id = $1', [req.user.id]);
        res.json(result.rows[0]);
    } catch (err) {
        handleQueryError(res, err);
    }
});

// --- ADMIN ROUTES ---

// List Pending Users
app.get('/api/admin/pending-users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try {
        const result = await db.query("SELECT id, username, name, role, created_at FROM users WHERE status = 'PENDING'");
        res.json(result.rows);
    } catch (err) {
        handleQueryError(res, err);
    }
});

// Approve/Reject User (Deprecated in favor of generic PUT /api/admin/users/:id)
app.post('/api/admin/user-status', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    const { userId, status } = req.body;
    try {
        await db.query('UPDATE users SET status = $1 WHERE id = $2', [status, userId]);
        res.json({ message: `User ${status}` });
    } catch (err) {
        handleQueryError(res, err);
    }
});

// List All Users
app.get('/api/admin/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try {
        const result = await db.query('SELECT id, username, name, role, status, created_at FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        handleQueryError(res, err);
    }
});

// Update User (Role/Status)
app.put('/api/admin/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    const { role, status } = req.body;
    try {
        await db.query(
            'UPDATE users SET role = COALESCE($1, role), status = COALESCE($2, status) WHERE id = $3',
            [role, status, req.params.id]
        );
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        handleQueryError(res, err);
    }
});

// Delete User
app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try {
        // Prevent admin from deleting themselves
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }
        await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        handleQueryError(res, err);
    }
});

// --- ACCOUNT ROUTES ---
app.get('/api/accounts', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at ASC', [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        handleQueryError(res, err);
    }
});

app.post('/api/accounts', authenticateToken, async (req, res) => {
    const { id, name, broker, color } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO accounts (id, user_id, name, broker, color) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [id, req.user.id, name, broker, color]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        handleQueryError(res, err);
    }
});

app.delete('/api/accounts/:id', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM accounts WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ message: 'Account deleted' });
    } catch (err) {
        handleQueryError(res, err);
    }
});

// --- TRANSACTION ROUTES ---
app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT t.* FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            WHERE a.user_id = $1
            ORDER BY t.tx_date DESC, t.id DESC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        handleQueryError(res, err);
    }
});

app.post('/api/transactions', authenticateToken, async (req, res) => {
    const { account_id, tx_date, emiten_ticker, type, quantity, price, fee_applied } = req.body;
    try {
        // Verify account ownership
        const accCheck = await db.query('SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [account_id, req.user.id]);
        if (accCheck.rows.length === 0) return res.status(403).json({ error: 'Unauthorized account' });

        const result = await db.query(
            'INSERT INTO transactions (account_id, tx_date, emiten_ticker, type, quantity, price, fee_applied) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [account_id, tx_date, emiten_ticker, type, quantity, price, fee_applied]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        handleQueryError(res, err);
    }
});

app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
        const check = await db.query(`
            SELECT t.id FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            WHERE t.id = $1 AND a.user_id = $2
        `, [req.params.id, req.user.id]);
        
        if (check.rows.length === 0) return res.status(403).json({ error: 'Unauthorized' });

        await db.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
        res.json({ message: 'Transaction deleted' });
    } catch (err) {
        handleQueryError(res, err);
    }
});

app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
    const { account_id, tx_date, emiten_ticker, type, quantity, price, fee_applied } = req.body;
    try {
        // Verify transaction exists and belongs to user
        const check = await db.query(`
            SELECT t.id FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            WHERE t.id = $1 AND a.user_id = $2
        `, [req.params.id, req.user.id]);
        
        if (check.rows.length === 0) return res.status(403).json({ error: 'Unauthorized' });

        // Verify target account ownership
        const accCheck = await db.query('SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [account_id, req.user.id]);
        if (accCheck.rows.length === 0) return res.status(403).json({ error: 'Unauthorized account' });

        const result = await db.query(`
            UPDATE transactions 
            SET account_id = $1, tx_date = $2, emiten_ticker = $3, type = $4, quantity = $5, price = $6, fee_applied = $7
            WHERE id = $8 RETURNING *
        `, [account_id, tx_date, emiten_ticker, type, quantity, price, fee_applied, req.params.id]);
        
        res.json(result.rows[0]);
    } catch (err) {
        handleQueryError(res, err);
    }
});

// --- DIVIDEND ROUTES ---
app.get('/api/dividends', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT d.* FROM dividends d
            JOIN accounts a ON d.account_id = a.id
            WHERE a.user_id = $1
            ORDER BY d.cum_date DESC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        handleQueryError(res, err);
    }
});

app.post('/api/dividends', authenticateToken, async (req, res) => {
    const { account_id, emiten_ticker, cum_date, value_per_share, total_received, status } = req.body;
    try {
        const accCheck = await db.query('SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [account_id, req.user.id]);
        if (accCheck.rows.length === 0) return res.status(403).json({ error: 'Unauthorized account' });

        const result = await db.query(
            'INSERT INTO dividends (account_id, emiten_ticker, cum_date, value_per_share, total_received, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [account_id, emiten_ticker, cum_date, value_per_share, total_received, status || 'RECEIVED']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        handleQueryError(res, err);
    }
});

app.put('/api/dividends/:id', authenticateToken, async (req, res) => {
    const { account_id, emiten_ticker, cum_date, value_per_share, total_received, status } = req.body;
    try {
        // Verify dividend exists and belongs to user
        const check = await db.query(`
            SELECT d.id FROM dividends d
            JOIN accounts a ON d.account_id = a.id
            WHERE d.id = $1 AND a.user_id = $2
        `, [req.params.id, req.user.id]);
        
        if (check.rows.length === 0) return res.status(403).json({ error: 'Unauthorized' });

        // Verify target account ownership
        const accCheck = await db.query('SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [account_id, req.user.id]);
        if (accCheck.rows.length === 0) return res.status(403).json({ error: 'Unauthorized account' });

        const result = await db.query(`
            UPDATE dividends 
            SET account_id = $1, emiten_ticker = $2, cum_date = $3, value_per_share = $4, total_received = $5, status = $6
            WHERE id = $7 RETURNING *
        `, [account_id, emiten_ticker, cum_date, value_per_share, total_received, status, req.params.id]);
        
        res.json(result.rows[0]);
    } catch (err) {
        handleQueryError(res, err);
    }
});

app.delete('/api/dividends/:id', authenticateToken, async (req, res) => {
    try {
        const check = await db.query(`
            SELECT d.id FROM dividends d
            JOIN accounts a ON d.account_id = a.id
            WHERE d.id = $1 AND a.user_id = $2
        `, [req.params.id, req.user.id]);
        
        if (check.rows.length === 0) return res.status(403).json({ error: 'Unauthorized' });

        await db.query('DELETE FROM dividends WHERE id = $1', [req.params.id]);
        res.json({ message: 'Dividend deleted' });
    } catch (err) {
        handleQueryError(res, err);
    }
});

// --- FEE SETTINGS ---
app.get('/api/accounts/:id/fees', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM fee_settings WHERE account_id = $1 ORDER BY effective_from DESC',
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        handleQueryError(res, err);
    }
});

app.post('/api/accounts/:id/fees', authenticateToken, async (req, res) => {
    const { buy_fee, sell_fee, effective_from } = req.body;
    const account_id = req.params.id;

    try {
        // Verify ownership
        const accCheck = await db.query('SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [account_id, req.user.id]);
        if (accCheck.rows.length === 0) return res.status(403).json({ error: 'Unauthorized account' });

        // Logic: find current active fee (effective_to IS NULL)
        // Update its effective_to to (effective_from - 1 day)
        // If effective_from is today, and existing is also starting today, we might want to just update or delete it.
        // For simplicity, we'll set effective_to to the day before effective_from.

        const newStart = new Date(effective_from);
        const dayBefore = new Date(newStart);
        dayBefore.setDate(dayBefore.getDate() - 1);
        const dayBeforeStr = dayBefore.toISOString().split('T')[0];

        // Start transaction
        await db.query('BEGIN');

        // Close current active fee
        await db.query(
            'UPDATE fee_settings SET effective_to = $1 WHERE account_id = $2 AND effective_to IS NULL',
            [dayBeforeStr, account_id]
        );

        // Insert new fee
        const result = await db.query(
            'INSERT INTO fee_settings (account_id, buy_fee, sell_fee, effective_from, effective_to) VALUES ($1, $2, $3, $4, NULL) RETURNING *',
            [account_id, buy_fee, sell_fee, effective_from]
        );

        await db.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await db.query('ROLLBACK');
        handleQueryError(res, err);
    }
});

app.get('/api/fee-settings', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM fee_settings WHERE account_id IS NULL ORDER BY effective_from DESC');
        res.json(result.rows);
    } catch (err) {
        handleQueryError(res, err);
    }
});

// --- MASTER DATA ---
app.get('/api/emitens', async (req, res) => {
    try {
        const result = await db.query('SELECT kode as ticker, nama_perusahaan as name, papan_pencatatan as board, last_price FROM emiten_master ORDER BY kode ASC');
        res.json(result.rows);
    } catch (err) {
        handleQueryError(res, err);
    }
});

// --- PRICE SYNC LOGIC ---
const PRICE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQd39zS7n02SIZHqMzK05IaRm9sOuOUFp0aISWPA9hnwxwsuwTFljuIlYAfDeoU9tDh1aJ1AtqOMo-P/pub?gid=0&single=true&output=csv';

const syncEmitenPrices = async () => {
    console.log(`[${new Date().toISOString()}] Starting price sync from Google Sheets...`);
    try {
        const response = await fetch(PRICE_CSV_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const csvText = await response.text();
        
        // Simple CSV Parser (skipping header)
        const lines = csvText.split('\n');
        let updateCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(',');
            if (parts.length < 3) continue;

            const ticker = parts[0].trim().toUpperCase();
            const price = parseFloat(parts[2].trim());

            if (ticker && !isNaN(price)) {
                await db.query(
                    'UPDATE emiten_master SET last_price = $1, last_price_updated = CURRENT_TIMESTAMP WHERE kode = $2',
                    [price, ticker]
                );
                updateCount++;
            }
        }
        console.log(`[${new Date().toISOString()}] Price sync completed. Updated ${updateCount} emitens.`);
        return { success: true, updated: updateCount };
    } catch (err) {
        console.error('Price Sync Error:', err);
        return { success: false, error: err.message };
    }
};

// Admin endpoint to trigger manual sync
app.post('/api/admin/sync-prices', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    const result = await syncEmitenPrices();
    if (result.success) {
        res.json({ message: `Sync successful. Updated ${result.updated} records.` });
    } else {
        res.status(500).json({ error: result.error });
    }
});

// Scheduler logic (Every 2 hours between 09:00 - 16:00 WIB)
// WIB is UTC+7. 09:00 WIB = 02:00 UTC. 16:00 WIB = 09:00 UTC.
const startPriceSyncScheduler = () => {
    // Check every hour
    setInterval(async () => {
        const now = new Date();
        const hourWIB = (now.getUTCHours() + 7) % 24;
        
        // Only sync between 09:00 and 16:00 WIB
        // And we want "every 2 hours", so we can check if hourWIB is even or something similar.
        // For simplicity, we'll sync at 9, 11, 13, 15 WIB.
        const syncHours = [9, 11, 13, 15];
        
        // We also need to make sure we don't sync multiple times in the same hour.
        // A simple way is to check the minutes. If it's between 0 and 5 minutes of the hour.
        if (syncHours.includes(hourWIB) && now.getUTCMinutes() < 5) {
            await syncEmitenPrices();
        }
    }, 60 * 1000); // Check every minute
    
    console.log('Price sync scheduler started (09:00-16:00 WIB, every 2h)');
};

// Run scheduler
startPriceSyncScheduler();
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
});

app.listen(PORT, () => {
    console.log(`API Server running on http://localhost:${PORT}`);
});
