-- Create admin user for testing
-- Run this in Railway database console or via prisma db execute

-- First, ensure we have a tenant
INSERT INTO tenants (id, name, "isActive", "createdAt", "updatedAt")
VALUES ('default-tenant', 'Default Tenant', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create an admin user
INSERT INTO users (id, email, name, password, role, "tenantId", "createdAt", "updatedAt", "language", theme)
VALUES (
  'admin-user-1', 
  'admin@flowcast.chat', 
  'Admin User', 
  '$2a$10$X9xJ8Z9zX9xJ8Z9zX9xJ8Z9zX9xJ8Z9zX9xJ8Z9zX9xJ8Z9z', -- 'password123' hashed
  'super_admin', 
  'default-tenant',
  NOW(), 
  NOW(),
  'en',
  'dark'
)
ON CONFLICT (email, "tenantId") DO NOTHING;

-- Optional: Create departments
INSERT INTO departments (id, "tenantId", name, description, "isDefault", "createdAt", "updatedAt")
VALUES 
  ('dept-general', 'default-tenant', 'General', 'General department', true, NOW(), NOW()),
  ('dept-sales', 'default-tenant', 'Sales', 'Sales department', false, NOW(), NOW()),
  ('dept-support', 'default-tenant', 'Support', 'Support department', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
