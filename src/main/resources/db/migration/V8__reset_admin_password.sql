-- Reset admin password to use bcrypt cost-12 hash of 'Admin@123'
-- Generated hash: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBpj2XEmXbQtZe
UPDATE users 
SET password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBpj2XEmXbQtZe',
    role = 'ADMIN'
WHERE email = 'admin@pitchperfect.com';

-- Also ensure a default manager account exists for testing
INSERT INTO users (first_name, last_name, email, password_hash, role)
VALUES ('Manager', 'Demo', 'manager@pitchperfect.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBpj2XEmXbQtZe', 'MANAGER')
ON CONFLICT (email) DO UPDATE SET 
    password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBpj2XEmXbQtZe',
    role = 'MANAGER';
