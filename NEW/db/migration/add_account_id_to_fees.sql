-- Add account_id to fee_settings
ALTER TABLE fee_settings ADD COLUMN account_id VARCHAR(50) REFERENCES accounts(id) ON DELETE CASCADE;

-- If there are global fees, we might want to keep them or assign them to a default account.
-- For now, we'll just allow account_id to be NULL for global defaults, 
-- but the user specifically asked for them to be in "Profil Akun sekuritas".

-- Create an index for performance
CREATE INDEX idx_fee_settings_account_id ON fee_settings(account_id);
