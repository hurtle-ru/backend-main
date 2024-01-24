/*
  Warnings:

  - Made the column `inn` on table `Employer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Employer" ALTER COLUMN "inn" SET NOT NULL;
