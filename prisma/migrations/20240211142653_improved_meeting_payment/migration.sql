/*
  Warnings:

  - Added the required column `amount` to the `MeetingPayment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kassaPaymentId` to the `MeetingPayment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MeetingPayment" DROP CONSTRAINT "MeetingPayment_slotId_fkey";

-- AlterTable
ALTER TABLE "MeetingPayment" ADD COLUMN     "amount" INTEGER NOT NULL,
ADD COLUMN     "kassaPaymentId" VARCHAR(255) NOT NULL;

-- AddForeignKey
ALTER TABLE "MeetingPayment" ADD CONSTRAINT "MeetingPayment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "MeetingSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
