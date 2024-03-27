/*
  Warnings:

  - You are about to drop the column `hhTokenSub` on the `Applicant` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Applicant_hhTokenSub_key";

-- AlterTable
ALTER TABLE "Applicant" DROP COLUMN "hhTokenSub";
