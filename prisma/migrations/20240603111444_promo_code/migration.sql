/*
  Warnings:

  - You are about to drop the column `uses` on the `PromoCode` table. All the data in the column will be lost.
  - Added the required column `successfulUses` to the `PromoCode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PromoCode" DROP COLUMN "uses",
ADD COLUMN     "successfulUses" INTEGER NOT NULL;
