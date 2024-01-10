/*
  Warnings:

  - Added the required column `hhApplicantId` to the `HhToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HhToken" ADD COLUMN     "hhApplicantId" TEXT NOT NULL;
