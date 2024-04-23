/*
  Warnings:

  - Added the required column `firstName` to the `GuestVacancyResponse` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `GuestVacancyResponse` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GuestVacancyResponse" ADD COLUMN     "firstName" VARCHAR(50) NOT NULL,
ADD COLUMN     "isReadyToRelocate" BOOLEAN,
ADD COLUMN     "lastName" VARCHAR(50) NOT NULL,
ADD COLUMN     "middleName" VARCHAR(50);
