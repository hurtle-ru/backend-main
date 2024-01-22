-- AlterTable
ALTER TABLE "Vacancy" ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "viewersCount" INTEGER NOT NULL DEFAULT 0;
