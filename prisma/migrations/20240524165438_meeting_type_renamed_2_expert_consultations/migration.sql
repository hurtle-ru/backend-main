/*
  Warnings:

  - The values [CONSULTATION_B2C_EXPERT_2,CONSULTATION_B2C_EXPERT_3] on the enum `MeetingType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MeetingType_new" AS ENUM ('INTERVIEW', 'CONSULTATION_B2C', 'CONSULTATION_B2B', 'CONSULTATION_B2C_EXPERT', 'CONSULTATION_B2C_EXPERT_FOR_STUDENTS', 'CONSULTATION_B2C_EXPERT_STANDARD');
ALTER TABLE "Meeting" ALTER COLUMN "type" TYPE "MeetingType_new" USING ("type"::text::"MeetingType_new");
ALTER TABLE "MeetingSlot" ALTER COLUMN "types" TYPE "MeetingType_new"[] USING ("types"::text::"MeetingType_new"[]);
ALTER TABLE "MeetingPayment" ALTER COLUMN "type" TYPE "MeetingType_new" USING ("type"::text::"MeetingType_new");
ALTER TYPE "MeetingType" RENAME TO "MeetingType_old";
ALTER TYPE "MeetingType_new" RENAME TO "MeetingType";
DROP TYPE "MeetingType_old";
COMMIT;
