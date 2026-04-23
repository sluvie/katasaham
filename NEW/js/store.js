// js/store.js
// Handles persistence in localStorage

const STORAGE_KEYS = {
    TRANSACTIONS: 'ks_transactions',
    FEE_SETTINGS: 'ks_fee_settings',
    EMITENS: 'ks_emitens',
    INDUSTRIES: 'ks_industries',
    DIVIDENDS: 'ks_dividends',
    SETTINGS: 'ks_settings'
};

export const Store = {
    getTransactions: () => {
        const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        if (!data) {
            const samples = [
                { id: '1', date: '2025-01-15', emiten: 'BBCA', type: 'BUY', quantity: 1000, price: 9000 },
                { id: '2', date: '2025-03-20', emiten: 'BBCA', type: 'SELL', quantity: 500, price: 10000 },
                { id: '3', date: '2026-02-10', emiten: 'TLKM', type: 'BUY', quantity: 2000, price: 3500 }
            ];
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(samples));
            return samples;
        }
        return JSON.parse(data);
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
        // Update old active setting
        if (!setting.effectiveTo) {
            settings.forEach(s => {
                if (!s.effectiveTo) s.effectiveTo = setting.effectiveFrom;
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
        return data ? JSON.parse(data) : [];
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
    }
};
