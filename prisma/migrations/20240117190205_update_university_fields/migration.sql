/*
  Warnings:

  - You are about to drop the column `fullName` on the `University` table. All the data in the column will be lost.
  - You are about to drop the column `shortName` on the `University` table. All the data in the column will be lost.
  - Added the required column `name` to the `University` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "University" DROP COLUMN "fullName",
DROP COLUMN "shortName",
ADD COLUMN     "name" TEXT NOT NULL;
