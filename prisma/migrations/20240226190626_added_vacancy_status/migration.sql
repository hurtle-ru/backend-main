/*
  Warnings:

  - The values [DRAFT,ARCHIVED] on the enum `VacancyStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
DROP TYPE "VacancyStatus";
CREATE TYPE "VacancyStatus" AS ENUM ('UNDER_REVIEW', 'FAILED_TO_PASS_REVIEW', 'PUBLISHED', 'HIDDEN');
COMMIT;

-- AlterTable
ALTER TABLE "Vacancy" ADD COLUMN "status" "VacancyStatus" NOT NULL DEFAULT 'UNDER_REVIEW';
