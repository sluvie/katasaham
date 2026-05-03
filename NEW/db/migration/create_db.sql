-- Script to create the database for KataSaham
-- Run this script as a superuser (e.g., postgres)

-- Check if database exists and drop it if you want a fresh start (CAUTION!)
-- DROP DATABASE IF EXISTS katasaham;

CREATE DATABASE katasaham;

-- Create a specific user for this database
-- Replace 'YOUR_RANDOM_PASSWORD' with a secure password
CREATE USER katasaham_user WITH PASSWORD 'YOUR_RANDOM_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE katasaham TO katasaham_user;

-- For PostgreSQL 15+, you also need to grant on the public schema
-- \c katasaham
-- GRANT ALL ON SCHEMA public TO katasaham_user;
