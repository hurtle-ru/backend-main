/*
  Warnings:

  - You are about to drop the column `vacancyId` on the `Offer` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Offer" DROP CONSTRAINT "Offer_vacancyId_fkey";

-- AlterTable
ALTER TABLE "Offer" DROP COLUMN "vacancyId";
