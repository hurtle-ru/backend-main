/*
  Warnings:

  - The values [UAH] on the enum `Currency` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Currency_new" AS ENUM ('RUB', 'USD', 'EUR', 'GBP', 'GEL', 'AZN', 'BYR', 'KGS', 'KZT', 'UZS');
ALTER TABLE "Vacancy" ALTER COLUMN "salaryCurrency" TYPE "Currency_new" USING ("salaryCurrency"::text::"Currency_new");
ALTER TABLE "Offer" ALTER COLUMN "salaryCurrency" TYPE "Currency_new" USING ("salaryCurrency"::text::"Currency_new");
ALTER TABLE "Resume" ALTER COLUMN "desiredSalaryCurrency" TYPE "Currency_new" USING ("desiredSalaryCurrency"::text::"Currency_new");
ALTER TYPE "Currency" RENAME TO "Currency_old";
ALTER TYPE "Currency_new" RENAME TO "Currency";
DROP TYPE "Currency_old";
COMMIT;

-- AlterTable
ALTER TABLE "University" ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "shortName" TEXT;
