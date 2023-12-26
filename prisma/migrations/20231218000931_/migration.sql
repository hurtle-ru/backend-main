/*
  Warnings:

  - The primary key for the `EmailVerification` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `email` on the `EmailVerification` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `EmailVerification` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `EmailVerification` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `EmailVerification` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "EmailVerification_email_key";

-- AlterTable
ALTER TABLE "EmailVerification" DROP CONSTRAINT "EmailVerification_pkey",
DROP COLUMN "email",
DROP COLUMN "id",
ADD COLUMN     "userId" TEXT NOT NULL,
ADD CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("code");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerification_userId_key" ON "EmailVerification"("userId");
