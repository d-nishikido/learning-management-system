-- PostgreSQL initialization script for LMS database
-- This script will be executed when the PostgreSQL container starts for the first time

-- Create extensions that might be needed for the LMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create additional user roles if needed (optional)
-- CREATE ROLE lms_readonly WITH LOGIN PASSWORD 'readonly_password';
-- GRANT CONNECT ON DATABASE lms_db TO lms_readonly;

-- Initial database setup complete
-- Note: Actual table creation will be handled by Prisma migrations