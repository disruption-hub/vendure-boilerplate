/*
  Warnings:

  - You are about to drop the column `username` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_username_key";

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "authMethods" JSONB DEFAULT '{"password": true, "otp": false, "wallet": false}',
ADD COLUMN     "brevoApiKey" TEXT,
ADD COLUMN     "brevoSenderEmail" TEXT,
ADD COLUMN     "brevoSenderName" TEXT,
ADD COLUMN     "labsmobileApiKey" TEXT,
ADD COLUMN     "labsmobileSenderId" TEXT,
ADD COLUMN     "labsmobileUrl" TEXT,
ADD COLUMN     "labsmobileUser" TEXT,
ADD COLUMN     "postLogoutRedirectUris" TEXT[];

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "brevoApiKey" TEXT,
ADD COLUMN     "brevoSenderEmail" TEXT,
ADD COLUMN     "brevoSenderName" TEXT,
ADD COLUMN     "labsmobileApiKey" TEXT,
ADD COLUMN     "labsmobileSenderId" TEXT,
ADD COLUMN     "labsmobileUrl" TEXT,
ADD COLUMN     "labsmobileUser" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "username",
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT;
