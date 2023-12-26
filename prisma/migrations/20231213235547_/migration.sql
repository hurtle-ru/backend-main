/*
  Warnings:

  - Made the column `middleName` on table `Applicant` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `contact` to the `Employer` table without a default value. This is not possible if the table is not empty.
  - Made the column `middleName` on table `Employer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Applicant" ALTER COLUMN "middleName" SET NOT NULL;

-- AlterTable
ALTER TABLE "Employer" ADD COLUMN     "contact" TEXT NOT NULL,
ALTER COLUMN "middleName" SET NOT NULL;
