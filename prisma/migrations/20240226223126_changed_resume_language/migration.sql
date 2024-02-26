/*
  Warnings:

  - The `level` column on the `ResumeLanguage` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ResumeLanguage" DROP COLUMN "level",
ADD COLUMN     "level" VARCHAR(20);
