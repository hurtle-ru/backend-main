/*
  Warnings:

  - Made the column `vacancyResponseId` on table `Offer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Offer" ALTER COLUMN "vacancyResponseId" SET NOT NULL;
