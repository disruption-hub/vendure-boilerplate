-- CreateEnum
CREATE TYPE "StockLocationType" AS ENUM ('PHYSICAL', 'DIGITAL');

-- AlterTable
ALTER TABLE "stock_entries" ADD COLUMN     "isUnlimited" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "stock_locations" ADD COLUMN     "type" "StockLocationType" NOT NULL DEFAULT 'PHYSICAL';

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_chatbotPhoneUserId_fkey" FOREIGN KEY ("chatbotPhoneUserId") REFERENCES "chatbot_phone_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_template_translations" ADD CONSTRAINT "communication_template_translations_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "communication_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_template_components" ADD CONSTRAINT "communication_template_components_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "communication_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_product_images" ADD CONSTRAINT "payment_product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "payment_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_price_rules" ADD CONSTRAINT "delivery_price_rules_deliveryMethodId_fkey" FOREIGN KEY ("deliveryMethodId") REFERENCES "delivery_methods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "communication_channel_settings_unique_channel" RENAME TO "communication_channel_settings_configId_channel_key";

-- RenameIndex
ALTER INDEX "communication_template_components_template_sort_idx" RENAME TO "communication_template_components_templateId_sortOrder_idx";

-- RenameIndex
ALTER INDEX "communication_template_translations_language_unique" RENAME TO "communication_template_translations_templateId_language_key";

-- RenameIndex
ALTER INDEX "communication_templates_key_config_unique" RENAME TO "communication_templates_templateKey_configId_key";

-- RenameIndex
ALTER INDEX "communication_workflow_steps_workflow_order_idx" RENAME TO "communication_workflow_steps_workflowId_order_idx";

-- RenameIndex
ALTER INDEX "communication_workflows_key_config_unique" RENAME TO "communication_workflows_workflowKey_configId_key";

-- RenameIndex
ALTER INDEX "tenant_user_chat_messages_thread_idx" RENAME TO "tenant_user_chat_messages_tenantId_threadKey_createdAt_idx";

