/*
  Warnings:

  - You are about to drop the column `level` on the `Applicant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Applicant" DROP COLUMN "level";

-- AlterTable
ALTER TABLE "Employer" ADD COLUMN     "agreementDate" TIMESTAMP(3),
ADD COLUMN     "agreementNumber" TEXT;
