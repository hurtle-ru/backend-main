/*
  Warnings:

  - Added the required column `code` to the `passwordResetRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "passwordResetRequest" ADD COLUMN     "code" TEXT NOT NULL;
