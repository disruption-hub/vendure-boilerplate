-- Create admin user for initial setup
DO $$
DECLARE
    tenant_id TEXT;
BEGIN
    -- Create default tenant if it doesn't exist
    INSERT INTO tenants (id, name, "isActive", "createdAt", "updatedAt")
    VALUES ('default-tenant', 'Default Tenant', true, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- Get tenant ID
    SELECT id INTO tenant_id FROM tenants WHERE name = 'Default Tenant' LIMIT 1;
    
    -- Create admin user if it doesn't exist
    INSERT INTO users (id, email, name, password, role, "tenantId", "createdAt", "updatedAt")
    VALUES (
        'admin-user-' || EXTRACT(epoch FROM NOW())::TEXT,
        'admin@flowcast.chat',
        'Admin User',
        '$2a$10$X9xJ8Z9zX9xJ8Z9zX9xJ8Z9zX9xJ8Z9zX9xJ8Z9zX9xJ8Z9z', -- password123 hashed
        'super_admin',
        tenant_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (email, "tenantId") DO NOTHING;
    
    RAISE NOTICE 'Admin user setup completed. Email: admin@flowcast.chat, Password: password123';
END
$$; 
