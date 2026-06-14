-- Add banned column for admin user management
ALTER TABLE users ADD COLUMN banned BOOLEAN DEFAULT FALSE;
