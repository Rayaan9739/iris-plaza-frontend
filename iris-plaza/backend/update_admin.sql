-- Update admin credentials
-- Password: 10-10-2006 (bcrypt hash)
UPDATE "user" 
SET phone = '+919845151899', 
    password = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYXqK7u/WGa' 
WHERE role = 'ADMIN';

-- Verify the update
SELECT id, phone, email, role FROM "user" WHERE role = 'ADMIN';
