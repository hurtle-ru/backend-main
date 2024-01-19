/*
  Warnings:

  - You are about to drop the column `isDeleted` on the `Applicant` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Employer` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Vacancy` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Applicant" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Employer" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Meeting" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Vacancy" DROP COLUMN "isDeleted";
