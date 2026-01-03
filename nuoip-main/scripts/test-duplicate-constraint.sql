-- Try to insert duplicate contacts to verify constraint
INSERT INTO chatbot_contacts (id, "tenantId", type, "displayName", phone, "isDefaultFlowbot", "createdAt", "updatedAt")
VALUES ('test-id-1', 'test-tenant', 'CONTACT', 'Test 1', '+1234567890', false, NOW(), NOW());

INSERT INTO chatbot_contacts (id, "tenantId", type, "displayName", phone, "isDefaultFlowbot", "createdAt", "updatedAt")
VALUES ('test-id-2', 'test-tenant', 'CONTACT', 'Test 2', '+1234567890', false, NOW(), NOW());
