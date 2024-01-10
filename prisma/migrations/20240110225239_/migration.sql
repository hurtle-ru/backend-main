/*
  Warnings:

  - You are about to drop the column `resumeId` on the `Applicant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[applicantId]` on the table `Resume` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `applicantId` to the `Resume` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Applicant" DROP CONSTRAINT "Applicant_resumeId_fkey";

-- DropIndex
DROP INDEX "Applicant_resumeId_key";

-- AlterTable
ALTER TABLE "Applicant" DROP COLUMN "resumeId";

-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "applicantId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Resume_applicantId_key" ON "Resume"("applicantId");

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
