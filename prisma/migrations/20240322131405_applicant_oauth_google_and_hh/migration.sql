/*
  Warnings:

  - A unique constraint covering the columns `[hhTokenSub]` on the table `Applicant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[googleTokenSub]` on the table `Applicant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Applicant" ADD COLUMN     "googleTokenSub" TEXT,
ADD COLUMN     "hhTokenSub" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_hhTokenSub_key" ON "Applicant"("hhTokenSub");

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_googleTokenSub_key" ON "Applicant"("googleTokenSub");
