#!/bin/bash

# Configuration
DB_HOST="38.147.122.84"
DB_NAME="katasaham"
DB_PORT="5499"
DB_USER="postgres" # Superuser to create db and user
APP_USER="katasaham_user"
RANDOM_PASS="e6zX40foQtdjzQOM" #$(openssl rand -base64 12)

echo "🚀 Starting database setup for KataSaham..."

# Helper function to run psql with port
run_psql() {
    psql -h $DB_HOST -p $DB_PORT "$@"
}

# 1. Create Database
echo "📂 Creating database: $DB_NAME on port $DB_PORT..."
if run_psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null; then
    echo "✅ Database $DB_NAME created successfully."
else
    echo "⚠️ Database $DB_NAME already exists or failed to create."
fi

# 2. Create App User with Random Password
echo "👤 Creating user: $APP_USER..."
if run_psql -U $DB_USER -c "CREATE USER $APP_USER WITH PASSWORD '$RANDOM_PASS';" 2>/dev/null; then
    echo "✅ User $APP_USER created successfully."
    echo "🔑 Password generated: $RANDOM_PASS"
    echo "📌 SIMPAN PASSWORD INI!"
else
    # If user exists, update password anyway to be sure
    run_psql -U $DB_USER -c "ALTER USER $APP_USER WITH PASSWORD '$RANDOM_PASS';"
    echo "✅ User $APP_USER password updated."
    echo "🔑 New password: $RANDOM_PASS"
fi

# 3. Grant Privileges
echo "🔐 Granting privileges..."
run_psql -U $DB_USER -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $APP_USER;"
# In Postgres 15+, we also need to grant on schema public
run_psql -U $DB_USER -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $APP_USER;"

# 4. Import Schema
echo "📝 Importing schema from db/schema.sql..."
# Since schema.sql might be in the same folder or parent, we check
SCHEMA_FILE="db/schema.sql"
if [ ! -f "$SCHEMA_FILE" ]; then
    SCHEMA_FILE="schema.sql"
fi

if run_psql -U $DB_USER -d $DB_NAME -f "$SCHEMA_FILE"; then
    echo "✅ Schema imported successfully."
else
    echo "❌ Failed to import schema."
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo "--------------------------------------"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "Username: $APP_USER"
echo "Password: $RANDOM_PASS"
echo "--------------------------------------"
echo "🚀 Siap digunakan!"
