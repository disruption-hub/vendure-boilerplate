-- Add paymentReturnHomeUrl column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "paymentReturnHomeUrl" TEXT;
