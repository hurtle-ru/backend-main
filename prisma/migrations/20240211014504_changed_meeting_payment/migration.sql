/*
  Warnings:

  - You are about to drop the column `temporaryEmail` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MeetingPaymentStatus" AS ENUM ('PENDING', 'FAIL', 'SUCCESS');

-- AlterEnum
ALTER TYPE "MeetingType" ADD VALUE 'CONSULTATION_B2C_EXPERT';

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_slotId_fkey";

-- AlterTable
ALTER TABLE "Meeting" DROP COLUMN "temporaryEmail",
ADD COLUMN     "guestEmail" VARCHAR(255);

-- DropTable
DROP TABLE "Order";

-- CreateTable
CREATE TABLE "MeetingPayment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MeetingPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "token" VARCHAR(64) NOT NULL,
    "guestEmail" VARCHAR(255) NOT NULL,
    "slotId" TEXT NOT NULL,

    CONSTRAINT "MeetingPayment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MeetingPayment" ADD CONSTRAINT "MeetingPayment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "MeetingSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
