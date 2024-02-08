/*
  Warnings:

  - A unique constraint covering the columns `[userId,role]` on the table `EmailVerification` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "EmailVerification_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerification_userId_role_key" ON "EmailVerification"("userId", "role");
