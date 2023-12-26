/*
  Warnings:

  - You are about to drop the column `slotId` on the `Meeting` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[meetingId]` on the table `MeetingSlot` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_slotId_fkey";

-- DropIndex
DROP INDEX "Meeting_slotId_key";

-- AlterTable
ALTER TABLE "Meeting" DROP COLUMN "slotId";

-- AlterTable
ALTER TABLE "MeetingSlot" ADD COLUMN     "meetingId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MeetingSlot_meetingId_key" ON "MeetingSlot"("meetingId");

-- AddForeignKey
ALTER TABLE "MeetingSlot" ADD CONSTRAINT "MeetingSlot_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
