/*
  Warnings:

  - You are about to drop the `_ApplicantToVacancy` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('NEW_APPLICATION', 'SCREENING', 'INTERVIEWING', 'OFFER_MADE', 'HIRED');

-- DropForeignKey
ALTER TABLE "_ApplicantToVacancy" DROP CONSTRAINT "_ApplicantToVacancy_A_fkey";

-- DropForeignKey
ALTER TABLE "_ApplicantToVacancy" DROP CONSTRAINT "_ApplicantToVacancy_B_fkey";

-- DropTable
DROP TABLE "_ApplicantToVacancy";

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "CandidateStatus" NOT NULL DEFAULT 'NEW_APPLICATION',
    "applicantId" TEXT NOT NULL,
    "vacancyId" TEXT NOT NULL,
    "managerId" TEXT,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_applicantId_vacancyId_key" ON "Candidate"("applicantId", "vacancyId");

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "Vacancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Manager"("id") ON DELETE CASCADE ON UPDATE CASCADE;
