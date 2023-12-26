/*
  Warnings:

  - You are about to drop the column `meetingId` on the `MeetingSlot` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slotId]` on the table `Meeting` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slotId` to the `Meeting` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MeetingSlot" DROP CONSTRAINT "MeetingSlot_meetingId_fkey";

-- DropIndex
DROP INDEX "MeetingSlot_meetingId_key";

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "slotId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MeetingSlot" DROP COLUMN "meetingId";

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_slotId_key" ON "Meeting"("slotId");

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "MeetingSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
