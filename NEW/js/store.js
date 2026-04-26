// js/store.js
// Handles persistence in localStorage

const STORAGE_KEYS = {
    TRANSACTIONS: 'ks_transactions',
    FEE_SETTINGS: 'ks_fee_settings',
    EMITENS: 'ks_emitens',
    INDUSTRIES: 'ks_industries',
    DIVIDENDS: 'ks_dividends',
    SETTINGS: 'ks_settings',
    ACCOUNTS: 'ks_accounts',
    USERS: 'ks_users',
    CURRENT_USER: 'ks_current_user'
};

export const Store = {
    getAccounts: () => {
        const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
        if (!data) {
            const defaults = [
                { id: 'acc_1', name: 'Default Account', broker: 'General', color: '#4facfe' }
            ];
            localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(defaults));
            return defaults;
        }
        return JSON.parse(data);
    },

    saveAccount: (account) => {
        const accounts = Store.getAccounts();
        const id = account.id || 'acc_' + Date.now();
        const existingIndex = accounts.findIndex(a => a.id === id);
        if (existingIndex !== -1) {
            accounts[existingIndex] = { ...account, id };
        } else {
            accounts.push({ ...account, id });
        }
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
        return id;
    },

    getTransactions: () => {
        const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        if (!data) {
            const samples = [
                { id: '1', date: '2025-01-15', emiten: 'BBCA', type: 'BUY', quantity: 1000, price: 9000, accountId: 'acc_1' },
                { id: '2', date: '2025-03-20', emiten: 'BBCA', type: 'SELL', quantity: 500, price: 10000, accountId: 'acc_1' },
                { id: '3', date: '2026-02-10', emiten: 'TLKM', type: 'BUY', quantity: 2000, price: 3500, accountId: 'acc_1' }
            ];
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(samples));
            return samples;
        }
        const parsed = JSON.parse(data);
        // Migration: add accountId if missing
        let changed = false;
        parsed.forEach(tx => {
            if (!tx.accountId) {
                tx.accountId = 'acc_1';
                changed = true;
            }
        });
        if (changed) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(parsed));
        return parsed;
    },

    saveTransaction: (transaction) => {
        const transactions = Store.getTransactions();
        transactions.push({
            ...transaction,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
        });
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    },

    getFeeSettings: () => {
        const data = localStorage.getItem(STORAGE_KEYS.FEE_SETTINGS);
        return data ? JSON.parse(data) : [
            { id: 'default', buyFee: 0.15, sellFee: 0.25, effectiveFrom: '2000-01-01', effectiveTo: null }
        ];
    },

    saveFeeSetting: (setting) => {
        const settings = Store.getFeeSettings();
        // Update old active setting FOR THIS ACCOUNT
        if (!setting.effectiveTo) {
            settings.forEach(s => {
                // If it's the same account and still active, close it
                if ((s.accountId === setting.accountId || (!s.accountId && setting.accountId)) && !s.effectiveTo) {
                    s.effectiveTo = setting.effectiveFrom;
                }
            });
        }
        settings.push({ ...setting, id: Date.now().toString() });
        localStorage.setItem(STORAGE_KEYS.FEE_SETTINGS, JSON.stringify(settings));
    },

    getEmitens: () => {
        const data = localStorage.getItem(STORAGE_KEYS.EMITENS);
        return data ? JSON.parse(data) : [
            { ticker: 'BBCA', name: 'Bank Central Asia', industry: 'Banking' },
            { ticker: 'ASII', name: 'Astra International', industry: 'Industrial' },
            { ticker: 'TLKM', name: 'Telkom Indonesia', industry: 'Technology' }
        ];
    },

    saveEmiten: (emiten) => {
        const emitens = Store.getEmitens();
        emitens.push(emiten);
        localStorage.setItem(STORAGE_KEYS.EMITENS, JSON.stringify(emitens));
    },

    getIndustries: () => {
        const data = localStorage.getItem(STORAGE_KEYS.INDUSTRIES);
        return data ? JSON.parse(data) : ['Banking', 'Industrial', 'Technology', 'Consumer', 'Energy'];
    },

    getDividends: () => {
        const data = localStorage.getItem(STORAGE_KEYS.DIVIDENDS);
        if (!data) return [];
        const parsed = JSON.parse(data);
        // Migration: add accountId if missing
        let changed = false;
        parsed.forEach(div => {
            if (!div.accountId) {
                div.accountId = 'acc_1';
                changed = true;
            }
        });
        if (changed) localStorage.setItem(STORAGE_KEYS.DIVIDENDS, JSON.stringify(parsed));
        return parsed;
    },

    saveDividend: (div) => {
        const dividends = Store.getDividends();
        dividends.push({ ...div, id: Date.now().toString() });
        localStorage.setItem(STORAGE_KEYS.DIVIDENDS, JSON.stringify(dividends));
    },

    updateDividend: (id, updated) => {
        const dividends = Store.getDividends();
        const index = dividends.findIndex(d => d.id === id);
        if (index !== -1) {
            dividends[index] = { ...dividends[index], ...updated };
            localStorage.setItem(STORAGE_KEYS.DIVIDENDS, JSON.stringify(dividends));
        }
    },

    getSettings: () => {
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return data ? JSON.parse(data) : { gsLink: '' };
    },

    saveSettings: (settings) => {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    },

    // --- USER MANAGEMENT ---
    hashPassword: async (password) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    getUsers: () => {
        const data = localStorage.getItem(STORAGE_KEYS.USERS);
        return data ? JSON.parse(data) : [];
    },

    saveUser: async (user) => {
        const users = Store.getUsers();
        // Check if user exists
        const existing = users.find(u => u.username === user.username);
        if (existing) throw new Error('Username sudah digunakan');

        const hashedPassword = await Store.hashPassword(user.password);
        const newUser = {
            ...user,
            id: 'user_' + Date.now(),
            password: hashedPassword,
            status: user.status || 'PENDING',
            role: user.role || 'USER',
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        return newUser;
    },

    updateUser: (userId, updates) => {
        const users = Store.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
    },

    getCurrentUser: () => {
        const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return data ? JSON.parse(data) : null;
    },

    login: async (username, password) => {
        const users = Store.getUsers();
        const hashedPassword = await Store.hashPassword(password);
        const user = users.find(u => u.username === username && u.password === hashedPassword);
        
        if (!user) throw new Error('Username atau password salah');
        if (user.status !== 'APPROVED') throw new Error('Akun Anda belum disetujui oleh admin');

        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        return user;
    },

    logout: () => {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    },

    initAdmin: async () => {
        const users = Store.getUsers();
        if (users.length === 0) {
            const hashedPassword = await Store.hashPassword('admin123');
            const admin = {
                id: 'user_admin',
                username: 'admin',
                password: hashedPassword,
                role: 'ADMIN',
                status: 'APPROVED',
                name: 'System Admin',
                createdAt: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([admin]));
            console.log('Admin user initialized: admin / admin123');
        }
    }
};
