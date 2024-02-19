-- DropForeignKey
ALTER TABLE "MeetingPayment" DROP CONSTRAINT "MeetingPayment_slotId_fkey";

-- AddForeignKey
ALTER TABLE "MeetingPayment" ADD CONSTRAINT "MeetingPayment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "MeetingSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
