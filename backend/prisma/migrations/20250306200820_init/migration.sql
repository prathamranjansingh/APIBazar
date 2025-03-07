/*
  Warnings:

  - The values [API_CREATED] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('API_PURCHASED', 'PURCHASE_CONFIRMED', 'API_UPDATED', 'NEW_REVIEW', 'RATE_LIMIT_REACHED', 'PAYMENT_RECEIVED', 'SYSTEM');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;
