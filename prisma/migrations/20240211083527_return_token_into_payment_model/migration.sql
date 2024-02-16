/*
  Warnings:

  - Added the required column `token` to the `MeetingPayment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MeetingPayment" ADD COLUMN     "token" VARCHAR(64) NOT NULL;
