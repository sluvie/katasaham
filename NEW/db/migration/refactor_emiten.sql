-- Run this as database superuser (postgres)
-- to refactor from 'emitens' table to 'emiten_master'

\c katasaham

BEGIN;

-- 1. Drop old foreign keys
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_emiten_ticker_fkey;
ALTER TABLE dividends DROP CONSTRAINT IF EXISTS dividends_emiten_ticker_fkey;

-- 2. Drop the old table
DROP TABLE IF EXISTS emitens;

-- 3. Update column sizes to match emiten_master.kode (VARCHAR(20))
ALTER TABLE transactions ALTER COLUMN emiten_ticker TYPE VARCHAR(20);
ALTER TABLE dividends ALTER COLUMN emiten_ticker TYPE VARCHAR(20);

-- 4. Add new foreign keys pointing to emiten_master
ALTER TABLE transactions ADD CONSTRAINT transactions_emiten_ticker_fkey FOREIGN KEY (emiten_ticker) REFERENCES emiten_master(kode);
ALTER TABLE dividends ADD CONSTRAINT dividends_emiten_ticker_fkey FOREIGN KEY (emiten_ticker) REFERENCES emiten_master(kode);

COMMIT;

\echo '✅ Refactor emiten table completed successfully.'
