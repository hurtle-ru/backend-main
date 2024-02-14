/*
  Warnings:

  - A unique constraint covering the columns `[slotId]` on the table `MeetingPayment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MeetingPayment_slotId_key" ON "MeetingPayment"("slotId");
