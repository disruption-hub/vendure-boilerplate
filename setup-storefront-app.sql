-- Setup Vendure Storefront Application for OIDC

-- First, ensure we have a tenant (create if doesn't exist)
INSERT INTO tenants (id, name, slug, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'Default Tenant',
    'default',
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- Create the Vendure Storefront application
INSERT INTO applications (
    id,
    name,
    "clientId",
    "tenantId",
    "redirectUris",
    "postLogoutRedirectUris",
    "corsOrigins",
    "authMethods",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    'Vendure Storefront',
    'storefront-' || extract(epoch from now())::bigint,
    (SELECT id FROM tenants LIMIT 1),
    ARRAY['http://localhost:3001/auth/callback', 'http://localhost:3000/auth/callback'],
    ARRAY['http://localhost:3001', 'http://localhost:3000'],
    ARRAY['http://localhost:3001', 'http://localhost:3000'],
    '{"password": true, "otp": true, "wallet": true}'::jsonb,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM applications WHERE name = 'Vendure Storefront'
);

-- Display the client ID
SELECT 
    name as "Application Name",
    "clientId" as "Client ID",
    "redirectUris" as "Redirect URIs"
FROM applications
WHERE name = 'Vendure Storefront';
