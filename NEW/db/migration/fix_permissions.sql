-- Run this script as the database superuser (e.g., postgres)
-- to grant necessary permissions to katasaham_user

\c katasaham

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO katasaham_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO katasaham_user;
GRANT ALL ON SCHEMA public TO katasaham_user;

-- Change ownership to allow TRUNCATE RESTART IDENTITY
ALTER TABLE industries OWNER TO katasaham_user;
ALTER TABLE fee_settings OWNER TO katasaham_user;
ALTER TABLE users OWNER TO katasaham_user;
ALTER TABLE accounts OWNER TO katasaham_user;
ALTER TABLE transactions OWNER TO katasaham_user;
ALTER TABLE dividends OWNER TO katasaham_user;
ALTER TABLE settings OWNER TO katasaham_user;
ALTER TABLE emiten_master OWNER TO katasaham_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO katasaham_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO katasaham_user;

\echo '✅ Permissions updated successfully.'
