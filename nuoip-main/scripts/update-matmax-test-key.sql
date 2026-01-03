-- Update MatMax tenant's test public key to the correct one
UPDATE tenants
SET settings = jsonb_set(
  settings::jsonb,
  '{lyraConfig,testMode,credentials,publicKey}',
  '"88569105:testpublickey_oHKEsiKA3i9E1JshcnIA7RktrR163DdRZYzYOWgXqwSXx"'
)
WHERE name = 'MatMax Wellness';

-- Verify the update
SELECT 
  name,
  settings->'lyraConfig'->'testMode'->'credentials'->>'publicKey' as test_public_key,
  settings->'lyraConfig'->>'activeMode' as active_mode
FROM tenants 
WHERE name = 'MatMax Wellness';
