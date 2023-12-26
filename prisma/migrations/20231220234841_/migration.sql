-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_applicantId_fkey";

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_employerId_fkey";

-- AlterTable
ALTER TABLE "Meeting" ALTER COLUMN "applicantId" DROP NOT NULL,
ALTER COLUMN "employerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
