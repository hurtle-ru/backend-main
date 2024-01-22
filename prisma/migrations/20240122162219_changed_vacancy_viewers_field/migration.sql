/*
  Warnings:

  - You are about to drop the column `viewersCount` on the `Vacancy` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Vacancy" DROP COLUMN "viewersCount",
ADD COLUMN     "uniqueViewerApplicantIds" TEXT[];
