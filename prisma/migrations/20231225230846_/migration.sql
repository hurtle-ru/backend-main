/*
  Warnings:

  - You are about to drop the column `passwordHash` on the `Applicant` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `Employer` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `Manager` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[passwordId]` on the table `Applicant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passwordId]` on the table `Employer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passwordId]` on the table `Manager` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `passwordId` to the `Applicant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordId` to the `Employer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordId` to the `Manager` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Applicant" DROP COLUMN "passwordHash",
ADD COLUMN     "passwordId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Employer" DROP COLUMN "passwordHash",
ADD COLUMN     "passwordId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Manager" DROP COLUMN "passwordHash",
ADD COLUMN     "passwordId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Password" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,

    CONSTRAINT "Password_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_passwordId_key" ON "Applicant"("passwordId");

-- CreateIndex
CREATE UNIQUE INDEX "Employer_passwordId_key" ON "Employer"("passwordId");

-- CreateIndex
CREATE UNIQUE INDEX "Manager_passwordId_key" ON "Manager"("passwordId");

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_passwordId_fkey" FOREIGN KEY ("passwordId") REFERENCES "Password"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employer" ADD CONSTRAINT "Employer_passwordId_fkey" FOREIGN KEY ("passwordId") REFERENCES "Password"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manager" ADD CONSTRAINT "Manager_passwordId_fkey" FOREIGN KEY ("passwordId") REFERENCES "Password"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
