-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_slotId_fkey";

-- DropForeignKey
ALTER TABLE "MeetingSlot" DROP CONSTRAINT "MeetingSlot_managerId_fkey";

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "MeetingSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingSlot" ADD CONSTRAINT "MeetingSlot_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Manager"("id") ON DELETE CASCADE ON UPDATE CASCADE;
