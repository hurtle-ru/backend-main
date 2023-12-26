/*
  Warnings:

  - You are about to drop the column `userId` on the `PasswordResetReqeust` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `PasswordResetReqeust` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `PasswordResetReqeust` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PasswordResetReqeust_userId_key";

-- AlterTable
ALTER TABLE "PasswordResetReqeust" DROP COLUMN "userId",
ADD COLUMN     "email" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetReqeust_email_key" ON "PasswordResetReqeust"("email");
