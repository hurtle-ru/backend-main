/*
  Warnings:

  - You are about to drop the column `endDate` on the `ResumeExperience` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `ResumeExperience` table. All the data in the column will be lost.
  - Added the required column `startMonth` to the `ResumeExperience` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startYear` to the `ResumeExperience` table without a default value. This is not possible if the table is not empty.

*/

-- DataMigration
UPDATE "ResumeExperience"
SET "startMonth" = EXTRACT(MONTH FROM CAST("startDate" AS DATE)),
    "startYear" = EXTRACT(YEAR FROM CAST("startDate" AS DATE)),
    "endMonth" = EXTRACT(MONTH FROM CAST("endDate" AS DATE)),
    "endYear" = EXTRACT(YEAR FROM CAST("endDate" AS DATE));

-- AlterTable
ALTER TABLE "ResumeExperience" DROP COLUMN "endDate",
DROP COLUMN "startDate",
ADD COLUMN     "endMonth" INTEGER,
ADD COLUMN     "endYear" INTEGER,
ADD COLUMN     "startMonth" INTEGER NOT NULL,
ADD COLUMN     "startYear" INTEGER NOT NULL;