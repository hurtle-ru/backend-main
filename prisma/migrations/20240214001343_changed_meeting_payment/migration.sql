/*
  Warnings:

  - You are about to drop the column `failPaymentCode` on the `MeetingPayment` table. All the data in the column will be lost.
  - You are about to drop the column `successPaymentCode` on the `MeetingPayment` table. All the data in the column will be lost.
  - The required column `failCode` was added to the `MeetingPayment` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `successCode` was added to the `MeetingPayment` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "MeetingPayment" DROP COLUMN "failPaymentCode",
DROP COLUMN "successPaymentCode",
ADD COLUMN     "failCode" VARCHAR(127) NOT NULL,
ADD COLUMN     "successCode" VARCHAR(127) NOT NULL;
