-- Sync logoUrl from settings.branding.logoUrl to top-level logoUrl field
-- This fixes the issue where logoUrl contains a corrupted path instead of the data URL

UPDATE tenants
SET "logoUrl" = (settings->>'branding')::jsonb->>'logoUrl'
WHERE settings->'branding'->>'logoUrl' IS NOT NULL
  AND (settings->'branding'->>'logoUrl') LIKE 'data:%'
  AND ("logoUrl" IS NULL OR "logoUrl" != (settings->>'branding')::jsonb->>'logoUrl');

-- Show affected tenants
SELECT id, name, "logoUrl", (settings->>'branding')::jsonb->>'logoUrl' as settings_logo
FROM tenants
WHERE settings->'branding'->>'logoUrl' IS NOT NULL
  AND (settings->'branding'->>'logoUrl') LIKE 'data:%';
