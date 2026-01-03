-- Add profilePictureUrl column to users table
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "profilePictureUrl" TEXT;
