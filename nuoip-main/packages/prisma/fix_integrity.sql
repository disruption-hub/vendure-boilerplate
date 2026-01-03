UPDATE "users" SET "approvedById" = NULL WHERE "approvedById" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "users" u2 WHERE u2.id = "users"."approvedById");
UPDATE "users" SET "invitedById" = NULL WHERE "invitedById" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "users" u2 WHERE u2.id = "users"."invitedById");
UPDATE "users" SET "chatbotPhoneUserId" = NULL WHERE "chatbotPhoneUserId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "chatbot_phone_users" c WHERE c.id = "users"."chatbotPhoneUserId");

DELETE FROM "communication_template_translations" WHERE "templateId" NOT IN (SELECT "id" FROM "communication_templates");
DELETE FROM "communication_template_components" WHERE "templateId" NOT IN (SELECT "id" FROM "communication_templates");

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_contacts' AND column_name='tenantId') THEN 
        DELETE FROM "whatsapp_contacts" WHERE "tenantId" NOT IN (SELECT "id" FROM "tenants");
    END IF; 
END $$;

DELETE FROM "payment_product_images" WHERE "productId" NOT IN (SELECT "id" FROM "payment_products");
DELETE FROM "delivery_price_rules" WHERE "deliveryMethodId" NOT IN (SELECT "id" FROM "delivery_methods");
