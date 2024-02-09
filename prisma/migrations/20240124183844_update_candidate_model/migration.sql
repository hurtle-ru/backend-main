/*
  Warnings:

  - You are about to drop the column `managerId` on the `Candidate` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Candidate" DROP CONSTRAINT "Candidate_managerId_fkey";

-- AlterTable
ALTER TABLE "Candidate" DROP COLUMN "managerId",
ADD COLUMN     "suggestedByManagerId" TEXT;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_suggestedByManagerId_fkey" FOREIGN KEY ("suggestedByManagerId") REFERENCES "Manager"("id") ON DELETE CASCADE ON UPDATE CASCADE;
