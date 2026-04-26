-- PostgreSQL Schema for KataSaham

-- 1. Table for Industries (Optional, but good for data integrity)
CREATE TABLE industries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- 2. Table for Emitens (Tickers)
CREATE TABLE emitens (
    ticker VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry_id INTEGER REFERENCES industries(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table for Fee Settings
CREATE TABLE fee_settings (
    id SERIAL PRIMARY KEY,
    buy_fee DECIMAL(5, 2) NOT NULL, -- percentage
    sell_fee DECIMAL(5, 2) NOT NULL, -- percentage
    effective_from DATE NOT NULL,
    effective_to DATE, -- NULL means active
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table for Transactions
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    tx_date DATE NOT NULL,
    emiten_ticker VARCHAR(10) REFERENCES emitens(ticker),
    type VARCHAR(10) CHECK (type IN ('BUY', 'SELL')),
    quantity INTEGER NOT NULL, -- in shares
    price DECIMAL(15, 2) NOT NULL,
    fee_applied DECIMAL(5, 2), -- the fee rate at the time of tx
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table for Dividends
CREATE TABLE dividends (
    id SERIAL PRIMARY KEY,
    emiten_ticker VARCHAR(10) REFERENCES emitens(ticker),
    cum_date DATE NOT NULL,
    value_per_share DECIMAL(15, 2) NOT NULL,
    total_received DECIMAL(15, 2),
    status VARCHAR(20) DEFAULT 'RECEIVED' CHECK (status IN ('PENDING', 'RECEIVED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table for App Settings
CREATE TABLE settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Data
INSERT INTO industries (name) VALUES ('Banking'), ('Industrial'), ('Technology'), ('Consumer'), ('Energy');

INSERT INTO emitens (ticker, name, industry_id) VALUES 
('BBCA', 'Bank Central Asia', 1),
('ASII', 'Astra International', 2),
('TLKM', 'Telkom Indonesia', 3);

INSERT INTO fee_settings (buy_fee, sell_fee, effective_from) VALUES (0.15, 0.25, '2000-01-01');

INSERT INTO settings (key, value) VALUES ('gs_link', '');

-- 7. Master table for Emiten list imported from daftar_emiten.xlsx
CREATE TABLE emiten_master (
    id SERIAL PRIMARY KEY,
    raw_no INTEGER,
    kode VARCHAR(20) UNIQUE NOT NULL,
    nama_perusahaan TEXT NOT NULL,
    tanggal_pencatatan DATE,
    saham BIGINT,
    papan_pencatatan VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index to speed lookups by kode
CREATE INDEX ON emiten_master (kode);

