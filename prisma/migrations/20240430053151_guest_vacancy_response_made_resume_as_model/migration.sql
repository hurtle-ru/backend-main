/*
  Warnings:

  - You are about to drop the column `firstName` on the `GuestVacancyResponse` table. All the data in the column will be lost.
  - You are about to drop the column `isReadyToRelocate` on the `GuestVacancyResponse` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `GuestVacancyResponse` table. All the data in the column will be lost.
  - You are about to drop the column `middleName` on the `GuestVacancyResponse` table. All the data in the column will be lost.
  - You are about to drop the column `resume` on the `GuestVacancyResponse` table. All the data in the column will be lost.
  - You are about to drop the column `resumeTitle` on the `GuestVacancyResponse` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GuestVacancyResponse" DROP COLUMN "firstName",
DROP COLUMN "isReadyToRelocate",
DROP COLUMN "lastName",
DROP COLUMN "middleName",
DROP COLUMN "resume",
DROP COLUMN "resumeTitle";

-- CreateTable
CREATE TABLE "GuestVacancyResponseResume" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "importedFrom" "ResumeImportExternalService",
    "importedId" VARCHAR(512),
    "title" VARCHAR(255),
    "firstName" VARCHAR(50),
    "lastName" VARCHAR(50),
    "middleName" VARCHAR(50),
    "isVisibleToEmployers" BOOLEAN NOT NULL DEFAULT true,
    "isReadyToRelocate" BOOLEAN,
    "responseId" TEXT NOT NULL,

    CONSTRAINT "GuestVacancyResponseResume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestVacancyResponseResumeContact" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255),
    "type" "ContactType" NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "preferred" BOOLEAN NOT NULL DEFAULT false,
    "resumeId" TEXT NOT NULL,

    CONSTRAINT "GuestVacancyResponseResumeContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuestVacancyResponseResume_responseId_key" ON "GuestVacancyResponseResume"("responseId");

-- AddForeignKey
ALTER TABLE "GuestVacancyResponseResume" ADD CONSTRAINT "GuestVacancyResponseResume_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "GuestVacancyResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestVacancyResponseResumeContact" ADD CONSTRAINT "GuestVacancyResponseResumeContact_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "GuestVacancyResponseResume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
