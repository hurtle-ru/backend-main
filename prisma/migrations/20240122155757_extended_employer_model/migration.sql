-- CreateEnum
CREATE TYPE "EmployerSize" AS ENUM ('LESS_THAN_15', 'BETWEEN_15_AND_50', 'BETWEEN_50_AND_100', 'BETWEEN_100_AND_500', 'MORE_THAN_500');

-- AlterTable
ALTER TABLE "Employer" ADD COLUMN     "city" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isStartup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "size" "EmployerSize",
ADD COLUMN     "website" TEXT;
