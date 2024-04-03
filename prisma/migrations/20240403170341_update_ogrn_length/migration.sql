/*
  Warnings:

  - You are about to alter the column `ogrn` on the `Employer` table. The data in that column could be lost. The data in that column will be cast from `VarChar(15)` to `VarChar(13)`.

*/
-- AlterTable
ALTER TABLE "Employer" ALTER COLUMN "ogrn" SET DATA TYPE VARCHAR(13);
