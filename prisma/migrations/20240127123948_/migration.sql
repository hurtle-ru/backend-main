/*
  Warnings:

  - You are about to drop the column `candidateId` on the `Offer` table. All the data in the column will be lost.
  - You are about to drop the `Candidate` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[vacancyResponseId]` on the table `Offer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `vacancyResponseId` to the `Offer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VacancyResponseStatus" AS ENUM ('NEW_APPLICATION', 'SCREENING', 'INTERVIEWING', 'OFFER_MADE', 'HIRED');

-- DropForeignKey
ALTER TABLE "Candidate" DROP CONSTRAINT "Candidate_applicantId_fkey";

-- DropForeignKey
ALTER TABLE "Candidate" DROP CONSTRAINT "Candidate_suggestedByManagerId_fkey";

-- DropForeignKey
ALTER TABLE "Candidate" DROP CONSTRAINT "Candidate_vacancyId_fkey";

-- DropForeignKey
ALTER TABLE "Offer" DROP CONSTRAINT "Offer_candidateId_fkey";

-- DropIndex
DROP INDEX "Offer_candidateId_key";

-- AlterTable
ALTER TABLE "Offer" DROP COLUMN "candidateId",
ADD COLUMN     "vacancyResponseId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Candidate";

-- DropEnum
DROP TYPE "CandidateStatus";

-- CreateTable
CREATE TABLE "VacancyResponse" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "VacancyResponseStatus" NOT NULL DEFAULT 'NEW_APPLICATION',
    "candidateId" TEXT NOT NULL,
    "vacancyId" TEXT NOT NULL,
    "candidateRecommendedByManagerId" TEXT,

    CONSTRAINT "VacancyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VacancyResponse_candidateId_vacancyId_key" ON "VacancyResponse"("candidateId", "vacancyId");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_vacancyResponseId_key" ON "Offer"("vacancyResponseId");

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_vacancyResponseId_fkey" FOREIGN KEY ("vacancyResponseId") REFERENCES "VacancyResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacancyResponse" ADD CONSTRAINT "VacancyResponse_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacancyResponse" ADD CONSTRAINT "VacancyResponse_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "Vacancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacancyResponse" ADD CONSTRAINT "VacancyResponse_candidateRecommendedByManagerId_fkey" FOREIGN KEY ("candidateRecommendedByManagerId") REFERENCES "Manager"("id") ON DELETE SET NULL ON UPDATE CASCADE;
