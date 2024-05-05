-- CreateEnum
CREATE TYPE "VacancyResponseModerationStatus" AS ENUM ('UNDER_REVIEW', 'FAILED_TO_PASS_REVIEW', 'PUBLISHED');

-- AlterTable
ALTER TABLE "GuestVacancyResponse" ADD COLUMN     "moderationStatus" "VacancyResponseModerationStatus" NOT NULL DEFAULT 'UNDER_REVIEW',
ALTER COLUMN "resume" DROP NOT NULL,
ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL;
