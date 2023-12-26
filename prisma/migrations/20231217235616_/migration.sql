/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `EmailVerification` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EmailVerification_email_key" ON "EmailVerification"("email");
