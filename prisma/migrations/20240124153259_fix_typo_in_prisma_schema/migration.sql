/*
  Warnings:

  - You are about to drop the `PasswordResetReqeust` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "PasswordResetReqeust";

-- CreateTable
CREATE TABLE "passwordResetRequest" (
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "passwordResetRequest_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "passwordResetRequest_email_key" ON "passwordResetRequest"("email");
