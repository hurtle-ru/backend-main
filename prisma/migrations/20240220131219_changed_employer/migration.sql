/*
  Warnings:

  - Made the column `name` on table `Employer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Employer" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "inn" DROP NOT NULL;

-- AlterTable
ALTER TABLE "VacancyResponse" ADD COLUMN     "isViewedByEmployer" BOOLEAN NOT NULL DEFAULT false;
