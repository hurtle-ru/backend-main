/*
  Warnings:

  - The values [DEADLINE_EXPIRED] on the enum `MeetingPaymentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MeetingPaymentStatus_new" AS ENUM ('PENDING', 'FAIL', 'SUCCESS');
ALTER TABLE "MeetingPayment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "MeetingPayment" ALTER COLUMN "status" TYPE "MeetingPaymentStatus_new" USING ("status"::text::"MeetingPaymentStatus_new");
ALTER TYPE "MeetingPaymentStatus" RENAME TO "MeetingPaymentStatus_old";
ALTER TYPE "MeetingPaymentStatus_new" RENAME TO "MeetingPaymentStatus";
DROP TYPE "MeetingPaymentStatus_old";
ALTER TABLE "MeetingPayment" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
