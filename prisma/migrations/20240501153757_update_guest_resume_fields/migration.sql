-- AlterTable
ALTER TABLE "GuestVacancyResponseResume" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "skills" VARCHAR(5000)[],
ADD COLUMN     "summary" VARCHAR(5000);
