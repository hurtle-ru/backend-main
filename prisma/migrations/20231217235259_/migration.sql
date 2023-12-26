/*
  Warnings:

  - Made the column `firstName` on table `Applicant` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lastName` on table `Applicant` required. This step will fail if there are existing NULL values in that column.
  - Made the column `firstName` on table `Employer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lastName` on table `Employer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Applicant" ALTER COLUMN "firstName" SET NOT NULL,
ALTER COLUMN "middleName" DROP NOT NULL,
ALTER COLUMN "lastName" SET NOT NULL;

-- AlterTable
ALTER TABLE "Employer" ALTER COLUMN "firstName" SET NOT NULL,
ALTER COLUMN "middleName" DROP NOT NULL,
ALTER COLUMN "lastName" SET NOT NULL;
