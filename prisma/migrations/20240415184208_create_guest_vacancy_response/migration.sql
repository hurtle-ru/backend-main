-- AlterTable
ALTER TABLE "Offer" ALTER COLUMN "vacancyResponseId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "GuestVacancyResponse" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "text" VARCHAR(3000) NOT NULL,
    "status" "VacancyResponseStatus" NOT NULL DEFAULT 'NEW_APPLICATION',
    "isViewedByEmployer" BOOLEAN NOT NULL DEFAULT false,
    "resume" JSONB NOT NULL,
    "vacancyId" TEXT NOT NULL,

    CONSTRAINT "GuestVacancyResponse_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GuestVacancyResponse" ADD CONSTRAINT "GuestVacancyResponse_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "Vacancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
