/*
  Warnings:

  - You are about to drop the column `userId` on the `AuthByEmailCode` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userEmail,role]` on the table `AuthByEmailCode` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userEmail` to the `AuthByEmailCode` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AuthByEmailCode_userId_role_key";

-- AlterTable
ALTER TABLE "AuthByEmailCode" DROP COLUMN "userId",
ADD COLUMN     "userEmail" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AuthByEmailCode_userEmail_role_key" ON "AuthByEmailCode"("userEmail", "role");
