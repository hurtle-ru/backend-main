/*
  Warnings:

  - The values [HIDDEN] on the enum `VacancyStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VacancyStatus_new" AS ENUM ('UNDER_REVIEW', 'FAILED_TO_PASS_REVIEW', 'PUBLISHED');
ALTER TABLE "Vacancy" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Vacancy" ALTER COLUMN "status" TYPE "VacancyStatus_new" USING ("status"::text::"VacancyStatus_new");
ALTER TYPE "VacancyStatus" RENAME TO "VacancyStatus_old";
ALTER TYPE "VacancyStatus_new" RENAME TO "VacancyStatus";
DROP TYPE "VacancyStatus_old";
ALTER TABLE "Vacancy" ALTER COLUMN "status" SET DEFAULT 'UNDER_REVIEW';
COMMIT;

-- AlterTable
ALTER TABLE "Vacancy" ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false;
