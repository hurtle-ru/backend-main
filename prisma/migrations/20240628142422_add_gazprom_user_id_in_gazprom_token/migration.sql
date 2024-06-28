/*
  Warnings:

  - A unique constraint covering the columns `[gazpromUserId]` on the table `GazpromToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `gazpromUserId` to the `GazpromToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GazpromToken" ADD COLUMN     "gazpromUserId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "GazpromToken_gazpromUserId_key" ON "GazpromToken"("gazpromUserId");
