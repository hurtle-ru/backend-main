/*
  Warnings:

  - You are about to drop the column `passwordId` on the `Applicant` table. All the data in the column will be lost.
  - You are about to drop the column `passwordId` on the `Employer` table. All the data in the column will be lost.
  - You are about to drop the column `passwordId` on the `Manager` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[applicantId]` on the table `Password` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employerId]` on the table `Password` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[managerId]` on the table `Password` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "VacancyStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- DropForeignKey
ALTER TABLE "Applicant" DROP CONSTRAINT "Applicant_passwordId_fkey";

-- DropForeignKey
ALTER TABLE "Employer" DROP CONSTRAINT "Employer_passwordId_fkey";

-- DropForeignKey
ALTER TABLE "HhToken" DROP CONSTRAINT "HhToken_applicantId_fkey";

-- DropForeignKey
ALTER TABLE "Manager" DROP CONSTRAINT "Manager_passwordId_fkey";

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_applicantId_fkey";

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_employerId_fkey";

-- DropForeignKey
ALTER TABLE "MeetingFeedback" DROP CONSTRAINT "MeetingFeedback_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "MeetingScriptAnswer" DROP CONSTRAINT "MeetingScriptAnswer_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "MeetingScriptProtocol" DROP CONSTRAINT "MeetingScriptProtocol_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "Offer" DROP CONSTRAINT "Offer_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "Offer" DROP CONSTRAINT "Offer_vacancyId_fkey";

-- DropForeignKey
ALTER TABLE "Resume" DROP CONSTRAINT "Resume_applicantId_fkey";

-- DropForeignKey
ALTER TABLE "ResumeCertificate" DROP CONSTRAINT "ResumeCertificate_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "ResumeContact" DROP CONSTRAINT "ResumeContact_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "ResumeEducation" DROP CONSTRAINT "ResumeEducation_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "ResumeExperience" DROP CONSTRAINT "ResumeExperience_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "ResumeLanguage" DROP CONSTRAINT "ResumeLanguage_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "Vacancy" DROP CONSTRAINT "Vacancy_employerId_fkey";

-- DropIndex
DROP INDEX "Applicant_passwordId_key";

-- DropIndex
DROP INDEX "Employer_passwordId_key";

-- DropIndex
DROP INDEX "Manager_passwordId_key";

-- AlterTable
ALTER TABLE "Applicant" DROP COLUMN "passwordId";

-- AlterTable
ALTER TABLE "Employer" DROP COLUMN "passwordId";

-- AlterTable
ALTER TABLE "Manager" DROP COLUMN "passwordId";

-- AlterTable
ALTER TABLE "Offer" ALTER COLUMN "vacancyId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Password" ADD COLUMN     "applicantId" TEXT,
                       ADD COLUMN     "employerId" TEXT,
                       ADD COLUMN     "managerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Password_applicantId_key" ON "Password"("applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "Password_employerId_key" ON "Password"("employerId");

-- CreateIndex
CREATE UNIQUE INDEX "Password_managerId_key" ON "Password"("managerId");

-- AddForeignKey
ALTER TABLE "Password" ADD CONSTRAINT "Password_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Password" ADD CONSTRAINT "Password_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Password" ADD CONSTRAINT "Password_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Manager"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HhToken" ADD CONSTRAINT "HhToken_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacancy" ADD CONSTRAINT "Vacancy_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "Vacancy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeCertificate" ADD CONSTRAINT "ResumeCertificate_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeContact" ADD CONSTRAINT "ResumeContact_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeEducation" ADD CONSTRAINT "ResumeEducation_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeExperience" ADD CONSTRAINT "ResumeExperience_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeLanguage" ADD CONSTRAINT "ResumeLanguage_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingScriptProtocol" ADD CONSTRAINT "MeetingScriptProtocol_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingScriptAnswer" ADD CONSTRAINT "MeetingScriptAnswer_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "MeetingScriptProtocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingFeedback" ADD CONSTRAINT "MeetingFeedback_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
