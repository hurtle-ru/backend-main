/*
  Warnings:

  - The required column `failPaymentCode` was added to the `MeetingPayment` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `successPaymentCode` was added to the `MeetingPayment` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "MeetingPayment" ADD COLUMN     "failPaymentCode" VARCHAR(127) NOT NULL,
ADD COLUMN     "successPaymentCode" VARCHAR(127) NOT NULL;
