/*
  Warnings:

  - You are about to alter the column `companyName` on the `PartnershipInquiry` table. The data in that column could be lost. The data in that column will be cast from `VarChar(256)` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "PartnershipInquiry" ALTER COLUMN "companyName" SET DATA TYPE VARCHAR(255);
